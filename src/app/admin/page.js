"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { curriculum } from "@/data/curriculum";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("users"); // users, subjects, add
  const [customCurriculum, setCustomCurriculum] = useState({});
  const [loading, setLoading] = useState(true);
  
  // New Content State
  const [contentType, setContentType] = useState("subject"); 
  const [newContent, setNewContent] = useState({
    grade: "Grade 1",
    subjectTitle: "",
    subjectIcon: "📚",
    title: "",
    content: "",
    questions: [{ q: "", options: ["", "", "", ""], a: "" }]
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
       try {
         const storedUser = JSON.parse(localStorage.getItem("catUser"));
         if (!storedUser || storedUser.role === 'Student') {
           router.push("/");
           return;
         }
         setCurrentUser(storedUser);
         
         // Teachers start on 'subjects' tab and cannot see 'users'
         if (storedUser.role === 'Teacher') setActiveTab("subjects");

         const [uRes, cRes] = await Promise.all([
           fetch("/api/users"),
           fetch(`/api/curriculum?userId=${storedUser.id}&role=${storedUser.role}`)
         ]);
         const userData = await uRes.json();
         const currData = await cRes.json();
         
         if (userData.error || currData.error) {
           console.error("API Error:", userData.error || currData.error);
           return;
         }

         setUsers(userData);
         setCustomCurriculum(currData);
       } catch (e) { 
         console.error("Fetch failed", e); 
       } finally { 
         setLoading(false); 
       }
    };
    fetchAllData();
  }, [router]);

  const handleSaveContent = async () => {
    try {
      if (contentType !== "subject" && !newContent.title) {
        alert("Please enter a Title for the Lesson/Exam! 🐾");
        return;
      }

      if (contentType === "subject" && !newContent.subjectTitle) {
        alert("Please enter a Subject Title! 🐾");
        return;
      }

      const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: newContent.grade,
          subjectTitle: newContent.subjectTitle,
          subjectIcon: newContent.subjectIcon || "📚",
          lessonTitle: newContent.title,
          lessonType: contentType,
          lessonContent: newContent.content,
          questions: newContent.questions,
          isSubjectOnly: contentType === "subject",
          userId: currentUser.id
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`SUCCESS! 🐾\nSubject: ${newContent.subjectTitle}\nInvite Code: ${data.subjectCode || "N/A"}`);
        window.location.reload();
      } else throw new Error(data.error);
    } catch (e) { alert("Failed! " + e.message); }
  };

  const handleAddQuestion = () => {
    setNewContent({ ...newContent, questions: [...newContent.questions, { q: "", options: ["", "", "", ""], a: "" }] });
  };

  if (loading) return <div className="flex-center" style={{ height: "100vh" }}>Loading... 🐾</div>;

  return (
    <div className="container" style={{ padding: "clamp(1rem, 5vw, 3rem) 0" }}>
      <header className="premium-card" style={{ 
        marginBottom: "2rem", display: "flex", flexWrap: "wrap", gap: "1.5rem", justifyContent: "space-between", alignItems: "center", background: "white", border: "1px solid rgba(255,157,204,0.2)", padding: "1.5rem 2rem", boxShadow: "0 10px 30px rgba(255,157,204,0.1)", borderRadius: "30px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
           <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 2.2rem)", margin: 0, color: "#333" }}>{currentUser?.role === 'Headmaster' ? "Headmaster 👑" : "Teacher 👩‍🏫"}</h1>
           <span style={{ fontSize: "0.8rem", background: "var(--primary-light)", color: "var(--primary-color)", padding: "4px 10px", borderRadius: "20px", fontWeight: "800" }}>{currentUser?.role} Mode</span>
        </div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {currentUser?.role === 'Headmaster' && (
            <button className={activeTab === "users" ? "btn-primary" : "btn-secondary"} style={{ padding: "10px 20px" }} onClick={() => setActiveTab("users")}>Users 🐾</button>
          )}
          <button className={activeTab === "subjects" ? "btn-primary" : "btn-secondary"} style={{ padding: "10px 20px" }} onClick={() => setActiveTab("subjects")}>Subjects 🏷️</button>
          <button className={activeTab === "add" ? "btn-primary" : "btn-secondary"} style={{ padding: "10px 20px" }} onClick={() => setActiveTab("add")}>+ Create 📚</button>
          <div style={{ width: "2px", height: "30px", background: "#f0f0f0", margin: "0 5px" }} className="desktop-only"></div>
          <button className="btn-secondary" style={{ padding: "10px 15px", background: "#f8f9fa" }} onClick={() => router.push("/dashboard")}>🏠</button>
          <button className="btn-secondary" style={{ padding: "10px 15px", background: "#fff5f5", color: "#e03e3e", border: "1px solid #ffe3e3" }} onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}>Logout 🚪</button>
        </div>
      </header>

      {/* TABS CONTENT */}
      {activeTab === "users" && (
        <div className="premium-card">
          <h2 style={{ marginBottom: "1.5rem" }}>Teachers & Students ({users.length})</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #eee", textAlign: "left", color: "#888", fontSize: "0.8rem" }}>
                  <th style={{ padding: "15px" }}>USER</th>
                  <th style={{ padding: "15px" }}>GRADE</th>
                  <th style={{ padding: "15px" }}>ROLE</th>
                  <th style={{ padding: "15px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                    <td style={{ padding: "15px" }}>{u.name}</td>
                    <td style={{ padding: "15px" }}>{u.grade}</td>
                    <td style={{ padding: "15px" }}>
                       <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.8rem", background: u.role === 'Headmaster' ? "var(--primary-light)" : u.role === 'Teacher' ? "var(--secondary-light)" : "#eee", color: u.role === 'Headmaster' ? "var(--primary-color)" : u.role === 'Teacher' ? "var(--accent-blue)" : "#777" }}>
                         {u.role || "Student"}
                       </span>
                    </td>
                    <td style={{ padding: "15px" }}>
                        <select 
                          style={{ padding: "5px", borderRadius: "10px", border: "1px solid #ddd", fontSize: "0.75rem" }}
                          value={u.role || "Student"}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            const res = await fetch(`/api/users/${u.id}`, { 
                              method: "PATCH", 
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ role: newRole }) 
                            });
                            if (res.ok) window.location.reload();
                          }}
                        >
                          <option value="Student">Student 🎒</option>
                          <option value="Teacher">Teacher 📖</option>
                          <option value="Headmaster">Headmaster 👑</option>
                        </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "subjects" && (
        <div className="premium-card">
           <h2 style={{ marginBottom: "1.5rem" }}>School Subjects 📚</h2>
           <div className="grid-cols" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
              {Object.entries(customCurriculum).map(([grade, subjects]) => (
                Array.isArray(subjects) ? subjects.map(s => (
                  <div key={s.id} className="premium-card" style={{ padding: "1.5rem", border: "1px solid #eee", background: "#fcfdfe", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                       <span style={{ fontSize: "2.5rem" }}>{s.icon}</span>
                       <span style={{ fontSize: "0.7rem", background: "var(--primary-light)", color: "var(--primary-color)", padding: "2px 10px", borderRadius: "10px", fontWeight: "800" }}>{grade}</span>
                    </div>
                    <h4 style={{ margin: 0, fontSize: "1.3rem" }}>{s.title}</h4>
                    
                    <div style={{ fontSize: "0.8rem", background: "white", padding: "10px", borderRadius: "12px", border: "1px solid #eee" }}>
                       <strong>Lessons & Exams ({s.lessons?.length || 0}):</strong>
                       <ul style={{ margin: "5px 0 0 15px", padding: 0, color: "var(--text-muted)" }}>
                          {s.lessons?.map(l => (
                            <li key={l.id} style={{ fontSize: "0.75rem" }}>{l.type === "quiz" ? "📝" : "📖"} {l.title}</li>
                          )) || <li style={{ fontSize: "0.75rem" }}>No lessons yet</li>}
                       </ul>
                    </div>

                    <div style={{ fontSize: "0.8rem", background: "var(--secondary-light)", padding: "10px", borderRadius: "12px", color: "var(--accent-blue)" }}>
                       <strong>Students ({s.students?.length || 0}):</strong>
                       <p style={{ margin: "5px 0 0 0", fontSize: "0.75rem" }}>
                          {s.students && s.students.length > 0 ? s.students.join(", ") : "No one joined yet"}
                       </p>
                    </div>

                    <div style={{ background: "#fdfdfd", padding: "10px", borderRadius: "10px", textAlign: "center", fontWeight: "bold", border: "1px dashed var(--accent-blue)", fontSize: "0.85rem" }}>
                       Code: <strong>{s.code}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginTop: "auto" }}>
                       <button className="btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "0.75rem" }} onClick={() => {
                          setNewContent({...newContent, grade, subjectTitle: s.title, subjectIcon: s.icon});
                          setContentType("lecture");
                          setActiveTab("add");
                       }}>Add Material</button>
                    </div>
                  </div>
                )) : null
              ))}
              {Object.keys(customCurriculum).length === 0 && <p style={{ opacity: 0.5, gridColumn: "1 / -1", textAlign: "center" }}>No custom subjects found yet.</p>}
           </div>
        </div>
      )}

      {activeTab === "add" && (
        <div className="premium-card">
          <h2 style={{ marginBottom: "1.5rem" }}>Content Creator ✍️</h2>
          <div style={{ display: "flex", gap: "10px", marginBottom: "2rem" }}>
             <button className={contentType === "subject" ? "btn-primary" : "btn-secondary"} style={{ flex: 1 }} onClick={() => setContentType("subject")}>📚 New Subject</button>
             <button className={contentType === "lecture" ? "btn-primary" : "btn-secondary"} style={{ flex: 1 }} onClick={() => setContentType("lecture")}>📖 New Lesson</button>
             <button className={contentType === "quiz" ? "btn-primary" : "btn-secondary"} style={{ flex: 1 }} onClick={() => setContentType("quiz")}>📝 New Exam</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
             <div>
                <label style={{ fontSize: "0.8rem", opacity: 0.6 }}>Target Grade</label>
                <select style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #eee", background: "#fcfdfe", appearance: "none" }} value={newContent.grade} onChange={(e) => setNewContent({...newContent, grade: e.target.value})}>
                  {Object.keys(curriculum).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
             </div>
             <div>
                <label style={{ fontSize: "0.8rem", opacity: 0.6 }}>{contentType === "subject" ? "Subject Icon" : "Select Subject"}</label>
                {contentType === "subject" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <input type="text" placeholder="e.g. 🧪" style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #eee" }} value={newContent.subjectIcon} onChange={(e) => setNewContent({...newContent, subjectIcon: e.target.value})} />
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {["📚", "🧪", "🧮", "🎨", "🌍", "🎵", "💻", "🏀", "🍎", "🐾", "🚀", "🧬"].map(icon => (
                        <button 
                          key={icon} 
                          style={{ background: newContent.subjectIcon === icon ? "var(--primary-light)" : "#f8f9fa", border: "1px solid #eee", borderRadius: "10px", padding: "8px", fontSize: "1.2rem", cursor: "pointer", transition: "all 0.2s" }}
                          onClick={() => setNewContent({...newContent, subjectIcon: icon})}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #eee" }} value={newContent.subjectTitle} onChange={(e) => setNewContent({...newContent, subjectTitle: e.target.value})}>
                    <option value="">-- Choose Subject --</option>
                    {Object.values(curriculum).flat().map(s => <option key={s.title+s.grade} value={s.title}>{s.title} ({s.grade})</option>)}
                    {Object.values(customCurriculum).flat().map(s => <option key={s.id} value={s.title}>{s.title} (Custom)</option>)}
                  </select>
                )}
             </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
             <label style={{ fontSize: "0.8rem", opacity: 0.6 }}>{contentType === "subject" ? "Subject Title" : "Lesson/Exam Title"}</label>
             <input type="text" placeholder={contentType === "subject" ? "e.g. Science" : "e.g. Rocket Science 101"} style={{ width: "100%", padding: "12px", borderRadius: "15px", border: "1px solid #eee" }} value={contentType === "subject" ? newContent.subjectTitle : newContent.title} onChange={(e) => {
               if (contentType === "subject") setNewContent({...newContent, subjectTitle: e.target.value});
               else setNewContent({...newContent, title: e.target.value});
             }} />
          </div>

          {contentType === "lecture" && (
             <textarea 
               style={{ width: "100%", padding: "1.5rem", borderRadius: "15px", border: "1px solid #eee", minHeight: "300px", marginBottom: "2rem", background: "#fcfdfe" }} 
               placeholder="Write your lesson content here..."
               value={newContent.content}
               onChange={(e) => setNewContent({...newContent, content: e.target.value})}
             />
          )}

          {contentType === "quiz" && (
            <div style={{ marginBottom: "2rem" }}>
              {newContent.questions.map((q, idx) => (
                <div key={idx} style={{ background: "#f8f9fa", padding: "1.5rem", borderRadius: "20px", marginBottom: "1rem", border: "1px solid #eee" }}>
                   <input type="text" placeholder={`Question ${idx + 1}`} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "1rem" }} value={q.q} onChange={(e) => {
                     const qs = [...newContent.questions]; qs[idx].q = e.target.value; setNewContent({...newContent, questions: qs});
                   }} />
                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {q.options.map((opt, oIdx) => (
                        <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} style={{ padding: "10px", borderRadius: "10px", border: "1px solid #ddd" }} value={opt} onChange={(e) => {
                          const qs = [...newContent.questions]; qs[idx].options[oIdx] = e.target.value; setNewContent({...newContent, questions: qs});
                        }} />
                      ))}
                   </div>
                   <input type="text" placeholder="Correct Answer" style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "var(--accent-green) 1px solid", marginTop: "1rem", background: "#e6ffec" }} value={q.a} onChange={(e) => {
                     const qs = [...newContent.questions]; qs[idx].a = e.target.value; setNewContent({...newContent, questions: qs});
                   }} />
                </div>
              ))}
              <button className="btn-secondary" style={{ width: "100%", marginBottom: "1.5rem" }} onClick={handleAddQuestion}>+ Add Another Question</button>
            </div>
          )}

          <button className="btn-primary" style={{ width: "100%", padding: "1.5rem", fontSize: "1.2rem" }} onClick={handleSaveContent}>
            Confirm and Save {contentType.charAt(0).toUpperCase() + contentType.slice(1)} 🐾
          </button>
        </div>
      )}
    </div>
  );
}
