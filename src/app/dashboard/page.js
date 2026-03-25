"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState({});
  const [joinCode, setJoinCode] = useState("");
  const [allSubjects, setAllSubjects] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
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
      if (parsedUser.role === 'Creator') {
        router.push("/creator");
        return;
      }

      try {
        // 1. Refresh User & Role
        const userRes = await fetch(`/api/users/${parsedUser.id}`);
        const userLatest = await userRes.json();
        if (userLatest && userLatest.role && userLatest.role !== parsedUser.role) {
           const updated = { ...parsedUser, role: userLatest.role };
           localStorage.setItem("catUser", JSON.stringify(updated));
           setUser(updated);
        }

        const activeRole = (userLatest && userLatest.role) || parsedUser.role || 'Student';

        // 2. School Integrity Check (Cascade Freeze)
        // If I am a student/teacher, I need to check if my Headmaster is expired
        if (activeRole !== 'Creator') {
          // Fetch all users to check parents (Simple check for now)
          const allURes = await fetch("/api/users");
          const allUData = await allURes.json();
          if (Array.isArray(allUData)) {
            // Find my Headmaster
            let myHeadmaster = null;
            if (activeRole === 'Headmaster') myHeadmaster = userLatest || parsedUser;
            else {
              const myInviter = allUData.find(u => u.id === (userLatest?.invited_by || parsedUser.invited_by));
              if (myInviter?.role === 'Headmaster') myHeadmaster = myInviter;
              else if (myInviter?.role === 'Teacher') {
                myHeadmaster = allUData.find(u => u.id === myInviter.invited_by && u.role === 'Headmaster');
              }
            }

            if (myHeadmaster && myHeadmaster.subscription_expires_at) {
              const now = new Date();
              const exp = new Date(myHeadmaster.subscription_expires_at);
              if (now > exp) {
                // School is frozen!
                console.log("School Frozen detected!");
                setIsExpired(true);
                setExpiryDate(exp.toLocaleDateString());
                setLoading(false);
                return;
              }
            }
          }
        }
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
        const annRes = await fetch(`/api/announcements?grade=${parsedUser.grade}`);
        const annData = await annRes.json();
        if (Array.isArray(annData)) setAnnouncements(annData);
        
        setAllSubjects(subjects);

        // Generate Notifications
        const notifs = [];
        // Add announcements to notifications
        annData.slice(0, 5).forEach(a => {
          notifs.push({ id: `ann-${a.id}`, type: 'announcement', title: "New Bulletin", message: a.content.substring(0, 40) + "...", date: a.created_at });
        });
        // Add new lessons/exams (last 3 days)
        subjects.forEach(s => {
          (s.lessons || []).forEach(l => {
             const isNew = (new Date() - new Date(l.created_at || Date.now())) < 3 * 24 * 60 * 60 * 1000;
             if (isNew) {
               notifs.push({ id: `lesson-${l.id}`, type: 'lesson', title: `New in ${s.title}`, message: l.title, date: l.created_at });
             }
          });
        });
        setNotifications(notifs.sort((a,b) => new Date(b.date) - new Date(a.date)));

      } catch (e) { 
        console.error("Data fetch failed", e); 
        setAllSubjects([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    const syncInterval = setInterval(fetchData, 15000);
    return () => clearInterval(syncInterval);
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

  if (!user || loading) return <div className="flex-center" style={{ height: "100vh" }}>Loading Academy... 🐾</div>;

  if (isExpired) {
    return (
      <div className="flex-center" style={{ height: "100vh", background: "#fff5f5", padding: "2rem", textAlign: "center" }}>
        <div className="premium-card cat-ears" style={{ maxWidth: "500px", border: "2px solid #ef4444" }}>
           <div style={{ fontSize: "5rem", marginBottom: "1rem" }}>🔒🏫</div>
           <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>School Access Paused</h2>
           <p style={{ color: "#666", lineHeight: "1.6", marginBottom: "2rem" }}>
              Our school's access was paused on **{expiryDate}**. 🐾 <br />
              Don't worry kitten! Your progress is safe. Check back again once your Teacher or Headmaster is ready!
           </p>
           <button className="btn-secondary" onClick={() => router.push("/")}>Back to Login</button>
        </div>
      </div>
    );
  }

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
        <div className="dashboard-header-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.8rem" }}>
          <div>
            <h1 style={{ color: "white", fontSize: "clamp(1.2rem, 4vw, 2.5rem)", margin: 0 }}>Hi, {user.name}! <button title="Sync Data" style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", opacity: 0.3 }} onClick={() => window.location.reload()}>🔄</button>🐾</h1>
            <p style={{ fontSize: "clamp(0.8rem, 2.5vw, 1.1rem)", opacity: 0.9, margin: 0 }}>Welcome to your <strong>{user.grade}</strong> classroom!</p>
          </div>
          <div className="badges" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowAnnouncements(true)}>
               <span style={{ fontSize: "1.5rem" }}>📣</span>
               {announcements.length > 0 && <div style={{ position: "absolute", top: "-5px", right: "-5px", background: "white", color: "var(--primary-color)", borderRadius: "50%", width: "16px", height: "16px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", border: "2px solid var(--primary-color)" }}>{announcements.length}</div>}
            </div>
            <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowNotifications(true)}>
               <span style={{ fontSize: "1.5rem" }}>🔔</span>
               {notifications.length > 0 && <div style={{ position: "absolute", top: "-5px", right: "-5px", background: "#ff4d4d", color: "white", borderRadius: "50%", width: "16px", height: "16px", fontSize: "0.6rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "900", border: "2px solid white" }}>{notifications.length}</div>}
            </div>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "0.6rem 1.2rem", borderRadius: "16px", backdropFilter: "blur(10px)", textAlign: "center" }}>
              <div style={{ fontSize: "0.7rem", fontWeight: "800", textTransform: "uppercase", marginBottom: "2px" }}>Level</div>
              <div style={{ fontSize: "1.8rem", fontWeight: "800" }}>{user.level}</div>
            </div>
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
      
      {/* Headmaster Announcements */}
      {announcements.length > 0 && (
        <div className="premium-card announcement-banner" style={{ 
          marginBottom: "2rem", 
          padding: "1rem 1.5rem", 
          background: "linear-gradient(135deg, #fff9e6, #fffcf0)", 
          border: "2px solid #ffd700",
          borderRadius: "16px",
          display: "flex",
          gap: "1rem",
          alignItems: "center"
        }}>
          <div style={{ fontSize: "1.5rem" }}>📜</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "800", color: "#b8860b", textTransform: "uppercase" }}>Headmaster's Bulletin</p>
            <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
              <p className="marquee-text" style={{ margin: 0, fontWeight: "600", color: "#5d4300" }}>{announcements[0].content}</p>
            </div>
          </div>
          <button className="btn-secondary" style={{ padding: "5px 12px", fontSize: "0.7rem", border: "1px solid #ffd700", background: "white", color: "#b8860b" }} onClick={() => alert(announcements[0].content)}>Full Message 🔍</button>
        </div>
      )}

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
            const isPub = subj.is_public;

            return (
              <div key={subj.id} className="premium-card subject-card" onClick={() => router.push(`/classroom/${subj.id}`)} 
                style={{ 
                  cursor: "pointer", 
                  border: isPub ? "2px solid #ffd700" : "1px solid #f0f0f0",
                  background: isPub ? "linear-gradient(to bottom, #ffffff, #fffdf0)" : "white",
                  boxShadow: isPub ? "0 10px 40px rgba(255,215,0,0.15)" : ""
                }}>
                <div style={{ background: isPub ? "linear-gradient(135deg, #fff5e6 0%, #fffbed 100%)" : "linear-gradient(135deg, #fff5f8 0%, #f0f7ff 100%)", padding: "2rem", borderRadius: "20px", marginBottom: "1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
                  {isPub && <span style={{ position: "absolute", top: "10px", right: "10px", fontSize: "1.2rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}>👑</span>}
                  <span style={{ fontSize: "4.5rem", display: "block", position: "relative", zIndex: 1 }} className="animate-bounce">{subj.icon}</span>
                  <div style={{ position: "absolute", bottom: "-10px", right: "-10px", fontSize: "5rem", opacity: 0.05, transform: "rotate(-15deg)" }}>{subj.icon}</div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                  <h3 style={{ fontSize: "1.4rem", margin: 0 }}>{subj.title}</h3>
                  {isPub && <span style={{ fontSize: "0.6rem", background: "#ffd700", color: "white", padding: "2px 8px", borderRadius: "20px", fontWeight: "900" }}>OFFICIAL 👑</span>}
                </div>

                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "0.3rem" }}>{subj.grade}</p>
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.2rem" }}>{subj.lessons?.length || 0} Modules</p>
                
                <div className="progress-container" style={{ height: "8px", marginBottom: "1.5rem" }}>
                  <div className="progress-filler" style={{ width: `${pct}%`, background: pct === 100 ? "var(--accent-green)" : (isPub ? "#ffd700" : "var(--primary-color)") }}></div>
                </div>
                
                <button className="btn-secondary" style={{ width: "100%", padding: "12px", fontSize: "0.85rem", background: isPub ? "#fff9e6" : "", color: isPub ? "#b8860b" : "", border: isPub ? "1px solid #ffd700" : "" }}>
                  {pct === 100 ? "Review Content 🎓" : (isPub ? "Open Official Classroom 👑" : "Open Classroom 🏫")}
                </button>
              </div>
            );
          })}

        </div>
      )}

      {/* MODALS */}
      {(showAnnouncements || showNotifications) && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(5px)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "flex-end", padding: "1rem" }} onClick={() => { setShowAnnouncements(false); setShowNotifications(false); }}>
           <div className="premium-card animate-slide-up" style={{ maxWidth: "500px", width: "100%", maxHeight: "80vh", overflowY: "auto", padding: "2rem", borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                 <h2 style={{ margin: 0 }}>{showAnnouncements ? "Official Bulletins 📣" : "What's New? 🔔"}</h2>
                 <button onClick={() => { setShowAnnouncements(false); setShowNotifications(false); }} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
              </div>

              {showAnnouncements ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                   {announcements.map(a => (
                     <div key={a.id} style={{ padding: "1.2rem", background: "#f8f9fa", borderRadius: "15px", border: "1px solid #eee" }}>
                        <div style={{ fontSize: "0.6rem", textTransform: "uppercase", fontWeight: "900", color: "#b8860b", marginBottom: "5px" }}>{new Date(a.created_at).toLocaleDateString()}</div>
                        <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.5" }}>{a.content}</p>
                     </div>
                   ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                   {notifications.length === 0 ? <p style={{ textAlign: "center", opacity: 0.5 }}>All caught up! ✨</p> : 
                    notifications.map(n => (
                      <div key={n.id} style={{ padding: "1rem", background: "#f8f9fa", borderRadius: "15px", display: "flex", gap: "12px", alignItems: "start" }}>
                         <div style={{ fontSize: "1.2rem" }}>{n.type === 'announcement' ? '🖋️' : '📚'}</div>
                         <div>
                            <b style={{ display: "block", fontSize: "0.85rem" }}>{n.title}</b>
                            <p style={{ margin: 0, fontSize: "0.8rem", opacity: 0.7 }}>{n.message}</p>
                            <span style={{ fontSize: "0.65rem", opacity: 0.4 }}>{new Date(n.date).toLocaleDateString()}</span>
                         </div>
                      </div>
                    ))
                   }
                </div>
              )}
           </div>
        </div>
      )}

      <style jsx>{`
        .animate-slide-up {
           animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
           from { transform: translateY(100%); }
           to { transform: translateY(0); }
        }
        .marquee-text {
           display: inline-block;
           animation: marquee 15s linear infinite;
        }
        @keyframes marquee {
           0% { transform: translateX(100%); }
           100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
