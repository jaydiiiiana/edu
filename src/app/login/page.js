"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [formData, setFormData] = useState({ name: "", password: "", age: "", grade: "", verificationCode: "" });
  const [loginForm, setLoginForm] = useState({ name: "", password: "" });
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const handleAgeChange = (e) => {
    const age = parseInt(e.target.value);
    setFormData({ ...formData, age });

    let suggestedGrade = "";
    if (age <= 6) suggestedGrade = "Kinder 1";
    else if (age === 7) suggestedGrade = "Grade 1 - Section 1";
    else if (age === 8) suggestedGrade = "Grade 2 - Section 1";
    else if (age === 9) suggestedGrade = "Grade 3 - Section 1";
    else if (age === 10) suggestedGrade = "Grade 4 - Section 1";
    else if (age === 11) suggestedGrade = "Grade 5 - Section 1";
    else if (age >= 12) suggestedGrade = "Grade 6 - Section 1";
    else suggestedGrade = "Kinder 1";

    setFormData((prev) => ({ ...prev, age, grade: suggestedGrade }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/register", { method: "POST", body: JSON.stringify(formData) });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("catUser", JSON.stringify(data.user));
        router.push("/dashboard");
      } else { setError(data.error); }
    } catch (e) { setError("Connect error! 😿 Check if server is running."); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/login", { method: "POST", body: JSON.stringify(loginForm) });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem("catUser", JSON.stringify(data.user));
        router.push("/dashboard");
      } else { setError(data.error); }
    } catch (e) { setError("Connect error! 😿 Check if server is running."); }
  };

  return (
    <div className="flex-center" style={{ minHeight: "100vh", padding: "1.5rem", background: "linear-gradient(135deg, #fff5f8 0%, #f0f7ff 100%)", position: "relative" }}>
      {/* Back to Home Button */}
      <button 
        className="btn-secondary" 
        style={{ position: "absolute", top: "1.5rem", left: "1.5rem", border: "none", zIndex: 10 }} 
        onClick={() => router.push("/")}
      >
        ← Home
      </button>

      <div className="premium-card cat-ears" style={{ maxWidth: "450px", width: "100%", padding: "2.5rem 2rem", textAlign: "center" }}>
        
        {/* Header Text */}
        <div style={{ marginBottom: "2rem" }}>
          <h1>{mode === "login" ? "Hello Again! 😸" : "New Friend! 🐾"}</h1>
          <p style={{ opacity: 0.6, fontSize: "0.95rem" }}>{mode === "login" ? "Welcome back to the Academy." : "Start your learning journey today!"}</p>
        </div>

        {error && <div style={{ background: "#ffeef0", color: "#ff5e7d", padding: "12px", borderRadius: "15px", marginBottom: "1.5rem", fontWeight: "bold", fontSize: "0.9rem" }}>{error}</div>}

        {mode === "login" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontWeight: 800, fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}>Kitten Name</label>
              <input 
                type="text" 
                placeholder="Ex. Whiskers" 
                style={{ width: "100%", padding: "14px 25px", borderRadius: "30px", border: "2px solid #f0f0f0", marginTop: "5px", fontSize: "1rem" }}
                value={loginForm.name} 
                onChange={(e) => { setLoginForm({ ...loginForm, name: e.target.value }); setError(""); }}
              />
            </div>
            <div style={{ textAlign: "left" }}>
              <label style={{ fontWeight: 800, fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}>Secret Paw-phrase</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                style={{ width: "100%", padding: "14px 25px", borderRadius: "30px", border: "2px solid #f0f0f0", marginTop: "5px", fontSize: "1rem" }}
                value={loginForm.password} 
                onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setError(""); }}
              />
            </div>
            <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={handleLogin}>Ready to Learn! 🐾</button>
            <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
              Don't have an account? <span style={{ color: "var(--primary-color)", cursor: "pointer", fontWeight: "bold" }} onClick={() => setMode("register")}>Register now!</span>
            </p>
          </div>
        ) : (
          <div>
            {step === 1 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div style={{ textAlign: "left" }}>
                  <label style={{ fontWeight: 800, fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}>Kitten Name</label>
                  <input type="text" placeholder="Pick a name" style={{ width: "100%", padding: "14px 25px", borderRadius: "30px", border: "2px solid #f0f0f0", marginTop: "5px" }} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <label style={{ fontWeight: 800, fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}>Secret Paw-phrase</label>
                  <input type="password" placeholder="Create a password" style={{ width: "100%", padding: "14px 25px", borderRadius: "30px", border: "2px solid #f0f0f0", marginTop: "5px" }} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <label style={{ fontWeight: 800, fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}>How old are you?</label>
                  <input type="number" placeholder="Enter age" style={{ width: "100%", padding: "14px 25px", borderRadius: "30px", border: "2px solid #f0f0f0", marginTop: "5px" }} value={formData.age} onChange={handleAgeChange} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <label style={{ fontWeight: 800, fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}>Verification Code 🛡️</label>
                  <input type="text" placeholder="Provided by your teacher/headmaster" style={{ width: "100%", padding: "14px 25px", borderRadius: "30px", border: "2px solid #f0f0f0", marginTop: "5px" }} value={formData.verificationCode} onChange={(e) => setFormData({ ...formData, verificationCode: e.target.value })} />
                </div>
                <button className="btn-primary" disabled={!formData.name || !formData.age || !formData.verificationCode} style={{ marginTop: "1rem" }} onClick={() => setStep(2)}>Next Step 🐾</button>
                <p style={{ fontSize: "0.9rem", marginTop: "1rem" }}>
                  Already have one? <span style={{ color: "var(--primary-color)", cursor: "pointer", fontWeight: "bold" }} onClick={() => setMode("login")}>Login!</span>
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
                <div className="premium-card" style={{ background: "rgba(255,157,204,0.1)", border: "none", padding: "1.5rem" }}>
                  <p style={{ fontWeight: 800, marginBottom: "5px" }}>Perfect! 🎓</p>
                  <p style={{ fontSize: "0.9rem" }}>Based on your age, you should start in: <br/> <strong>{formData.grade}</strong></p>
                </div>
                <div style={{ textAlign: "left" }}>
                  <label style={{ fontWeight: 800, fontSize: "0.9rem", color: "#666", marginLeft: "10px" }}>Select Grade</label>
                  <select 
                    style={{ width: "100%", padding: "14px 25px", borderRadius: "30px", border: "2px solid #f0f0f0", marginTop: "5px", appearance: "none", background: "white" }} 
                    value={formData.grade} 
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  >
                    {["Kinder 1", "Kinder 2"].map(g => <option key={g} value={g}>{g}</option>)}
                    {[1, 2, 3, 4, 5, 6].map(gradeNum => {
                        const sections = gradeNum === 1 ? 5 : 3;
                        return (
                          <React.Fragment key={gradeNum}>
                            <option value={`Grade ${gradeNum}`}>Grade {gradeNum}</option>
                            {Array.from({ length: sections }).map((_, i) => (
                              <option key={`${gradeNum}-${i}`} value={`Grade ${gradeNum} - Section ${i + 1}`}>Grade {gradeNum} - Section {i + 1}</option>
                            ))}
                          </React.Fragment>
                        );
                    })}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                   <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setStep(1)}>Back</button>
                   <button className="btn-primary" style={{ flex: 2 }} onClick={handleRegister}>Start Now! 🐾</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        input:focus {
           outline: none;
           border-color: var(--primary-color) !important;
           box-shadow: 0 0 10px rgba(255,157,204,0.1);
        }
      `}</style>
    </div>
  );
}
