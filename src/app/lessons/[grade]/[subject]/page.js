"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { curriculum } from "@/data/curriculum";

export default function SubjectHome() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [localCurriculum, setLocalCurriculum] = useState(curriculum);
  const grade = decodeURIComponent(params.grade);
  const subjectTitle = decodeURIComponent(params.subject);

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

  if (!subjectData) return (
    <div className="flex-center" style={{ height: "100vh", flexDirection: "column", gap: "2rem" }}>
      <h2>Subject not found! 😿</h2>
      <button className="btn-secondary" onClick={() => router.push("/dashboard")}>Back</button>
    </div>
  );

  return (
    <div className="container" style={{ padding: "clamp(2rem, 8vw, 6rem) 0" }}>
      <header style={{ marginBottom: "3rem", textAlign: "center" }}>
         <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)" }}>{subjectTitle} Academy 📄</h1>
         <p style={{ opacity: 0.6, fontSize: "1.2rem" }}>Follow the path of the scholar kitten!</p>
      </header>
      
      <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        {subjectData.lessons.map((lesson, index) => (
          <div 
            key={lesson.id} 
            className="premium-card" 
            style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              cursor: "pointer", 
              padding: "1.5rem 2rem",
              background: lesson.type === "final" ? "linear-gradient(135deg, #fff5f8 0%, #f0f7ff 100%)" : "white",
              border: lesson.type === "final" ? "2px solid var(--primary-color)" : "1px solid rgba(0,0,0,0.05)"
            }}
            onClick={() => router.push(`/lessons/${grade}/${subjectTitle}/${lesson.id}`)}
          >
            <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
               <div style={{ 
                 width: "45px", 
                 height: "45px", 
                 borderRadius: "50%", 
                 background: lesson.type === "lecture" ? "#eef6ff" : (lesson.type === "quiz" ? "#fff5f8" : "var(--primary-color)"),
                 display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: "bold", color: lesson.type === "final" ? "white" : "inherit"
               }}>
                  {lesson.type === "lecture" ? "📖" : (lesson.type === "quiz" ? index + 1 : "🏆")}
               </div>
               <div>
                 <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{lesson.title}</h3>
                 <p style={{ margin: 0, opacity: 0.5, fontSize: "0.85rem" }}>
                   {lesson.type === "lecture" ? "Reading Material" : (lesson.type === "quiz" ? "Testing your knowledge" : "Final Challenge")}
                 </p>
               </div>
            </div>
            <button className="btn-secondary" style={{ padding: "8px 20px" }}>
              {lesson.type === "lecture" ? "Study" : "Start"} 🐾
            </button>
          </div>
        ))}
      </div>

      <button className="btn-secondary" style={{ display: "block", margin: "4rem auto 0", opacity: 0.5 }} onClick={() => router.push("/dashboard")}>← Quit to Dashboard</button>
    </div>
  );
}
