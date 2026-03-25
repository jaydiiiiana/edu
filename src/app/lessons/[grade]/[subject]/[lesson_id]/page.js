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

  const grade = decodeURIComponent(params.grade);
  const subjectTitle = decodeURIComponent(params.subject);
  const lessonId = parseInt(params.lesson_id);

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("catUser");
      if (!storedUser) {
        router.push("/");
        return;
      }
      setUser(JSON.parse(storedUser));
      
      const res = await fetch("/api/curriculum");
      const currData = await res.json();
      
      const baseCurr = { ...curriculum };
      Object.keys(currData).forEach(g => {
        if (!baseCurr[g]) baseCurr[g] = [];
        currData[g].forEach(subj => {
          const existing = baseCurr[g].find(s => s.title === subj.title);
          if (existing) {
            existing.lessons = [...existing.lessons, ...subj.lessons];
          } else {
            baseCurr[g].push(subj);
          }
        });
      });
      setLocalCurriculum(baseCurr);
    };
    fetchData();
  }, [router, grade]);

  if (!user) return <div className="flex-center" style={{ height: "100vh" }}>Loading...</div>;

  const subjectData = localCurriculum[grade]?.find((s) => s.title === subjectTitle);
  const lessonsInSubject = subjectData?.lessons || [];
  const lesson = lessonsInSubject.find(l => l.id == lessonId); // Use == for ID match
  const lessonIdx = lessonsInSubject.findIndex(l => l.id == lessonId);

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
        <div style={{ padding: "2rem", borderBottom: "1px solid #f0f0f0", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
           <span>{subjectTitle} Chapters</span>
           <button className="mobile-only" onClick={() => setSidebarOpen(false)} style={{ border: "none", background: "none", fontSize: "1.5rem" }}>×</button>
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

      {/* Main Content Area */}
      <main style={{ flex: 1, marginLeft: "var(--sidebar-offset, 280px)", paddingBottom: "5rem" }}>
        
        {/* Top bar for mobile */}
        <div className="mobile-only" style={{ padding: "1rem", borderBottom: "1px solid #eee", display: "flex", gap: "1rem", alignItems: "center" }}>
           <button className="btn-secondary" style={{ padding: "8px 12px" }} onClick={() => setSidebarOpen(true)}>☰ Chapters</button>
           <span style={{ fontWeight: "bold" }}>{lesson.title}</span>
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
                {lesson.content}
             </div>
           ) : (
             <div className="quiz-container">
                {finished ? (
                  <div className="premium-card" style={{ textAlign: "center", padding: "3rem" }}>
                     <h2>Quiz Finished! 🎉</h2>
                     <p>You earned {score} EXP points.</p>
                     <button className="btn-primary" onClick={() => {
                        if (lessonIdx < lessonsInSubject.length - 1) goToLesson(lessonsInSubject[lessonIdx+1].id);
                        else router.push(`/lessons/${grade}/${subjectTitle}`);
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
          .mobile-only { display: none !important; }
          :root { --sidebar-offset: 280px; }
        }
        @media (max-width: 768px) {
          main { marginLeft: 0 !important; }
          .mobile-only { display: flex !important; }
        }
        .correct { border: 2px solid var(--accent-green) !important; background: #e6ffec !important; font-weight: 800; }
        .wrong { border: 2px solid #ff5e5e !important; background: #ffe6e6 !important; font-weight: 800; }
      `}</style>
    </div>
  );
}
