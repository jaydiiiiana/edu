"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId;

  const [user, setUser] = useState(null);
  const [subject, setSubject] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stream");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState({});

  // Teacher: create task
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskType, setTaskType] = useState("lesson");
  const [taskData, setTaskData] = useState({ title: "", content: "", mediaUrl: "", questions: [{ q: "", options: ["", "", "", ""], a: "" }] });

  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("catUser");
      if (!stored) { router.push("/"); return; }
      const parsed = JSON.parse(stored);
      setUser(parsed);

      const storedProgress = JSON.parse(localStorage.getItem("catProgress") || "{}");
      setProgress(storedProgress);

      try {
        const res = await fetch(`/api/classroom/${subjectId}?userId=${parsed.id}`);
        const data = await res.json();
        if (data.error) {
          setErrorMessage(data.error);
          setLoading(false);
          return;
        }
        setSubject(data.subject);
        setStudents(data.students || []);
      } catch (e) {
        console.error("Failed to load classroom", e);
        setErrorMessage(e.message);
      } finally { 
        setLoading(false); 
      }
    };
    init();
  }, [subjectId, router]);

  const isTeacher = user && (user.role === "Headmaster" || user.role === "Teacher");

  const handleCreateTask = async () => {
    if (!taskData.title) { alert("Please add a title! 🐾"); return; }
    try {
      const res = await fetch(`/api/classroom/${subjectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          type: taskType,
          title: taskData.title,
          content: taskData.content,
          mediaUrl: taskType === "lesson" ? taskData.mediaUrl : null,
          questions: taskType === "quiz" ? taskData.questions : null
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      alert("Task created! 🐾✅");
      window.location.reload();
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!confirm("Remove this student from the class?")) return;
    try {
      const res = await fetch(`/api/classroom/${subjectId}/students/${studentId}?requesterId=${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStudents(students.filter(s => s.id !== studentId));
    } catch (e) { alert("Error: " + e.message); }
  };

  if (loading) return <div className="flex-center" style={{ height: "100vh" }}>Loading Classroom... 🐾</div>;
  if (!subject) return (
    <div className="flex-center" style={{ height: "100vh", flexDirection: "column", gap: "1.5rem", padding: "2rem", textAlign: "center" }}>
      <div style={{ fontSize: "5rem" }}>😿</div>
      <h2 style={{ maxWidth: "500px" }}>{errorMessage || "Classroom not found!"}</h2>
      <button className="btn-secondary" onClick={() => router.push("/dashboard")}>Back to Dashboard</button>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Header Banner */}
      <header style={{
        background: "linear-gradient(135deg, var(--primary-color), var(--accent-pink), var(--secondary-color))",
        color: "white",
        padding: "clamp(2rem, 5vw, 4rem) clamp(1rem, 5vw, 4rem)",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: "1200px", margin: "0 auto" }}>
          <button 
            onClick={() => router.push("/dashboard")}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", padding: "8px 20px", borderRadius: "50px", cursor: "pointer", marginBottom: "1.5rem", fontWeight: "600", backdropFilter: "blur(10px)" }}
          >← Back to Dashboard</button>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <span style={{ fontSize: "3rem", display: "block", marginBottom: "0.5rem" }}>{subject.icon}</span>
              <h1 style={{ color: "white", fontSize: "clamp(1.5rem, 5vw, 2.5rem)", marginBottom: "0.3rem" }}>{subject.title}</h1>
              <p style={{ opacity: 0.85, fontSize: "1rem" }}>{subject.grade} • {subject.lessons?.length || 0} Lessons • {students.length} Students</p>
            </div>
            {isTeacher && (
              <div style={{ background: "rgba(255,255,255,0.15)", padding: "12px 20px", borderRadius: "16px", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.2)" }}>
                <p style={{ fontSize: "0.75rem", opacity: 0.8, marginBottom: "4px" }}>Invite Code</p>
                <p style={{ fontSize: "1.3rem", fontWeight: "800", letterSpacing: "2px" }}>{subject.code}</p>
              </div>
            )}
          </div>
        </div>
        <span style={{ position: "absolute", right: "-30px", bottom: "-30px", fontSize: "15rem", opacity: 0.06 }}>{subject.icon}</span>
      </header>

      {/* Tab Navigation */}
      <div style={{ borderBottom: "2px solid #f0f0f0", background: "white", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", gap: "0", overflowX: "auto" }}>
          {["stream", "lessons", ...(isTeacher ? ["students"] : [])].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "16px 28px",
                border: "none",
                background: "none",
                cursor: "pointer",
                fontWeight: activeTab === tab ? "800" : "500",
                color: activeTab === tab ? "var(--primary-color)" : "#999",
                borderBottom: activeTab === tab ? "3px solid var(--primary-color)" : "3px solid transparent",
                fontSize: "0.95rem",
                textTransform: "capitalize",
                transition: "all 0.2s",
                whiteSpace: "nowrap"
              }}
            >{tab === "stream" ? "📋 Stream" : tab === "lessons" ? "📖 Lessons" : "👥 Students"}</button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem clamp(1rem, 3vw, 2rem)" }}>

        {/* STREAM TAB */}
        {activeTab === "stream" && (
          <div>
            {/* Teacher: Create Task */}
            {isTeacher && (
              <div style={{ marginBottom: "2rem" }}>
                {!showTaskForm ? (
                  <div 
                    className="premium-card" 
                    onClick={() => setShowTaskForm(true)}
                    style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "15px", padding: "1.2rem 1.5rem" }}
                  >
                    <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>✏️</div>
                    <p style={{ opacity: 0.5, fontWeight: "600" }}>Create a new lesson or exam for your class...</p>
                  </div>
                ) : (
                  <div className="premium-card" style={{ padding: "2rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                      <h3>Create New Task ✍️</h3>
                      <button onClick={() => setShowTaskForm(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", opacity: 0.5 }}>✕</button>
                    </div>

                    <div style={{ display: "flex", gap: "10px", marginBottom: "1.5rem" }}>
                      <button className={taskType === "lesson" ? "btn-primary" : "btn-secondary"} style={{ flex: 1, padding: "10px" }} onClick={() => setTaskType("lesson")}>📖 Lesson</button>
                      <button className={taskType === "quiz" ? "btn-primary" : "btn-secondary"} style={{ flex: 1, padding: "10px" }} onClick={() => setTaskType("quiz")}>📝 Exam</button>
                    </div>

                    <input 
                      type="text" placeholder="Title (e.g. Chapter 1: Introduction)" 
                      style={{ width: "100%", padding: "14px", borderRadius: "15px", border: "1px solid #eee", marginBottom: "1rem", fontSize: "1rem" }}
                      value={taskData.title} onChange={(e) => setTaskData({...taskData, title: e.target.value})}
                    />

                    {taskType === "lesson" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1rem" }}>
                        <input 
                          type="text" placeholder="Media URL (Image or YouTube link) 🖼️🎥" 
                          style={{ width: "100%", padding: "14px", borderRadius: "15px", border: "1px solid #eee", fontSize: "1rem" }}
                          value={taskData.mediaUrl} onChange={(e) => setTaskData({...taskData, mediaUrl: e.target.value})}
                        />
                        <textarea 
                          placeholder="Write your lesson content here..."
                          style={{ width: "100%", padding: "1.5rem", borderRadius: "15px", border: "1px solid #eee", minHeight: "200px", background: "#fcfdfe", resize: "vertical" }}
                          value={taskData.content} onChange={(e) => setTaskData({...taskData, content: e.target.value})}
                        />
                      </div>
                    )}

                    {taskType === "quiz" && (
                      <div style={{ marginBottom: "1rem" }}>
                        {taskData.questions.map((q, idx) => (
                          <div key={idx} style={{ background: "#f8f9fa", padding: "1.2rem", borderRadius: "16px", marginBottom: "10px", border: "1px solid #eee" }}>
                            <input type="text" placeholder={`Question ${idx + 1}`} style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid #ddd", marginBottom: "10px" }}
                              value={q.q} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].q = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                              {q.options.map((opt, oIdx) => (
                                <input key={oIdx} type="text" placeholder={`Option ${oIdx + 1}`} style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ddd" }}
                                  value={opt} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].options[oIdx] = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                              ))}
                            </div>
                            <input type="text" placeholder="Correct Answer" style={{ width: "100%", padding: "10px", borderRadius: "10px", border: "1px solid var(--accent-green)", marginTop: "10px", background: "#e6ffec" }}
                              value={q.a} onChange={(e) => { const qs = [...taskData.questions]; qs[idx].a = e.target.value; setTaskData({...taskData, questions: qs}); }} />
                          </div>
                        ))}
                        <button className="btn-secondary" style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                          onClick={() => setTaskData({...taskData, questions: [...taskData.questions, { q: "", options: ["", "", "", ""], a: "" }]})}>
                          + Add Question
                        </button>
                      </div>
                    )}

                    <button className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: "1rem" }} onClick={handleCreateTask}>
                      Post to Class 🚀
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Stream Items (Lessons & Exams) */}
            {(!subject.lessons || subject.lessons.length === 0) ? (
              <div className="premium-card" style={{ textAlign: "center", padding: "4rem 2rem", opacity: 0.6 }}>
                <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>📭</p>
                <h3>No posts yet</h3>
                <p>{isTeacher ? "Create your first lesson or exam above!" : "Your teacher hasn't posted anything yet."}</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {subject.lessons.map((lesson, idx) => {
                  const isCompleted = progress[subject.grade]?.[subject.title]?.includes(lesson.id);
                  const canTake = !isCompleted || lesson.type === "lecture" || isTeacher;

                  return (
                    <div key={lesson.id} className="premium-card" style={{ padding: "1.5rem 2rem", cursor: canTake ? "pointer" : "default", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: !canTake ? 0.7 : 1 }}
                      onClick={() => canTake ? router.push(`/lessons/${subject.grade}/${subject.title}/${lesson.id}`) : alert("🔒 You have already finished this exam! 🐾")}>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div style={{
                          width: "48px", height: "48px", borderRadius: "50%",
                          background: isCompleted ? "var(--accent-green)" : (lesson.type === "quiz" ? "var(--primary-light)" : "var(--secondary-light)"),
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", flexShrink: 0
                        }}>
                          {isCompleted ? "✅" : (lesson.type === "quiz" ? "📝" : "📖")}
                        </div>
                        <div>
                          <h3 style={{ fontSize: "1.1rem", marginBottom: "3px" }}>{lesson.title}</h3>
                          <p style={{ opacity: 0.5, fontSize: "0.8rem" }}>{lesson.type === "quiz" ? "Exam" : "Lesson"} • {isCompleted ? "Completed" : "New Post"}</p>
                        </div>
                      </div>
                      <button className="btn-secondary" style={{ padding: "8px 20px", fontSize: "0.8rem", flexShrink: 0, background: isCompleted ? "#e6ffec" : "", color: isCompleted ? "var(--accent-green)" : "" }}>
                        {isCompleted ? (lesson.type === "quiz" ? "Finished ✅" : "Review 📖") : (lesson.type === "quiz" ? "Take Exam" : "Read →")}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LESSONS TAB */}
        {activeTab === "lessons" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2>Lessons & Exams 📖</h2>
              {isTeacher && <button className="btn-primary" style={{ padding: "10px 20px", fontSize: "0.85rem" }} onClick={() => { setActiveTab("stream"); setShowTaskForm(true); }}>+ Add New</button>}
            </div>
            {(!subject.lessons || subject.lessons.length === 0) ? (
              <div className="premium-card" style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                <p>No lessons yet. {isTeacher ? "Create one from the Stream tab!" : "Check back soon!"} 📚</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {subject.lessons.map((lesson, idx) => {
                  const isCompleted = progress[subject.grade]?.[subject.title]?.includes(lesson.id);
                  const canTake = !isCompleted || lesson.type === "lecture" || isTeacher;

                  return (
                    <div key={lesson.id} className="premium-card" style={{ padding: "1.2rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: canTake ? "pointer" : "default", opacity: !canTake ? 0.7 : 1 }}
                      onClick={() => canTake ? router.push(`/lessons/${subject.grade}/${subject.title}/${lesson.id}`) : alert("🔒 You have already finished this exam! 🐾")}>
                      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "12px",
                          background: isCompleted ? "#e6ffec" : (lesson.type === "quiz" ? "#fff5f8" : "#f0f7ff"),
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", color: isCompleted ? "var(--accent-green)" : "inherit"
                        }}>{isCompleted ? "✅" : (lesson.type === "quiz" ? "📝" : "📖")}</div>
                        <div>
                          <h4 style={{ margin: 0 }}>{lesson.title}</h4>
                          <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>{lesson.type === "quiz" ? "Exam" : "Reading Material"} {isCompleted && "• Done"}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: isCompleted ? "var(--accent-green)" : "var(--primary-color)", fontWeight: "700" }}>{isCompleted ? "Done ✅" : "Open →"}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STUDENTS TAB (Teacher Only) */}
        {activeTab === "students" && isTeacher && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <h2>Enrolled Students 👥</h2>
              <div style={{ background: "var(--primary-light)", padding: "8px 16px", borderRadius: "50px", fontSize: "0.85rem", fontWeight: "700", color: "var(--primary-color)" }}>
                {students.length} Student{students.length !== 1 ? "s" : ""}
              </div>
            </div>
            
            {/* Invite Code Banner */}
            <div className="premium-card" style={{ background: "linear-gradient(135deg, #f0f7ff, #fff0f6)", padding: "1.5rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <p style={{ fontWeight: "700", fontSize: "0.9rem", marginBottom: "4px" }}>Share this code with your students 📨</p>
                <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>They can enter this in the "Join Class" bar on their dashboard</p>
              </div>
              <div style={{ background: "white", padding: "12px 24px", borderRadius: "16px", border: "2px dashed var(--accent-blue)", fontWeight: "800", fontSize: "1.3rem", letterSpacing: "3px", color: "var(--accent-blue)" }}>
                {subject.code}
              </div>
            </div>

            {students.length === 0 ? (
              <div className="premium-card" style={{ textAlign: "center", padding: "3rem", opacity: 0.5 }}>
                <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎒</p>
                <p>No students have joined yet. Share the invite code above!</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
                {students.map((s, i) => (
                  <div key={s.id || i} className="premium-card" style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "linear-gradient(135deg, var(--primary-light), var(--secondary-light))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1rem", color: "var(--primary-color)" }}>
                        {(s.name || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontWeight: "700", margin: 0 }}>{s.name}</p>
                        <p style={{ fontSize: "0.75rem", opacity: 0.5, margin: 0 }}>{s.grade} • Level {s.level || 1}</p>
                      </div>
                    </div>
                    <button 
                      className="btn-secondary"
                      style={{ padding: "6px 14px", fontSize: "0.75rem", background: "#fff5f5", color: "#e03e3e", border: "1px solid #ffe3e3" }}
                      onClick={() => handleRemoveStudent(s.id)}
                    >Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
