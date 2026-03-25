"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [customCurriculum, setCustomCurriculum] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null); // for subject detail view
  const [subjectStudents, setSubjectStudents] = useState([]);
  const [roleUpdating, setRoleUpdating] = useState(null); // track which user is updating
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create Content State
  const [contentType, setContentType] = useState("subject"); 
  const [newContent, setNewContent] = useState({
    grade: "Kinder 1",
    subjectTitle: "",
    subjectIcon: "📚",
    title: "",
    content: "",
    questions: [{ q: "", options: ["", "", "", ""], a: "" }],
    isPublic: false
  });
  const [newAnnouncement, setNewAnnouncement] = useState({ content: "", targetGrade: "" });
  const [announcements, setAnnouncements] = useState([]);

  const [sectionConfig, setSectionConfig] = useState({ "1": 5, "2": 3, "3": 3, "4": 3, "5": 3, "6": 6 });
  const gradeOptions = [
    "Kinder 1", "Kinder 2",
    ...[1,2,3,4,5,6].flatMap(n => {
       const sections = sectionConfig[n] || 3;
       return [
         `Grade ${n}`,
         ...Array.from({length: sections}, (_, i) => `Grade ${n} - Section ${i+1}`)
       ];
    })
  ];

  useEffect(() => {
    const fetchAllData = async () => {
       try {
         const storedUser = JSON.parse(localStorage.getItem("catUser"));
         if (!storedUser || storedUser.role === 'Student') {
           router.push("/");
           return;
         }
         setCurrentUser(storedUser);
         if (storedUser.role === 'Teacher') setActiveTab("subjects");

          const [uRes, cRes, aRes] = await Promise.all([
            fetch("/api/users"),
            fetch(`/api/curriculum?userId=${storedUser.id}&role=${storedUser.role}`),
            fetch("/api/announcements")
          ]);
         const userData = await uRes.json();
         const currData = await cRes.json();
         const annData = await aRes.json();
         
         if (!userData.error) setUsers(Array.isArray(userData) ? userData : []);
         if (!currData.error) setCustomCurriculum(currData);
         if (Array.isArray(annData)) setAnnouncements(annData);
       } catch (e) { 
         console.error("Fetch failed", e); 
       } finally { 
         setLoading(false); 
       }
    };
    fetchAllData();
  }, [router]);

  // Change user role
  const handleRoleChange = async (userId, newRole) => {
    setRoleUpdating(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole, requesterId: currentUser.id }) 
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        alert(`Role updated to ${newRole}! ✅`);
      } else {
        alert("Failed to update role: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Network error: " + e.message);
    } finally {
      setRoleUpdating(null);
    }
  };

  // Open subject detail
  const handleOpenSubject = async (subj, grade) => {
    setSelectedSubject({ ...subj, grade });
    setActiveTab("subjectDetail");
    // Fetch students for this subject
    try {
      const res = await fetch(`/api/classroom/${subj.id}?userId=${currentUser.id}`);
      const data = await res.json();
      setSubjectStudents(data.students || []);
    } catch (e) { setSubjectStudents([]); }
  };

  // Delete a lesson/task
  const handleDeleteLesson = async (lessonId) => {
    if (!confirm("Delete this lesson/exam? This cannot be undone!")) return;
    try {
      const res = await fetch(`/api/lessons/${lessonId}?requesterId=${currentUser.id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedSubject({
          ...selectedSubject,
          lessons: selectedSubject.lessons.filter(l => l.id !== lessonId)
        });
        alert("Deleted! 🗑️");
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  // Delete a subject
  const handleDeleteSubject = async (subjectId) => {
    if (!confirm("⚠️ Delete this entire subject and all its lessons? This cannot be undone!")) return;
    try {
      const res = await fetch(`/api/subjects/${subjectId}?requesterId=${currentUser.id}`, { method: "DELETE" });
      if (res.ok) {
        setSelectedSubject(null);
        setActiveTab("subjects");
        // Remove from local state
        const updated = { ...customCurriculum };
        Object.keys(updated).forEach(g => {
          if (Array.isArray(updated[g])) {
            updated[g] = updated[g].filter(s => s.id !== subjectId);
            if (updated[g].length === 0) delete updated[g];
          }
        });
        setCustomCurriculum(updated);
        alert("Subject deleted! 🗑️");
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  // Remove student from subject
  const handleRemoveStudent = async (studentId) => {
    if (!confirm("Remove this student from the class?")) return;
    try {
      const res = await fetch(`/api/classroom/${selectedSubject.id}/students/${studentId}?requesterId=${currentUser.id}`, { method: "DELETE" });
      if (res.ok) {
        setSubjectStudents(subjectStudents.filter(s => s.id !== studentId));
        alert("Student removed! ✅");
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  // Toggle Visibility
  const handleToggleVisibility = async (newVal) => {
    try {
      const res = await fetch(`/api/subjects/${selectedSubject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: newVal, userId: currentUser.id })
      });
      if (res.ok) {
        setSelectedSubject({ ...selectedSubject, is_public: newVal });
        // update local list
        const updated = { ...customCurriculum };
        Object.keys(updated).forEach(g => {
           if (Array.isArray(updated[g])) {
              updated[g] = updated[g].map(s => s.id === selectedSubject.id ? { ...s, is_public: newVal } : s);
           }
        });
        setCustomCurriculum(updated);
        alert(`Visibility updated to ${newVal ? 'Public' : 'Private'}! 🐾`);
      }
    } catch (e) { alert("Failed to update visibility: " + e.message); }
  };

  // Post Announcement
  const handlePostAnnouncement = async () => {
    if (!newAnnouncement.content) return;
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newAnnouncement, authorId: currentUser.id })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnnouncements([data, ...announcements]);
      setNewAnnouncement({ content: "", targetGrade: "" });
      alert("Announcement posted! 📜✅");
    } catch (e) { alert("Failed: " + e.message); }
  };

  // Change student grade/section
  const handleGradeChange = async (userId, newGrade) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade: newGrade, requesterId: currentUser.id })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, grade: newGrade } : u));
        alert("Student moved to new Grade/Section! 🏫✅");
      }
    } catch (e) { alert("Failed! " + e.message); }
  };

  // Save new content
  const handleSaveContent = async () => {
    try {
      if (contentType === "subject" && !newContent.subjectTitle) {
        alert("Please enter a Subject Title! 🐾"); return;
      }
      if (contentType !== "subject" && !newContent.title) {
        alert("Please enter a Title! 🐾"); return;
      }

      const payload = contentType === "subject" ? {
        type: "subject",
        grade: newContent.grade,
        title: newContent.subjectTitle,
        icon: newContent.subjectIcon || "📚",
        userId: currentUser.id,
        isPublic: newContent.isPublic
      } : {
        grade: newContent.grade,
        subjectTitle: newContent.subjectTitle,
        title: newContent.title,
        content: contentType === "lecture" ? newContent.content : null,
        questions: contentType === "quiz" ? newContent.questions : null,
        userId: currentUser.id
      };

      const response = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      alert(`Created successfully! 🐾 ${data.code ? `\nInvite Code: ${data.code}` : ""}`);
      window.location.reload();
    } catch (e) { alert("Failed! " + e.message); }
  };

  if (loading) return <div className="flex-center" style={{ height: "100vh" }}>Loading... 🐾</div>;

  return (
    <div className="container" style={{ padding: "clamp(1rem, 5vw, 3rem) 0" }}>
      {/* Header */}
      <header className="premium-card" style={{ 
        marginBottom: "2rem", display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "space-between", alignItems: "center", background: "white", border: "1px solid rgba(255,157,204,0.2)", padding: "1.2rem 1.5rem", boxShadow: "0 10px 30px rgba(255,157,204,0.1)", borderRadius: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
           <h1 style={{ fontSize: "clamp(1.2rem, 4vw, 1.8rem)", margin: 0, color: "#333" }}>{currentUser?.role === 'Headmaster' ? "Headmaster 👑" : "Teacher 👩‍🏫"}</h1>
           <span style={{ fontSize: "0.75rem", background: "var(--primary-light)", color: "var(--primary-color)", padding: "3px 10px", borderRadius: "20px", fontWeight: "800" }}>{currentUser?.role}</span>
        </div>
        <div className="nav-buttons" style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {currentUser?.role === 'Headmaster' && (
            <>
              <button className={activeTab === "users" ? "btn-primary" : "btn-secondary"} style={{ padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => { setSelectedSubject(null); setActiveTab("users"); }}>Users 🐾</button>
              <button className={activeTab === "bulletin" ? "btn-primary" : "btn-secondary"} style={{ padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => { setSelectedSubject(null); setActiveTab("bulletin"); }}>Bulletin 📜</button>
            </>
          )}
          <button className={activeTab === "subjects" || activeTab === "subjectDetail" ? "btn-primary" : "btn-secondary"} style={{ padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => { setSelectedSubject(null); setActiveTab("subjects"); }}>Subjects 🏷️</button>
          <button className={activeTab === "add" ? "btn-primary" : "btn-secondary"} style={{ padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => setActiveTab("add")}>+ Create 📚</button>
          {currentUser?.role === 'Headmaster' && (
             <button className={activeTab === "setup" ? "btn-primary" : "btn-secondary"} style={{ padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => setActiveTab("setup")}>Sections ⚙️</button>
          )}
          <button className="btn-secondary" style={{ padding: "8px 12px", background: "#f8f9fa", fontSize: "0.8rem" }} onClick={() => router.push("/dashboard")}>🏠</button>
          <button className="btn-secondary" style={{ padding: "8px 12px", background: "#fff5f5", color: "#e03e3e", border: "1px solid #ffe3e3", fontSize: "0.8rem" }} onClick={() => { localStorage.removeItem("catUser"); router.push("/"); }}>Logout 🚪</button>
        </div>
      </header>

      {/* ========== USERS TAB ========== */}
      {activeTab === "users" && (() => {
        const filteredUsers = users.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const grouped = filteredUsers.reduce((acc, u) => {
          if (u.role === 'Headmaster') {
             acc['1_Headmaster'] = [...(acc['1_Headmaster'] || []), u];
          } else if (u.role === 'Teacher') {
             acc['2_Teachers'] = [...(acc['2_Teachers'] || []), u];
          } else {
             const g = u.grade || 'Unassigned Students';
             acc[`3_${g}`] = [...(acc[`3_${g}`] || []), u];
          }
          return acc;
        }, {});
        
        const sortedKeys = Object.keys(grouped).sort();

        return (
          <div className="premium-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
              <h2 style={{ margin: 0 }}>All Academy Users ({filteredUsers.length}{searchQuery && ` of ${users.length}`})</h2>
              <input 
                type="text" 
                placeholder="Search by name 🔍" 
                style={{ padding: "10px 20px", borderRadius: "30px", border: "2px solid #eee", fontSize: "0.9rem", minWidth: "250px", outline: "none" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              {sortedKeys.map(catKey => {
                const title = catKey.startsWith('1_') ? 'Headmaster & Administration 👑' : 
                              catKey.startsWith('2_') ? 'Teachers 👩‍🏫' : 
                              `${catKey.substring(2)} 🎒`;
                const catUsers = grouped[catKey];
                return (
                  <div key={catKey}>
                    <h3 style={{ marginBottom: "1rem", color: "var(--primary-dark)", borderBottom: "2px solid var(--primary-light)", paddingBottom: "0.5rem", fontSize: "1.2rem" }}>
                      {title} <span style={{ opacity: 0.5, fontSize: "0.9rem" }}>({catUsers.length})</span>
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                      {catUsers.map((u) => (
                        <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.2rem", background: "#f9fafb", borderRadius: "16px", border: "1px solid #f0f0f0", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: u.role === "Headmaster" ? "linear-gradient(135deg, var(--primary-light), #fff0f6)" : u.role === "Teacher" ? "linear-gradient(135deg, var(--secondary-light), #e8f4ff)" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.9rem", color: u.role === "Headmaster" ? "var(--primary-color)" : u.role === "Teacher" ? "var(--accent-blue)" : "#999" }}>
                              {(u.name || "?")[0].toUpperCase()}
                            </div>
                            <div>
                              <p style={{ fontWeight: "700", margin: 0, fontSize: "0.95rem" }}>{u.name}</p>
                              {currentUser?.role === 'Headmaster' ? (
                                 <select 
                                   style={{ fontSize: "0.7rem", border: "1px solid #eee", padding: "2px 5px", background: "none", borderRadius: "5px", color: "#888" }}
                                   value={u.grade}
                                   onChange={(e) => handleGradeChange(u.id, e.target.value)}
                                 >
                                    {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                 </select>
                              ) : (
                                 <p style={{ fontSize: "0.75rem", opacity: 0.5, margin: 0 }}>{u.grade}</p>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700", background: u.role === 'Headmaster' ? "var(--primary-light)" : u.role === 'Teacher' ? "var(--secondary-light)" : "#f0f0f0", color: u.role === 'Headmaster' ? "var(--primary-color)" : u.role === 'Teacher' ? "var(--accent-blue)" : "#888" }}>
                              {u.role || "Student"}
                            </span>
                            {u.id === currentUser?.id ? (
                              <span style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>You (cannot change own role)</span>
                            ) : u.role === 'Headmaster' ? (
                              <span style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>Cannot change another Headmaster</span>
                            ) : (
                              <>
                                <select 
                                  style={{ padding: "6px 12px", borderRadius: "12px", border: "2px solid #eee", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", background: "white" }}
                                  value={u.role || "Student"}
                                  disabled={roleUpdating === u.id}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                >
                                  <option value="Student">Student 🎒</option>
                                  <option value="Teacher">Teacher 📖</option>
                                </select>
                                {roleUpdating === u.id && <span style={{ fontSize: "0.75rem", color: "var(--primary-color)" }}>Saving...</span>}
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      
      {/* ========== BULLETIN TAB (Headmaster) ========== */}
      {activeTab === "bulletin" && (
        <div className="premium-card">
           <h2 style={{ marginBottom: "1.5rem" }}>School Announcements 📜</h2>
           
           <div className="premium-card" style={{ background: "#fcfdfe", border: "1px solid #eee", padding: "1.5rem", marginBottom: "2rem" }}>
              <h4>Post New Announcement ✍️</h4>
              <textarea 
                placeholder="What's the latest news, Headmaster? 🐾"
                style={{ width: "100%", padding: "1rem", borderRadius: "14px", border: "1px solid #eee", minHeight: "100px", margin: "1rem 0", background: "white", resize: "vertical" }}
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
              />
              <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                 <select 
                   style={{ padding: "10px", borderRadius: "10px", border: "1px solid #eee", fontSize: "0.85rem" }}
                   value={newAnnouncement.targetGrade}
                   onChange={(e) => setNewAnnouncement({...newAnnouncement, targetGrade: e.target.value})}
                 >
                    <option value="">All Grades 🌍</option>
                    {gradeOptions.map(g => <option key={g} value={g}>{g} Only</option>)}
                 </select>
                 <button className="btn-primary" style={{ padding: "10px 24px", fontSize: "0.85rem" }} onClick={handlePostAnnouncement}>Post Bulletin 🚀</button>
              </div>
           </div>

           <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h3>Recent Bulletins</h3>
              {announcements.map((a, i) => (
                <div key={i} style={{ padding: "1rem 1.5rem", background: "#f8f9fa", borderRadius: "16px", border: "1px solid #eee" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "var(--primary-color)" }}>{a.target_grade || "SCHOOLWIDE"}</span>
                      <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>{new Date(a.created_at).toLocaleDateString()}</span>
                   </div>
                   <p style={{ margin: 0, fontSize: "0.95rem" }}>{a.content}</p>
                </div>
              ))}
              {announcements.length === 0 && <p style={{ opacity: 0.5, textAlign: "center" }}>No announcements yet.</p>}
           </div>
        </div>
      )}

      {/* ========== SUBJECTS LIST TAB ========== */}
      {activeTab === "subjects" && (
        <div className="premium-card">
           <h2 style={{ marginBottom: "1.5rem" }}>School Subjects 📚</h2>
           <div className="grid-cols" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {Object.entries(customCurriculum).map(([grade, subjects]) => (
                Array.isArray(subjects) ? subjects.map(s => (
                  <div key={s.id} className="premium-card" 
                    style={{ padding: "1.2rem", border: "1px solid #eee", background: "rgba(255,255,255,0.5)", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer" }}
                    onClick={() => handleOpenSubject(s, grade)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                       <span style={{ fontSize: "2.2rem" }}>{s.icon}</span>
                        <div style={{ display: "flex", gap: "5px" }}>
                           <span style={{ fontSize: "0.65rem", background: s.is_public ? "#e6ffec" : "#f0f0f0", color: s.is_public ? "var(--accent-green)" : "#888", padding: "2px 8px", borderRadius: "10px", fontWeight: "800" }}>{s.is_public ? "PUBLIC" : "PRIVATE"}</span>
                           <span style={{ fontSize: "0.65rem", background: "var(--primary-light)", color: "var(--primary-color)", padding: "2px 8px", borderRadius: "10px", fontWeight: "800" }}>{grade}</span>
                        </div>
                    </div>
                    <h4 style={{ margin: 0, fontSize: "1.1rem" }}>{s.title}</h4>
                    <div style={{ display: "flex", gap: "8px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span>📖 {s.lessons?.length || 0} lessons</span>
                      <span>•</span>
                      <span>👥 {s.studentsCount || 0} students</span>
                    </div>
                    <div style={{ background: "#f8f9fa", padding: "8px", borderRadius: "10px", textAlign: "center", fontWeight: "700", fontSize: "0.8rem", color: "var(--accent-blue)", border: "1px dashed rgba(9,132,227,0.2)" }}>
                       {s.code}
                    </div>
                    <button className="btn-secondary" style={{ padding: "8px", fontSize: "0.75rem", width: "100%" }}>
                      Manage Subject →
                    </button>
                  </div>
                )) : null
              ))}
              {Object.keys(customCurriculum).length === 0 && <p style={{ opacity: 0.5, gridColumn: "1 / -1", textAlign: "center" }}>No subjects yet. Create one from the "+ Create" tab! 📚</p>}
           </div>
        </div>
      )}

      {/* ========== SUBJECT DETAIL TAB ========== */}
      {activeTab === "subjectDetail" && selectedSubject && (
        <div>
          {/* Back Button */}
          <button className="btn-secondary" style={{ marginBottom: "1rem", padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => { setSelectedSubject(null); setActiveTab("subjects"); }}>← Back to Subjects</button>

          {/* Subject Header */}
          <div className="premium-card" style={{ marginBottom: "1.5rem", background: "linear-gradient(135deg, var(--primary-light), var(--secondary-light))" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                <span style={{ fontSize: "3rem" }}>{selectedSubject.icon}</span>
                <div>
                  <h2 style={{ marginBottom: "3px" }}>{selectedSubject.title}</h2>
                  <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>{selectedSubject.grade} • Code: <strong>{selectedSubject.code}</strong></p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className={selectedSubject.is_public ? "btn-primary" : "btn-secondary"} style={{ padding: "8px 16px", fontSize: "0.8rem", background: selectedSubject.is_public ? "var(--accent-green)" : "" }} onClick={() => handleToggleVisibility(!selectedSubject.is_public)}>
                  {selectedSubject.is_public ? "Make Private 🔒" : "Make Public 🌍"}
                </button>
                <button className="btn-secondary" style={{ background: "#fff5f5", color: "#e03e3e", border: "1px solid #ffe3e3", padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => handleDeleteSubject(selectedSubject.id)}>
                  Delete Subject 🗑️
                </button>
              </div>

            </div>
          </div>

          {/* Lessons & Exams */}
          <div className="premium-card" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Lessons & Exams ({selectedSubject.lessons?.length || 0})</h3>
              <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.8rem" }} onClick={() => {
                setNewContent({ ...newContent, grade: selectedSubject.grade, subjectTitle: selectedSubject.title, subjectIcon: selectedSubject.icon });
                setContentType("lecture");
                setActiveTab("add");
              }}>+ Add Task</button>
            </div>
            {(!selectedSubject.lessons || selectedSubject.lessons.length === 0) ? (
              <p style={{ opacity: 0.5, textAlign: "center", padding: "2rem" }}>No lessons or exams yet. Click "+ Add Task" above! 📚</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {selectedSubject.lessons.map((l) => (
                  <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "#f9fafb", borderRadius: "14px", border: "1px solid #f0f0f0", flexWrap: "wrap", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <span style={{ fontSize: "1.3rem" }}>{l.type === "quiz" ? "📝" : "📖"}</span>
                      <div>
                        <p style={{ fontWeight: "700", margin: 0, fontSize: "0.9rem" }}>{l.title}</p>
                        <p style={{ fontSize: "0.7rem", opacity: 0.5, margin: 0 }}>{l.type === "quiz" ? "Exam" : "Lesson"}</p>
                      </div>
                    </div>
                    <button 
                      className="btn-secondary" 
                      style={{ background: "#fff5f5", color: "#e03e3e", border: "1px solid #ffe3e3", padding: "6px 14px", fontSize: "0.75rem" }}
                      onClick={() => handleDeleteLesson(l.id)}
                    >Delete 🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Enrolled Students */}
          <div className="premium-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3>Enrolled Students ({subjectStudents.length})</h3>
            </div>
            {subjectStudents.length === 0 ? (
              <p style={{ opacity: 0.5, textAlign: "center", padding: "2rem" }}>No students enrolled yet. Share the code: <strong>{selectedSubject.code}</strong> 📨</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {subjectStudents.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.8rem 1rem", background: "#f9fafb", borderRadius: "14px", border: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary-light), var(--secondary-light))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "0.85rem", color: "var(--primary-color)" }}>
                        {(s.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: "700", margin: 0, fontSize: "0.9rem" }}>{s.name}</p>
                        <p style={{ fontSize: "0.7rem", opacity: 0.5, margin: 0 }}>{s.grade} • Level {s.level || 1}</p>
                      </div>
                    </div>
                    <button 
                      className="btn-secondary"
                      style={{ background: "#fff5f5", color: "#e03e3e", border: "1px solid #ffe3e3", padding: "6px 14px", fontSize: "0.75rem" }}
                      onClick={() => handleRemoveStudent(s.id)}
                    >Remove ✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== CREATE TAB ========== */}
      {activeTab === "add" && (
        <div className="premium-card">
          <h2 style={{ marginBottom: "1.5rem" }}>Content Creator ✍️</h2>
          <div style={{ display: "flex", gap: "8px", marginBottom: "2rem", flexWrap: "wrap" }}>
             <button className={contentType === "subject" ? "btn-primary" : "btn-secondary"} style={{ flex: 1, padding: "10px", fontSize: "0.85rem", minWidth: "100px" }} onClick={() => setContentType("subject")}>📚 Subject</button>
             <button className={contentType === "lecture" ? "btn-primary" : "btn-secondary"} style={{ flex: 1, padding: "10px", fontSize: "0.85rem", minWidth: "100px" }} onClick={() => setContentType("lecture")}>📖 Lesson</button>
             <button className={contentType === "quiz" ? "btn-primary" : "btn-secondary"} style={{ flex: 1, padding: "10px", fontSize: "0.85rem", minWidth: "100px" }} onClick={() => setContentType("quiz")}>📝 Exam</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
             <div>
                <label style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "4px", display: "block" }}>Target Grade</label>
                <select style={{ width: "100%", padding: "12px", borderRadius: "14px", border: "2px solid #eee", background: "#f9fafb", fontSize: "0.9rem" }} value={newContent.grade} onChange={(e) => setNewContent({...newContent, grade: e.target.value})}>
                  {gradeOptions.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
             </div>
             <div>
                <label style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "4px", display: "block" }}>{contentType === "subject" ? "Subject Icon" : "Select Subject"}</label>
                {contentType === "subject" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <input type="text" placeholder="e.g. 🧪" style={{ width: "100%", padding: "12px", borderRadius: "14px", border: "2px solid #eee" }} value={newContent.subjectIcon} onChange={(e) => setNewContent({...newContent, subjectIcon: e.target.value})} />
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {["📚", "🧪", "🧮", "🎨", "🌍", "🎵", "💻", "🏀", "🍎", "🐾", "🚀", "🧬"].map(icon => (
                        <button key={icon} style={{ background: newContent.subjectIcon === icon ? "var(--primary-light)" : "#f8f9fa", border: "1px solid #eee", borderRadius: "10px", padding: "6px", fontSize: "1.1rem", cursor: "pointer" }}
                          onClick={() => setNewContent({...newContent, subjectIcon: icon})}>{icon}</button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <select style={{ width: "100%", padding: "12px", borderRadius: "14px", border: "2px solid #eee" }} value={newContent.subjectTitle} onChange={(e) => setNewContent({...newContent, subjectTitle: e.target.value})}>
                    <option value="">-- Choose --</option>
                    {Object.entries(customCurriculum).map(([g, subs]) => 
                      Array.isArray(subs) ? subs.map(s => <option key={s.id} value={s.title}>{s.title} ({g})</option>) : null
                    )}
                  </select>
                )}
             </div>
          </div>

          {contentType === "subject" && (
            <div className="premium-card" style={{ padding: "1.2rem", marginBottom: "1.5rem", background: "#f8f9fa", border: "2px dashed #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ display: "block", fontSize: "0.9rem" }}>Public for this Grade 🌍</b>
                <p style={{ fontSize: "0.75rem", opacity: 0.6 }}>Every student in {newContent.grade} will see this automatically.</p>
              </div>
              <input 
                type="checkbox" 
                style={{ width: "24px", height: "24px", cursor: "pointer" }} 
                checked={newContent.isPublic}
                onChange={(e) => setNewContent({...newContent, isPublic: e.target.checked})}
              />
            </div>
          )}

          <div style={{ marginBottom: "1.5rem" }}>
             <label style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "4px", display: "block" }}>{contentType === "subject" ? "Subject Title" : "Title"}</label>
             <input type="text" placeholder={contentType === "subject" ? "e.g. Science" : "e.g. Chapter 1"} style={{ width: "100%", padding: "12px", borderRadius: "14px", border: "2px solid #eee" }} value={contentType === "subject" ? newContent.subjectTitle : newContent.title} onChange={(e) => {
               if (contentType === "subject") setNewContent({...newContent, subjectTitle: e.target.value});
               else setNewContent({...newContent, title: e.target.value});
             }} />
          </div>

          {contentType === "lecture" && (
             <textarea 
               style={{ width: "100%", padding: "1.2rem", borderRadius: "14px", border: "2px solid #eee", minHeight: "250px", marginBottom: "1.5rem", background: "#f9fafb", resize: "vertical" }} 
               placeholder="Write your lesson content here..."
               value={newContent.content}
               onChange={(e) => setNewContent({...newContent, content: e.target.value})}
             />
          )}

          {contentType === "quiz" && (
            <div style={{ marginBottom: "1.5rem" }}>
              {newContent.questions.map((q, idx) => (
                <div key={idx} style={{ background: "#f8f9fa", padding: "1.2rem", borderRadius: "16px", marginBottom: "0.8rem", border: "1px solid #eee" }}>
                   <input type="text" placeholder={`Question ${idx + 1}`} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "8px" }} value={q.q} onChange={(e) => {
                     const qs = [...newContent.questions]; qs[idx].q = e.target.value; setNewContent({...newContent, questions: qs});
                   }} />
                   <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {q.options.map((opt, oIdx) => (
                        <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }} value={opt} onChange={(e) => {
                          const qs = [...newContent.questions]; qs[idx].options[oIdx] = e.target.value; setNewContent({...newContent, questions: qs});
                        }} />
                      ))}
                   </div>
                   <input type="text" placeholder="Correct Answer" style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid var(--accent-green)", marginTop: "8px", background: "#e6ffec" }} value={q.a} onChange={(e) => {
                     const qs = [...newContent.questions]; qs[idx].a = e.target.value; setNewContent({...newContent, questions: qs});
                   }} />
                </div>
              ))}
              <button className="btn-secondary" style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }} onClick={() => setNewContent({...newContent, questions: [...newContent.questions, { q: "", options: ["", "", "", ""], a: "" }]})}>+ Add Question</button>
            </div>
          )}

          <button className="btn-primary" style={{ width: "100%", padding: "1.2rem", fontSize: "1rem" }} onClick={handleSaveContent}>
            Save {contentType.charAt(0).toUpperCase() + contentType.slice(1)} 🐾
          </button>
        </div>
      )}

      {/* ========== SECTION SETUP TAB (Headmaster ONLY) ========== */}
      {activeTab === "setup" && (
        <div className="premium-card">
           <h2 style={{ marginBottom: "1.5rem" }}>School Grade Setup 🏫</h2>
           <p style={{ opacity: 0.6, fontSize: "0.9rem", marginBottom: "2rem" }}>Define how many sections each grade level has. These sections will appear in the registration list. 🐾</p>
           
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.2rem" }}>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="premium-card" style={{ padding: "1.2rem", border: "1px solid #eee", background: "white", boxShadow: "0 5px 15px rgba(0,0,0,0.02)" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                      <label style={{ fontWeight: "800", color: "#444" }}>Grade {n}</label>
                      <span style={{ fontSize: "0.65rem", color: "var(--primary-color)", background: "var(--primary-light)", padding: "2px 8px", borderRadius: "10px", fontWeight: "800" }}>STUDENTS</span>
                   </div>
                   <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <input 
                        type="number" 
                        min="0" 
                        max="20"
                        style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "2px solid #f0f0f0", fontWeight: "700", fontSize: "1.1rem" }}
                        value={sectionConfig[n] || 0}
                        onChange={(e) => setSectionConfig({ ...sectionConfig, [n]: parseInt(e.target.value) || 0 })}
                      />
                      <span style={{ fontSize: "1.5rem" }}>🎒</span>
                   </div>
                   <p style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "10px", margin: 0 }}>Number of sections for Grade {n}</p>
                </div>
              ))}
           </div>
           
           <div className="premium-card" style={{ marginTop: "2.5rem", background: "#fcfdfe", border: "1px dashed rgba(0,0,0,0.1)", padding: "1.5rem" }}>
              <p style={{ margin: "0 0 1rem 0", fontWeight: "800", fontSize: "0.95rem", color: "#333" }}>Live Preview of Grade Options 📜</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                 {gradeOptions.map(g => (
                    <span key={g} style={{ fontSize: "0.7rem", background: "white", padding: "5px 12px", borderRadius: "20px", border: "1px solid #eee", boxShadow: "0 2px 5px rgba(0,0,0,0.03)", color: "#666" }}>{g}</span>
                 ))}
              </div>
           </div>

           <button className="btn-primary" style={{ marginTop: "2.5rem", width: "100%", padding: "1.4rem", fontSize: "1.1rem" }} onClick={() => {
              // persistence could be added here later with an API call
              alert("Section configuration updated! ✅ New students can now register for these sections.");
           }}>
              Save School Structure 🚀
           </button>
        </div>
      )}
    </div>
  );
}
