"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [studentCount, setStudentCount] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
       try {
         const res = await fetch("/api/public/stats");
         const data = await res.json();
         setStudentCount(data.total || 2);
         setSuccessRate(data.successRate || 95);
         setTotalSubjects(data.totalSubjects || 5);
       } catch (e) { setStudentCount(2); setSuccessRate(95); setTotalSubjects(5); }
    };
    fetchStats();

    // Listen for PWA install prompt
    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleDownload = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      const { outcome } = await deferredPrompt.current.userChoice;
      if (outcome === 'accepted') {
        alert('🎉 Cat Academy is being installed! Check your home screen!');
      }
      deferredPrompt.current = null;
    } else {
      // Fallback for iOS or browsers that don't support beforeinstallprompt
      alert('📱 To install Cat Academy:\n\n• iPhone/iPad: Tap the Share button (⬆️), then "Add to Home Screen"\n• Android Chrome: Tap the menu (⋮), then "Install App"\n• Desktop: Click the install icon (⊕) in your address bar');
    }
  };

  return (
    <div style={{ minHeight: "100vh", overflowX: "hidden" }}>
      {/* Navigation */}
      <nav style={{ 
        padding: "clamp(1rem, 3vw, 1.5rem) clamp(1rem, 5vw, 4rem)", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        position: "fixed", 
        width: "100%", 
        top: 0, 
        zIndex: 100, 
        background: "rgba(255, 255, 255, 0.7)", 
        backdropFilter: "blur(20px) saturate(180%)", 
        borderBottom: "1px solid rgba(0,0,0,0.03)" 
      }}>
        <div style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px", color: "#1a1a1a" }}>
          <img src="/cat-hat-logo.png" alt="Cat Academy" style={{ width: "32px", height: "32px", borderRadius: "8px" }} /> Cat Academy
        </div>
        <div className="nav-buttons" style={{ display: "flex", gap: "clamp(0.5rem, 2vw, 1.5rem)", alignItems: "center" }}>
          <button className="btn-secondary" style={{ padding: "10px 20px", fontSize: "0.95rem" }} onClick={() => router.push("/login")}>Login</button>
          <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.95rem" }} onClick={() => router.push("/login")}>Join Now 🎓</button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="container" style={{ 
        paddingTop: "clamp(8rem, 20vh, 12rem)", 
        paddingBottom: "6rem", 
        display: "flex", 
        flexDirection: "column",
        gap: "2.5rem", 
        alignItems: "center", 
        minHeight: "80vh",
        textAlign: "center",
        maxWidth: "900px"
      }}>
        <div>
          <span style={{ background: "var(--primary-light)", color: "var(--primary-color)", padding: "12px 28px", borderRadius: "50px", fontSize: "1rem", fontWeight: "800", marginBottom: "2rem", display: "inline-block", boxShadow: "0 10px 20px rgba(255,133,179,0.1)" }}>✨ Welcome to the Future of Learning</span>
          <h1 style={{ fontSize: "clamp(2.8rem, 8vw, 5rem)", lineHeight: "1.05", marginBottom: "2rem", fontWeight: "800" }}>Learning is Better with a <span style={{ color: "var(--primary-color)" }}>Furry Friend!</span> 🌸</h1>
          <p style={{ fontSize: "clamp(1.1rem, 3vw, 1.5rem)", color: "var(--text-muted)", marginBottom: "3.5rem", lineHeight: "1.7", maxWidth: "700px", margin: "0 auto 3.5rem" }}>
            The most adorable way to master Math, Science, and English. Join thousands of kittens worldwide on a quest for knowledge and leveling up.
          </p>
          <div className="hero-buttons" style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
             <button className="btn-primary" style={{ padding: "1.4rem 4rem", fontSize: "1.2rem" }} onClick={() => router.push("/login")}>Get Started Today 🐾</button>
             <button className="btn-secondary" style={{ padding: "1.4rem 3rem", fontSize: "1.2rem", background: "white", border: "2px solid #eee" }} onClick={handleDownload}>Download App 📱</button>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section style={{ padding: "clamp(4rem, 10vh, 8rem) 0", position: "relative", zIndex: 10 }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
             <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", marginBottom: "1rem" }}>Why Choose Cat Academy? 🌟</h2>
             <p style={{ fontSize: "1.1rem", opacity: 0.6 }}>Built for curious kittens who love to explore and learn together.</p>
          </div>

          <div className="grid-cols">
            <div className="premium-card" style={{ textAlign: "center" }}>
               <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🎮</div>
               <h3 style={{ marginBottom: "1rem" }}>Gamified Learning</h3>
               <p style={{ opacity: 0.6 }}>Every quiz is an adventure! Earn EXP, collect badges, and level up as you master your subjects.</p>
            </div>
            <div className="premium-card" style={{ textAlign: "center" }}>
               <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>📚</div>
               <h3 style={{ marginBottom: "1rem" }}>Full Curriculum</h3>
               <p style={{ opacity: 0.6 }}>From K to Grade 6, covering Math, Science, English, Filipino, and more with feline flair.</p>
            </div>
            <div className="premium-card" style={{ textAlign: "center" }}>
               <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>📊</div>
               <h3 style={{ marginBottom: "1rem" }}>Admin Tools</h3>
               <p style={{ opacity: 0.6 }}>Teachers can create custom tests and track every student's progress with real-time analytics.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container" style={{ padding: "clamp(4rem, 10vh, 8rem) 0", display: "flex", gap: "2rem", justifyContent: "space-around", flexWrap: "wrap" }}>
         <div style={{ textAlign: "center", flex: "1 1 200px" }}>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--primary-color)" }}>{studentCount}</h2>
            <p style={{ fontWeight: "bold" }}>Kitten Students 😸</p>
         </div>
         <div style={{ textAlign: "center", flex: "1 1 200px" }}>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--accent-blue)" }}>{totalSubjects}+</h2>
            <p style={{ fontWeight: "bold" }}>Fun Subjects 📚</p>
         </div>
         <div style={{ textAlign: "center", flex: "1 1 200px" }}>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "var(--secondary-color)" }}>{successRate}%</h2>
            <p style={{ fontWeight: "bold" }}>Success Rate 🎓</p>
         </div>
      </section>

      {/* CTA Footer */}
      <footer style={{ background: "linear-gradient(135deg, var(--secondary-color), var(--primary-color))", padding: "10rem 0", color: "white", textAlign: "center", position: "relative", overflow: "hidden" }}>
         <div className="container" style={{ position: "relative", zIndex: 1 }}>
            <h2 style={{ color: "white", fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "2rem", lineHeight: "1.2" }}>Ready to Unleash Your Inner Genius? 🧠</h2>
            <p style={{ fontSize: "1.5rem", marginBottom: "3rem", opacity: 0.9 }}>Join the kitten community today!</p>
            <button className="btn-primary" style={{ background: "white", color: "var(--primary-color)", padding: "1.2rem 3rem", fontSize: "1.2rem", width: "auto" }} onClick={() => router.push("/login")}>
               Get Started Now 🐾
            </button>
         </div>
         <span style={{ position: "absolute", left: "-50px", top: "-50px", fontSize: "20rem", opacity: 0.1 }}>🐱</span>
      </footer>
    </div>
  );
}
