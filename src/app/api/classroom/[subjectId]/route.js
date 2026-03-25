import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req, { params }) {
  try {
    const { subjectId } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    const uId = isNaN(userId) ? userId : parseInt(userId);
    const sId = isNaN(subjectId) ? subjectId : parseInt(subjectId);

    // Fetch user role
    let userRole = "Student";
    if (uId) {
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", uId)
        .single();
      if (userData) userRole = userData.role || "Student";
    }

    const isTeacher = userRole === "Teacher" || userRole === "Headmaster";

    // Fetch the subject
    const { data: subject, error: subjErr } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", sId)
      .single();

    if (subjErr) {
      console.error("Subject fetch error:", subjErr);
      return NextResponse.json({ error: `Subject not found (ID: ${sId})! 😿` }, { status: 404 });
    }

    // Check access: teacher must own the subject, student must be enrolled
    if (isTeacher) {
      // Teachers can only manage their own subjects (Headmaster can see all)
      if (userRole === "Teacher" && subject.created_by && subject.created_by != uId) {
        return NextResponse.json({ error: "You don't own this subject! 😿" }, { status: 403 });
      }
    } else {
      // Students must be enrolled
      const { data: enrollment, error: enrollErr } = await supabase
        .from("subject_enrollments")
        .select("user_id")
        .eq("user_id", uId)
        .eq("subject_id", sId)
        .maybeSingle();

      if (enrollErr || !enrollment) {
        return NextResponse.json({ error: "You are not enrolled in this class! 😿 Please join using the invite code." }, { status: 403 });
      }
    }

    // Fetch lessons
    const { data: lessons } = await supabase
      .from("lessons")
      .select("*")
      .eq("subject_id", sId)
      .order("display_order", { ascending: true });

    // For students: strip quiz answers so they can't cheat
    const safeLessons = (lessons || []).map(l => {
      if (!isTeacher && l.type === "quiz" && l.questions) {
        return {
          ...l,
          questions: l.questions.map(q => ({ q: q.q, options: q.options }))
        };
      }
      return l;
    });

    // Fetch enrolled students with user details
    const { data: enrollments } = await supabase
      .from("subject_enrollments")
      .select("user_id")
      .eq("subject_id", subjectId);

    const studentIds = (enrollments || []).map(e => e.user_id);
    let students = [];
    if (studentIds.length > 0) {
      const { data: studentData } = await supabase
        .from("users")
        .select("id, name, grade, level")
        .in("id", studentIds);
      students = studentData || [];
    }

    return NextResponse.json({
      subject: {
        ...subject,
        // Students should NOT see invite code
        code: isTeacher ? subject.code : undefined,
        lessons: safeLessons
      },
      // Students should NOT see the student list
      students: isTeacher ? students : undefined
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
