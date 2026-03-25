
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatorPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [invites, setInvites] = useState([]);
  const [headmasters, setHeadmasters] = useState([]);
  const [duration, setDuration] = useState(1);
  const [renewDuration, setRenewDuration] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("catUser");
      if (!stored) { router.push("/"); return; }
      const user = JSON.parse(stored);
      
      // Verification - usually 'Creator' role would be manually set in DB for the first time
      if (user.role !== 'Creator' && user.name !== 'admin_cat') {
        alert("Wait! Only the original Creator can enter this chamber. 🐾🚪");
        router.push("/dashboard");
        return;
      }
      
      setCurrentUser(user);
      try {
        const [invRes, uRes] = await Promise.all([
          fetch(`/api/invites?userId=${user.id}`),
          fetch("/api/users")
        ]);
        const invData = await invRes.json();
        const uData = await uRes.json();
        
        setInvites(Array.isArray(invData) ? invData : []);
        
        if (Array.isArray(uData)) {
          // Identify all Headmasters
          const hmList = uData.filter(u => u.role === 'Headmaster');
          
          // Calculate stats for each Headmaster
          const hmWithStats = hmList.map(hm => {
            const teachers = uData.filter(u => u.role === 'Teacher' && u.invited_by === hm.id);
            const teacherIds = teachers.map(t => t.id);
            const groupStudents = uData.filter(u => u.role === 'Student' && (u.invited_by === hm.id || teacherIds.includes(u.invited_by)));
            
            return {
              ...hm,
              teacherCount: teachers.length,
              studentCount: groupStudents.length
            };
          });
          setHeadmasters(hmWithStats);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    init();
    
    // Auto-Sync every 15 seconds
    const syncInterval = setInterval(init, 15000);
    return () => clearInterval(syncInterval);
  }, [router]);

  const renewSubscription = async (hmId, months) => {
    try {
      const res = await fetch("/api/admin/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, targetUserId: hmId, months: parseInt(months) })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Update local state
      setHeadmasters(headmasters.map(hm => hm.id === hmId ? { ...hm, subscription_expires_at: data.newExpiry } : hm));
      alert("Subscription renewed successfully! 👑✅");
    } catch (e) { alert("Renewal Failed: " + e.message); }
  };

  const freezeSubscription = async (hmId) => {
    if (!confirm("❄️ FREEZE SCHOOL: This will instantly block the Headmaster and all their students from accessing the dashboard. Proceed?")) return;
    try {
      const res = await fetch("/api/admin/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, targetUserId: hmId })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Update local state
      setHeadmasters(headmasters.map(hm => hm.id === hmId ? { ...hm, subscription_expires_at: data.newExpiry } : hm));
      alert("School has been FROZEN. 🧊 access is now blocked.");
    } catch (e) { alert("Freeze Failed: " + e.message); }
  };

  const generateHeadmasterCode = async () => {
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, roleToGrant: 'Headmaster', durationMonths: parseInt(duration) })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInvites([data, ...invites]);
      alert(`New ${duration}-month Headmaster code generated! 👑🎫`);
    } catch (e) { alert("Error: " + e.message); }
  };

  const resetEverything = async () => {
    if (!confirm("🚨 WARNING: This will permanently DELETE all students, teachers, subjects, and lessons. Only your Creator account will survive. Are you absolutely sure?")) return;
    if (!confirm("FINAL CONFIRMATION: Are you really sure? This cannot be undone!")) return;
    
    try {
      const res = await fetch("/api/admin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert(data.message);
      window.location.reload();
    } catch (e) { alert("Reset Failed: " + e.message); }
  };

  if (loading) return <div className="flex-center" style={{ height: "100vh" }}>Accessing Secret Chamber... 🐾</div>;

  return (
    <div className="container" style={{ padding: "4rem 1rem" }}>
      <header className="premium-card cat-ears" style={{ background: "linear-gradient(135deg, #1a1a1a, #333)", color: "white", marginBottom: "3rem", padding: "3rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
        <div>
           <h1 style={{ fontSize: "3rem", color: "var(--primary-color)", margin: 0 }}>Creator Workspace 🌌</h1>
           <p style={{ opacity: 0.8, margin: 0 }}>Manage the growth of Cat Academy and its schools. <button title="Sync Data" style={{ background: "none", border: "none", fontSize: "1rem", cursor: "pointer", marginLeft: "10px", opacity: 0.3 }} onClick={() => window.location.reload()}>🔄</button></p>
        </div>
        <button className="btn-secondary" style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "10px 25px" }} onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}>Logout 🚪</button>
      </header>

      <div className="premium-card cat-ears" style={{ marginBottom: "3rem" }}>
        <h2 style={{ marginBottom: "2rem" }}>Active Schools & Headmasters 🏫</h2>
        {headmasters.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
             <p style={{ fontSize: "5rem" }}>🏢</p>
             <h3>No schools yet. Generate a code above to start!</h3>
          </div>
        ) : (
          <div className="grid-cols" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
            {headmasters.map(hm => (
              <div key={hm.id} className="premium-card" style={{ border: "1px solid #eee", background: "white" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                     <div style={{ width: "50px", height: "50px", borderRadius: "15px", background: "var(--primary-color)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "800" }}>
                        {(hm.name || "S")[0].toUpperCase()}
                     </div>
                     <div>
                        <h3 style={{ margin: 0 }}>{hm.name}</h3>
                        <p style={{ margin: 0, opacity: 0.5, fontSize: "0.8rem" }}>Principal • Joined {new Date(hm.created_at).toLocaleString()}</p>
                     </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.7rem", display: "block", color: "#666", marginBottom: "4px" }}>STATUS</span>
                    {hm.subscription_expires_at && new Date(hm.subscription_expires_at) < new Date() ? (
                        <span style={{ fontSize: "0.75rem", background: "#fee2e2", color: "#ef4444", padding: "4px 10px", borderRadius: "10px", fontWeight: "700" }}>EXPIRED 🛑</span>
                    ) : (
                        <span style={{ fontSize: "0.75rem", background: "#e6ffec", color: "var(--accent-green)", padding: "4px 10px", borderRadius: "10px", fontWeight: "700" }}>ACTIVE ✅</span>
                    )}
                    <span style={{ fontSize: "0.65rem", display: "block", opacity: 0.5, marginTop: "5px" }}>Expires: {hm.subscription_expires_at ? new Date(hm.subscription_expires_at).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ background: "#f8f9ff", padding: "15px", borderRadius: "15px", textAlign: "center", border: "1px solid #eef2ff" }}>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: "800", color: "#4f46e5" }}>{hm.teacherCount}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6, fontWeight: "700" }}>TEACHERS 👨‍🏫</p>
                  </div>
                  <div style={{ background: "#fff5f8", padding: "15px", borderRadius: "15px", textAlign: "center", border: "1px solid #ffeef4" }}>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: "800", color: "#db2777" }}>{hm.studentCount}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", opacity: 0.6, fontWeight: "700" }}>STUDENTS 🎒</p>
                  </div>
                </div>
                
                <div style={{ marginTop: "1rem", padding: "10px", borderTop: "1px dashed #eee", display: "flex", gap: "10px", alignItems: "center" }}>
                   <select 
                     style={{ flex: 1, padding: "8px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "0.8rem" }}
                     value={renewDuration}
                     onChange={(e) => setRenewDuration(e.target.value)}
                   >
                      <option value="1">+1 Month</option>
                      <option value="3">+3 Months</option>
                      <option value="6">+6 Months</option>
                      <option value="12">+1 Year</option>
                   </select>
                   <button 
                     className="btn-primary" 
                     style={{ padding: "8px 15px", fontSize: "0.8rem" }}
                     onClick={() => renewSubscription(hm.id, renewDuration)}
                   >RENEW 🔓</button>
                   
                   {new Date(hm.subscription_expires_at) > new Date() && (
                      <button 
                        className="btn-secondary" 
                        style={{ padding: "8px 15px", fontSize: "0.8rem", background: "#fee2e2", color: "#ef4444", borderColor: "#fecaca" }}
                        onClick={() => freezeSubscription(hm.id)}
                      >FREEZE ❄️</button>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-cols" style={{ marginBottom: "3rem" }}>
        <div className="premium-card">
          <h2 style={{ marginBottom: "1.5rem" }}>Add New School Client 🏫</h2>
          <p style={{ marginBottom: "1rem", opacity: 0.6, lineHeight: "1.6" }}>
             Select the subscription duration and generate a code for your new client.
          </p>
          
          <div style={{ marginBottom: "1.5rem" }}>
             <label style={{ fontSize: "0.8rem", fontWeight: "800", display: "block", marginBottom: "8px" }}>Subscription Duration (Months)</label>
             <select 
               style={{ width: "100%", padding: "12px", border: "2px solid #eee", borderRadius: "14px", fontSize: "1rem" }}
               value={duration}
               onChange={(e) => setDuration(e.target.value)}
             >
                <option value="1">1 Month (Trial)</option>
                <option value="3">3 Months (Standard)</option>
                <option value="6">6 Months (Premium)</option>
                <option value="12">1 Year (Annual)</option>
             </select>
          </div>

          <button className="btn-primary" style={{ width: "100%", padding: "1.5rem", fontSize: "1.2rem", boxShadow: "0 10px 30px rgba(255,133,179,0.3)" }} onClick={generateHeadmasterCode}>
            Generate Headmaster Join Code 🎫
          </button>
        </div>

        <div className="premium-card">
          <h3 style={{ marginBottom: "1.5rem" }}>Unused Access Codes 📜</h3>
          {invites.filter(inv => !inv.is_used).length === 0 ? (
            <p style={{ opacity: 0.5 }}>All codes used or none created.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {invites.filter(inv => !inv.is_used).map((inv, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.2rem", background: "var(--primary-light)", borderRadius: "16px", border: "2px dashed var(--primary-color)" }}>
                  <span style={{ fontWeight: "800", color: "var(--primary-color)", fontFamily: "monospace", fontSize: "1.2rem", letterSpacing: "1px" }}>{inv.code}</span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      style={{ padding: "8px 15px", borderRadius: "10px", background: "var(--primary-color)", color: "white", border: "none", fontSize: "0.8rem", cursor: "pointer", fontWeight: "800" }}
                      onClick={() => {
                        navigator.clipboard.writeText(inv.code);
                        alert("Code Copied! 🎫📋");
                      }}
                    >COPY</button>
                    <span style={{ fontSize: "0.7rem", color: "var(--primary-color)", opacity: 0.6, display: "flex", alignItems: "center" }}>Expires in 24h</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="premium-card" style={{ border: "2px solid #fee2e2", background: "#fffafb", padding: "2.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
         <div style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ color: "#ef4444", marginBottom: "1rem" }}>System Maintenance & Reset 🧨</h2>
            <p style={{ maxWidth: "600px", margin: "0 auto 2rem auto", color: "#666" }}>
               This will delete all schools, students, subjects, and lessons. Use this only if you want to start over from scratch. **Your Creator account will be saved.**
            </p>
            <button className="btn-secondary" style={{ background: "#ef4444", color: "white", border: "none", padding: "1rem 2.5rem", fontSize: "1.1rem", fontWeight: "800" }} onClick={resetEverything}>
               Wipe All Data (RESET) 🧨
            </button>
         </div>
         <span style={{ position: "absolute", left: "-20px", top: "-20px", fontSize: "10rem", opacity: 0.05 }}>⚠️</span>
      </div>

      <button className="btn-secondary" style={{ marginTop: "3rem", width: "100%", padding: "15px" }} onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}>Logout 🚪</button>
    </div>
  );
}
