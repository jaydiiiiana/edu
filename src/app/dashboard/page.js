"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { curriculum } from "@/data/curriculum";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [joinCode, setJoinCode] = useState("");
  const [unlockedSubjects, setUnlockedSubjects] = useState([]);
  const [fullCurriculum, setFullCurriculum] = useState(curriculum);

  useEffect(() => {
    const fetchData = async () => {
      const storedUser = localStorage.getItem("catUser");
      if (!storedUser) {
        router.push("/");
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      try {
        // Refresh User Role from DB
        const userRes = await fetch(`/api/users/${parsedUser.id}`);
        const userLatest = await userRes.json();
        if (userLatest && userLatest.role !== parsedUser.role) {
           const updated = { ...parsedUser, role: userLatest.role };
           localStorage.setItem("catUser", JSON.stringify(updated));
           setUser(updated);
        }

        const activeRole = (userLatest && userLatest.role) || parsedUser.role;
        const currRes = await fetch(`/api/curriculum?userId=${parsedUser.id}&role=${activeRole}`);
        const currData = await currRes.json();
        
        const storedProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
        setProgress(storedProgress);
        
        const unlocked = JSON.parse(localStorage.getItem("catUnlocked") || "[]");
        setUnlockedSubjects(unlocked);

        if (currData.error) throw new Error(currData.error);

        // Merge curriculum
        const baseCurr = { ...curriculum };
        Object.keys(currData).forEach(grade => {
          if (!Array.isArray(currData[grade])) return; // Skip non-array items like errors
          if (!baseCurr[grade]) baseCurr[grade] = [];
          
          currData[grade].forEach(subj => {
            const existing = baseCurr[grade].find(s => s.title === subj.title);
            if (existing) {
              existing.lessons = [...existing.lessons, ...subj.lessons];
              existing.students = subj.students;
            } else {
              baseCurr[grade].push(subj);
            }
          });
        });
        setFullCurriculum(baseCurr);
      } catch (e) { console.error("Data fetch failed", e); }
    };
    fetchData();
  }, [router]);

  const handleJoinSubject = async () => {
    if (!joinCode || !user) return;
    try {
      const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          joinSubjectCode: joinCode.toUpperCase()
        })
      });

      const data = await response.json();
      if (data.success) {
        alert("🔓 Success! You've joined the class!");
        window.location.reload();
      } else throw new Error(data.error);
    } catch (e) { alert("Invalid Code! 😿 " + e.message); }
  };

  if (!user) return <div className="flex-center" style={{ height: "100vh" }}>Loading...</div>;

  const gradeSubjects = fullCurriculum[user.grade] || [];
  const allSubjects = gradeSubjects.filter(s => {
    const isBase = curriculum[user.grade]?.some(bs => bs.title === s.title);
    const hasJoined = s.students?.includes(user.name);
    const isAdmin = user.role === 'Headmaster' || user.role === 'Teacher';
    return isBase || hasJoined || isAdmin;
  });

  const getProgressPercent = (subjTitle) => {
    const subjProgress = progress[user.grade]?.[subjTitle] || [];
    const subjData = allSubjects.find(s => s.title === subjTitle);
    if (!subjData || subjData.lessons.length === 0) return 0;
    return Math.round((subjProgress.length / subjData.lessons.length) * 100);
  };

  return (
    <div className="container" style={{ paddingBottom: "5rem" }}>
      <header className="premium-card" style={{ 
        marginBottom: "3rem", 
        background: "linear-gradient(135deg, var(--primary-color), var(--accent-pink))", 
        color: "white", 
        padding: "clamp(1.5rem, 5vw, 3rem)",
        display: "flex",
        flexDirection: "column",
        gap: "2rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "clamp(1.8rem, 5vw, 3rem)", marginBottom: "0.4rem" }}>Hi, {user.name}! 🐾</h1>
            <p style={{ fontSize: "1.1rem", opacity: 0.9 }}>Welcome to your <strong>{user.grade}</strong> classroom!</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "1rem 2rem", borderRadius: "20px", backdropFilter: "blur(10px)", textAlign: "center" }}>
            <div style={{ fontSize: "0.8rem", fontWeight: "800", textTransform: "uppercase", marginBottom: "3px" }}>Level</div>
            <div style={{ fontSize: "2.5rem", fontWeight: "800" }}>{user.level}</div>
          </div>
        </div>

        <div className="join-bar" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", width: "100%" }}>
           <div style={{ flex: "1 1 300px", background: "rgba(255,255,255,0.15)", padding: "8px", borderRadius: "50px", display: "flex", gap: "10px", border: "1px solid rgba(255,255,255,0.2)" }}>
              <input 
                type="text" 
                placeholder="Enter Invite Code (CAT-ABCD)" 
                style={{ flex: 1, background: "none", border: "none", color: "white", padding: "0 15px", fontSize: "0.9rem", outline: "none", fontWeight: "600" }} 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button className="btn-primary" style={{ background: "white", color: "var(--primary-color)", padding: "8px 20px", fontSize: "0.85rem", boxShadow: "none" }} onClick={handleJoinSubject}>Join Class 🏫</button>
           </div>
           <div className="nav-buttons" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
             {(user.role === 'Headmaster' || user.role === 'Teacher') && (
               <button className="btn-secondary" style={{ background: "rgba(0,0,0,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)" }} onClick={() => router.push("/admin")}>Admin Panel 👑</button>
             )}
             <button className="btn-secondary" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "none" }} onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}>Logout 🚪</button>
           </div>
        </div>
      </header>

      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.8rem" }}>My Subjects 📚</h2>
        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>{allSubjects.length} Active Courses</span>
      </div>

      <div className="grid-cols">
        {allSubjects.map((subj) => {
          const pct = getProgressPercent(subj.title);
          return (
            <div key={subj.id} className="premium-card subject-card" onClick={() => router.push(`/lessons/${user.grade}/${subj.title}`)} style={{ cursor: "pointer" }}>
              <div style={{ background: "linear-gradient(135deg, #fff5f8 0%, #f0f7ff 100%)", padding: "2rem", borderRadius: "20px", marginBottom: "1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <span style={{ fontSize: "4.5rem", display: "block", position: "relative", zIndex: 1 }} className="animate-bounce">{subj.icon}</span>
                <div style={{ position: "absolute", bottom: "-10px", right: "-10px", fontSize: "5rem", opacity: 0.05, transform: "rotate(-15deg)" }}>{subj.icon}</div>
              </div>
              <h3 style={{ fontSize: "1.4rem", marginBottom: "0.5rem" }}>{subj.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.2rem" }}>{subj.lessons.length} Modules</p>
              <div className="progress-container" style={{ height: "8px", marginBottom: "1.5rem" }}>
                <div className="progress-filler" style={{ width: `${pct}%`, background: pct === 100 ? "var(--accent-green)" : "var(--primary-color)" }}></div>
              </div>
              <button className="btn-secondary" style={{ width: "100%", padding: "12px", fontSize: "0.85rem" }}>
                {pct === 100 ? "Review Content 🎓" : "Start Learning 🐾"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
