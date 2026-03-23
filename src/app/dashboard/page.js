"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [joinCode, setJoinCode] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

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
        if (userLatest && userLatest.role && userLatest.role !== parsedUser.role) {
           const updated = { ...parsedUser, role: userLatest.role };
           localStorage.setItem("catUser", JSON.stringify(updated));
           setUser(updated);
        }

        const activeRole = (userLatest && userLatest.role) || parsedUser.role || 'Student';
        const currRes = await fetch(`/api/curriculum?userId=${parsedUser.id}&role=${activeRole}`);
        const currData = await currRes.json();
        
        const storedProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
        setProgress(storedProgress);

        if (currData.error) {
          console.error("Curriculum error:", currData.error);
          setAllSubjects([]);
          return;
        }

        // Flatten all grades into a single subject list
        const subjects = [];
        Object.keys(currData).forEach(grade => {
          if (!Array.isArray(currData[grade])) return;
          currData[grade].forEach(subj => {
            subjects.push({ ...subj, grade });
          });
        });
        setAllSubjects(subjects);
      } catch (e) { 
        console.error("Data fetch failed", e); 
        setAllSubjects([]);
      } finally {
        setLoading(false);
      }
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
        alert("🎉 Success! You've joined the class!");
        window.location.reload();
      } else throw new Error(data.error);
    } catch (e) { alert("Invalid Code! 😿 " + e.message); }
  };

  if (!user || loading) return <div className="flex-center" style={{ height: "100vh" }}>Loading... 🐾</div>;

  const getProgressPercent = (subj) => {
    const subjProgress = progress[subj.grade]?.[subj.title] || [];
    if (!subj.lessons || subj.lessons.length === 0) return 0;
    return Math.round((subjProgress.length / subj.lessons.length) * 100);
  };

  return (
    <div className="container" style={{ paddingBottom: "5rem" }}>
      <header className="premium-card" style={{ 
        marginBottom: "2rem", 
        background: "linear-gradient(135deg, var(--primary-color), var(--accent-pink))", 
        color: "white", 
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "clamp(1.2rem, 4vw, 2.5rem)", marginBottom: "0.2rem" }}>Hi, {user.name}! 🐾</h1>
            <p style={{ fontSize: "clamp(0.8rem, 2.5vw, 1.1rem)", opacity: 0.9 }}>Welcome to your <strong>{user.grade}</strong> classroom!</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.6rem 1.2rem", borderRadius: "16px", backdropFilter: "blur(10px)", textAlign: "center" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", marginBottom: "2px" }}>Level</div>
            <div style={{ fontSize: "1.8rem", fontWeight: "800" }}>{user.level}</div>
          </div>
        </div>

        <div className="join-bar" style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
           <div style={{ flex: "1 1 200px", background: "rgba(255,255,255,0.15)", padding: "6px", borderRadius: "50px", display: "flex", gap: "6px", border: "1px solid rgba(255,255,255,0.2)", minWidth: 0 }}>
              <input 
                type="text" 
                placeholder="Invite Code" 
                style={{ flex: 1, background: "none", border: "none", color: "white", padding: "0 10px", fontSize: "0.85rem", outline: "none", fontWeight: "600", minWidth: 0 }} 
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
              <button className="btn-primary" style={{ background: "white", color: "var(--primary-color)", padding: "7px 14px", fontSize: "0.8rem", boxShadow: "none", whiteSpace: "nowrap" }} onClick={handleJoinSubject}>Join 🏫</button>
           </div>
           <div className="nav-buttons" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
             {(user.role === 'Headmaster' || user.role === 'Teacher') && (
               <button className="btn-secondary" style={{ background: "rgba(0,0,0,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "7px 14px", fontSize: "0.8rem" }} onClick={() => router.push("/admin")}>Admin 👑</button>
             )}
             <button className="btn-secondary" style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "none", padding: "7px 14px", fontSize: "0.8rem" }} onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}>Logout 🚪</button>
           </div>
        </div>
      </header>

      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: "1.8rem" }}>My Subjects 📚</h2>
        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "600" }}>{allSubjects.length} Active Courses</span>
      </div>

      {allSubjects.length === 0 ? (
        <div className="premium-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <p style={{ fontSize: "4rem", marginBottom: "1rem" }}>📭</p>
          <h3 style={{ marginBottom: "0.5rem" }}>No subjects yet!</h3>
          <p style={{ opacity: 0.5 }}>
            {user.role === 'Student' 
              ? "Ask your teacher for an invite code and enter it above to join a class!" 
              : "Go to the Admin Panel to create your first subject!"}
          </p>
        </div>
      ) : (
        <div className="grid-cols">
          {allSubjects.map((subj) => {
            const pct = getProgressPercent(subj);
            return (
              <div key={subj.id} className="premium-card subject-card" onClick={() => router.push(`/classroom/${subj.id}`)} style={{ cursor: "pointer" }}>
                <div style={{ background: "linear-gradient(135deg, #fff5f8 0%, #f0f7ff 100%)", padding: "2rem", borderRadius: "20px", marginBottom: "1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                  <span style={{ fontSize: "4.5rem", display: "block", position: "relative", zIndex: 1 }} className="animate-bounce">{subj.icon}</span>
                  <div style={{ position: "absolute", bottom: "-10px", right: "-10px", fontSize: "5rem", opacity: 0.05, transform: "rotate(-15deg)" }}>{subj.icon}</div>
                </div>
                <h3 style={{ fontSize: "1.4rem", marginBottom: "0.3rem" }}>{subj.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.3rem" }}>{subj.grade}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.2rem" }}>{subj.lessons?.length || 0} Modules</p>
                <div className="progress-container" style={{ height: "8px", marginBottom: "1.5rem" }}>
                  <div className="progress-filler" style={{ width: `${pct}%`, background: pct === 100 ? "var(--accent-green)" : "var(--primary-color)" }}></div>
                </div>
                <button className="btn-secondary" style={{ width: "100%", padding: "12px", fontSize: "0.85rem" }}>
                  {pct === 100 ? "Review Content 🎓" : "Open Classroom 🏫"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
