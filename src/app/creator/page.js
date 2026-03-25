
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CreatorPanel() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [invites, setInvites] = useState([]);
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
        const res = await fetch(`/api/invites?userId=${user.id}`);
        const data = await res.json();
        setInvites(Array.isArray(data) ? data : []);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    init();
  }, [router]);

  const generateHeadmasterCode = async () => {
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, roleToGrant: 'Headmaster' })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInvites([data, ...invites]);
      alert("New Headmaster access code generated! 👑🎫");
    } catch (e) { alert("Error: " + e.message); }
  };

  if (loading) return <div className="flex-center" style={{ height: "100vh" }}>Accessing Secret Chamber... 🐾</div>;

  return (
    <div className="container" style={{ padding: "4rem 1rem" }}>
      <header className="premium-card cat-ears" style={{ background: "linear-gradient(135deg, #1a1a1a, #333)", color: "white", marginBottom: "3rem", padding: "3rem" }}>
        <h1 style={{ fontSize: "3rem", color: "var(--primary-color)" }}>Creator Workspace 🌌</h1>
        <p style={{ opacity: 0.8 }}>Manage the growth of Cat Academy and its schools.</p>
      </header>

      <div className="grid-cols">
        <div className="premium-card" style={{ height: "fit-content" }}>
          <h2 style={{ marginBottom: "1.5rem" }}>School Onboarding 🏫</h2>
          <p style={{ marginBottom: "2rem", opacity: 0.6 }}>Give this code to a new school owner. They will be registered as a <b>Headmaster</b> and can set up their own school structure.</p>
          <button className="btn-primary" style={{ width: "100%", padding: "1.5rem", fontSize: "1.2rem" }} onClick={generateHeadmasterCode}>
            Generate Headmaster Access Code 🎫
          </button>
        </div>

        <div className="premium-card">
          <h3 style={{ marginBottom: "1.5rem" }}>Active Codes 📜</h3>
          {invites.length === 0 ? (
            <p style={{ opacity: 0.5 }}>No codes created yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {invites.map((inv, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "#f8f9fa", borderRadius: "12px", border: "1px solid #eee" }}>
                  <span style={{ fontWeight: "800", color: "var(--accent-blue)", fontFamily: "monospace", fontSize: "1.1rem" }}>{inv.code}</span>
                  <span style={{ fontSize: "0.8rem", background: inv.is_used ? "#eee" : "#e6ffec", color: inv.is_used ? "#999" : "var(--accent-green)", padding: "4px 10px", borderRadius: "20px", fontWeight: "800" }}>
                    {inv.is_used ? "USED ✅" : "ACTIVE 🎫"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <button className="btn-secondary" style={{ marginTop: "3rem" }} onClick={() => router.push("/dashboard")}>← Back to Dashboard</button>
    </div>
  );
}
