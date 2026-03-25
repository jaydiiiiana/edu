"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { curriculum } from "@/data/curriculum";

export default function W3StyleLessonPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [localCurriculum, setLocalCurriculum] = useState(curriculum);
  
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);

  const grade = decodeURIComponent(params.grade);
  const subjectTitle = decodeURIComponent(params.subject);
  const lessonId = params.lesson_id;

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("catUser");
      if (!storedUser) {
        router.push("/");
        return;
      }
      setUser(JSON.parse(storedUser));
      
      const res = await fetch("/api/curriculum");
      if (!res.ok) return;
      const currData = await res.json();
      
      const baseCurr = { ...curriculum };
      Object.keys(currData).forEach(g => {
        if (!baseCurr[g]) baseCurr[g] = [];
        // Append all subjects without merging by title
        baseCurr[g] = [...baseCurr[g], ...currData[g]];
      });
      setLocalCurriculum(baseCurr);
    };
    fetchData();
  }, [router, grade]);

  if (!user) return <div className="flex-center" style={{ height: "100vh" }}>Loading...</div>;

  // Find the SPECIFIC subject that contains this lesson ID
  const subjectsInGrade = localCurriculum[grade] || [];
  const subjectData = subjectsInGrade.find(s => s.lessons?.some(l => l.id == lessonId)) || 
                     subjectsInGrade.find(s => s.title === subjectTitle); // fallback
  
  const lessonsInSubject = subjectData?.lessons || [];

  const lesson = lessonsInSubject.find(l => l.id == lessonId); // Use == for ID match
  const lessonIdx = lessonsInSubject.findIndex(l => l.id == lessonId);

  useEffect(() => {
    if (lesson && lesson.type === "quiz") {
      const currentProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
      const isDone = currentProgress[grade]?.[subjectTitle]?.includes(lessonId);
      if (isDone) {
        setFinished(true);
        setAlreadyDone(true);
      }
    }
  }, [lesson, grade, subjectTitle, lessonId]);

  if (!lesson) return <div>Lesson not found 😿</div>;

  const saveProgress = () => {
    const currentProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
    if (!currentProgress[grade]) currentProgress[grade] = {};
    if (!currentProgress[grade][subjectTitle]) currentProgress[grade][subjectTitle] = [];
    if (!currentProgress[grade][subjectTitle].includes(lessonId)) {
      currentProgress[grade][subjectTitle].push(lessonId);
    }
    localStorage.setItem("catProgress", JSON.stringify(currentProgress));
  };

  const handleAnswer = async (option) => {
    if (isAnswered) return;
    setSelected(option);
    setIsAnswered(true);
    
    // Check answer server-side
    try {
      const res = await fetch(`/api/lessons/${lessonId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionIndex: qIndex, answer: option })
      });
      const data = await res.json();
      setCorrectAnswer(data.correctAnswer);
      if (data.correct) setScore(score + 10);
    } catch (e) {
      console.error("Answer check failed", e);
    }
  };

  const handleNextInQuiz = () => {
    if (qIndex < lesson.questions.length - 1) {
      setQIndex(qIndex + 1);
      setSelected(null);
      setIsAnswered(false);
      setCorrectAnswer(null);
    } else {
      setFinished(true);
      saveProgress();
      const updatedUser = { ...user, exp: user.exp + score };
      localStorage.setItem("catUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  const goToLesson = (id) => {
    router.push(`/lessons/${grade}/${subjectTitle}/${id}`);
    setSidebarOpen(false);
    // Reset internal states
    setQIndex(0); setScore(0); setFinished(false); setSelected(null); setIsAnswered(false); setCorrectAnswer(null);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#fdfdfd" }}>
      
      {/* Sidebar - W3Schools Style */}
      <aside style={{ 
        width: "280px", 
        background: "white", 
        borderRight: "1px solid #eee", 
        height: "100vh", 
        position: "fixed", 
        overflowY: "auto",
        zIndex: 1000,
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease",
        left: 0,
        top: 0
      }} className="desktop-sidebar">
        <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #f0f0f0", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--primary-light)", color: "var(--primary-color)" }}>
           <span style={{ fontSize: "0.9rem", letterSpacing: "0.5px" }}>📚 CHAPTERS</span>
           <button className="mobile-only" onClick={() => setSidebarOpen(false)} style={{ border: "none", background: "none", fontSize: "1.8rem", color: "var(--primary-color)", cursor: "pointer" }}>×</button>
        </div>

        <nav style={{ padding: "1rem 0" }}>
          {lessonsInSubject.map((l, idx) => (
            <div 
              key={l.id} 
              onClick={() => goToLesson(l.id)}
              style={{ 
                padding: "12px 2rem", 
                cursor: "pointer", 
                background: l.id === lessonId ? "var(--primary-light)" : "transparent",
                color: l.id === lessonId ? "var(--primary-color)" : "inherit",
                fontWeight: l.id === lessonId ? "800" : "400",
                fontSize: "0.95rem",
                borderLeft: l.id === lessonId ? "5px solid var(--primary-color)" : "5px solid transparent"
              }}
            >
              {idx + 1}. {l.title}
            </div>
          ))}
        </nav>
      </aside>


      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div 
          className="mobile-only" 
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", zIndex: 999, backdropFilter: "blur(2px)" }}
        />
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: "5rem" }} className="main-content">
        
        {/* Top bar for mobile */}
        <div className="mobile-only-flex" style={{ padding: "0.8rem 1rem", borderBottom: "1px solid #eee", display: "flex", gap: "10px", alignItems: "center", background: "white", position: "sticky", top: 0, zIndex: 50 }}>
           <button className="btn-secondary" style={{ padding: "8px 15px", fontSize: "0.8rem", border: "1px solid var(--primary-color)", background: "var(--primary-light)", color: "var(--primary-color)" }} onClick={() => setSidebarOpen(true)}>☰ Chapters</button>
           <span style={{ fontWeight: "800", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lesson.title}</span>
        </div>


        {/* Lesson Header */}
        <header style={{ padding: "clamp(2rem, 5vw, 4rem) 2rem", background: "white", borderBottom: "1px solid #f9f9f9" }}>
           <div className="container" style={{ maxWidth: "800px", margin: "0" }}>
             <h1 style={{ fontSize: "clamp(1.8rem, 5vw, 3rem)", marginBottom: "1rem" }}>{lesson.title}</h1>
             <p style={{ opacity: 0.5 }}>{grade} • Part of {subjectTitle} Course</p>
           </div>
        </header>

        {/* Actual Content */}
        <div className="container" style={{ maxWidth: "800px", margin: "0", padding: "3rem 2rem" }}>
           
            {lesson.type === "lecture" ? (
              <div style={{ fontSize: "1.2rem", lineHeight: "1.8", color: "#333", minHeight: "300px" }}>
                 {lesson.media_url && (
                    <div style={{ marginBottom: "2rem", borderRadius: "16px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
                       {lesson.media_url.includes('youtube.com') || lesson.media_url.includes('youtu.be') ? (
                          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                             <iframe 
                                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                                src={`https://www.youtube.com/embed/${lesson.media_url.split('v=')[1] || lesson.media_url.split('/').pop()}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                             ></iframe>
                          </div>
                       ) : (
                          <img src={lesson.media_url} alt={lesson.title} style={{ width: "100%", height: "auto", display: "block" }} />
                       )}
                    </div>
                 )}
                 <div style={{ whiteSpace: "pre-wrap" }}>{lesson.content}</div>
              </div>
           ) : (
             <div className="quiz-container">
                {finished ? (
                  <div className="premium-card" style={{ textAlign: "center", padding: "3rem" }}>
                     <h2>Quiz Finished! 🎉</h2>
                     <p>{alreadyDone ? "You have already completed this exam! ✅" : `You earned ${score} EXP points.`}</p>
                     <button className="btn-primary" onClick={() => {
                        if (lessonIdx < lessonsInSubject.length - 1) goToLesson(lessonsInSubject[lessonIdx+1].id);
                        else router.push(`/dashboard`);
                     }}>
                        {lessonIdx < lessonsInSubject.length - 1 ? "Next Chapter 🐾" : "Return Home"}
                     </button>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ marginBottom: "2rem" }}>{lesson.questions[qIndex].q}</h3>
                    <div style={{ display: "grid", gap: "1rem" }}>
                      {lesson.questions[qIndex].options.map((opt, i) => (
                        <button 
                          key={i} 
                          className={`premium-card ${selected === opt ? (opt === correctAnswer ? "correct" : "wrong") : (isAnswered && opt === correctAnswer ? "correct" : "")}`}
                          onClick={() => handleAnswer(opt)}
                          disabled={isAnswered}
                          style={{ padding: "1.5rem", textAlign: "left" }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {isAnswered && (
                      <button className="btn-primary" style={{ marginTop: "2rem", width: "100%" }} onClick={handleNextInQuiz}>
                        {qIndex < lesson.questions.length - 1 ? "Next Question" : "Finish Quiz"}
                      </button>
                    )}
                  </div>
                )}
             </div>
           )}

           {/* W3Schools Style Next/Prev Buttons */}
           <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5rem", borderTop: "1px solid #eee", paddingTop: "2rem" }}>
              <button 
                className="btn-secondary" 
                disabled={lessonIdx === 0}
                onClick={() => goToLesson(lessonsInSubject[lessonIdx-1].id)}
              >
                ❮ Previous
              </button>
              <button 
                className="btn-primary" 
                style={{ padding: "10px 40px" }}
                onClick={() => {
                  if (lesson.type === "lecture") saveProgress();
                  if (lessonIdx < lessonsInSubject.length - 1) goToLesson(lessonsInSubject[lessonIdx+1].id);
                  else router.push(`/lessons/${grade}/${subjectTitle}`);
                }}
              >
                {lessonIdx < lessonsInSubject.length - 1 ? "Next ❯" : "Subject Home"}
              </button>
           </div>
        </div>
      </main>

      <style jsx>{`
        @media (min-width: 769px) {
          .desktop-sidebar { transform: translateX(0) !important; }
          .mobile-only, .mobile-only-flex { display: none !important; }
          .main-content { margin-left: 280px !important; }
        }
        @media (max-width: 768px) {
          .mobile-only { display: block !important; }
          .mobile-only-flex { display: flex !important; }
          .main-content { margin-left: 0 !important; }
          header { padding: 2rem 1rem !important; }
          .container { padding: 1.5rem 1rem !important; }
        }

        .correct { border: 2px solid var(--accent-green) !important; background: #e6ffec !important; font-weight: 800; }
        .wrong { border: 2px solid #ff5e5e !important; background: #ffe6e6 !important; font-weight: 800; }
      `}</style>
    </div>
  );
}
