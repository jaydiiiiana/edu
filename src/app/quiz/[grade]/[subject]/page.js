"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { curriculum } from "@/data/curriculum";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const grade = decodeURIComponent(params.grade);
  const subjectTitle = decodeURIComponent(params.subject);

  useEffect(() => {
    const storedUser = localStorage.getItem("catUser");
    if (!storedUser) {
      router.push("/");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  if (!user) return <div className="flex-center" style={{ height: "100vh" }}>Loading...</div>;

  const staticGradeData = curriculum[grade] || [];
  const customData = JSON.parse(localStorage.getItem("customCurriculum") || "{}");
  const customGradeData = customData[grade] || [];
  const allGradeData = [...staticGradeData, ...customGradeData];

  const subjectData = allGradeData.find((s) => s.title === subjectTitle);
  const questions = subjectData?.subjects[0]?.questions || [];

  if (questions.length === 0) return (
    <div className="flex-center" style={{ height: "100vh", flexDirection: "column", gap: "2rem" }}>
      <h2>Oops! No questions found for {grade} / {subjectTitle} 😿</h2>
      <button className="btn-secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard 🐾</button>
    </div>
  );

  const handleAnswer = (option) => {
    if (isAnswered) return;
    setSelectedOption(option);
    setIsAnswered(true);
    if (option === questions[currentQuestionIndex].a) {
      setScore(score + 10);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      // Update User EXP
      const updatedUser = { ...user, exp: user.exp + score, level: Math.floor((user.exp + score) / 100) + 1 };
      localStorage.setItem("catUser", JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  };

  if (isFinished) {
    return (
      <div className="flex-center" style={{ height: "100vh", padding: "2rem" }}>
        <div className="premium-card" style={{ maxWidth: "500px", width: "100%", textAlign: "center" }}>
          <span style={{ fontSize: "5rem" }}>🏆</span>
          <h1>Quizzed Out! 🐾</h1>
          <p style={{ margin: "1rem 0" }}>Great work! You scored {score} points!</p>
          <div style={{ background: "var(--primary-light)", padding: "1.5rem", borderRadius: "1.5rem", marginBottom: "2rem" }}>
             <p>New Level: <strong>{user.level}</strong></p>
             <p>Total EXP: <strong>{user.exp}</strong></p>
          </div>
          <button className="btn-primary" onClick={() => router.push("/dashboard")}>Return to Dashboard 🐾</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="container" style={{ padding: "clamp(1rem, 5vw, 4rem) 0" }}>
      <div className="premium-card cat-ears" style={{ maxWidth: "800px", margin: "0 auto", position: "relative", padding: "clamp(1.5rem, 5vw, 3rem)" }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "clamp(1.2rem, 4vw, 2rem)" }}>{subjectTitle} Quiz 🐾</h2>
        
        {/* Progress Tracker */}
        <div style={{ width: "100%", background: "#eee", height: "10px", borderRadius: "10px", marginBottom: "2.5rem", position: "relative" }}>
          <div style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`, height: "100%", background: "var(--accent-blue)", borderRadius: "10px", transition: "width 0.5s cubic-bezier(0.1, 0, 0.1, 1)" }}></div>
          <span style={{ position: "absolute", top: "12px", right: 0, fontSize: "0.8rem", fontWeight: "bold", opacity: 0.5 }}>Question {currentQuestionIndex + 1} of {questions.length}</span>
        </div>

        <div style={{ marginBottom: "2.5rem", marginTop: "1rem" }}>
          <h3 style={{ fontSize: "clamp(1.4rem, 5vw, 2rem)", marginBottom: "2rem", lineHeight: "1.4" }}>{currentQ.q}</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1.2rem" }}>
            {currentQ.options.map((opt, i) => (
              <button 
                key={i} 
                className={`premium-card ${selectedOption === opt ? (opt === currentQ.a ? "correct" : "wrong") : ""}`}
                style={{ 
                  cursor: isAnswered ? "default" : "pointer", 
                  padding: "1.2rem", 
                  fontSize: "clamp(1rem, 3vw, 1.2rem)", 
                  border: "3px solid",
                  borderColor: selectedOption === opt ? "var(--primary-color)" : "transparent",
                  background: isAnswered && opt === currentQ.a ? "#e6ffec" : (selectedOption === opt ? "#fff5f8" : "#fff"),
                  color: isAnswered && opt === currentQ.a ? "#2d2d2d" : "inherit",
                  textAlign: "center"
                }}
                disabled={isAnswered}
                onClick={() => handleAnswer(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {isAnswered && (
          <div style={{ marginTop: "3rem", display: "flex", justifyContent: "center" }}>
            <button className="btn-primary" style={{ padding: "1.2rem 4rem", width: "min(400px, 100%)" }} onClick={handleNext}>
              {currentQuestionIndex < questions.length - 1 ? "Next Question 🐾" : "Finish Quiz 🐾"}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .correct { border-color: var(--accent-green) !important; background: #e6ffec !important; font-weight: 800; }
        .wrong { border-color: #ff5e5e !important; background: #ffe6e6 !important; font-weight: 800; }
      `}</style>
    </div>
  );
}
