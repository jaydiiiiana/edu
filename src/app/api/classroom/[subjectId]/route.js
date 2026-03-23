import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req, { params }) {
  try {
    const { subjectId } = params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // Fetch the subject
    const { data: subject, error: subjErr } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();

    if (subjErr) throw new Error("Subject not found! 😿");

    // Fetch lessons
    const { data: lessons } = await supabase
      .from("lessons")
      .select("*")
      .eq("subject_id", subjectId)
      .order("display_order", { ascending: true });

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
        lessons: lessons || []
      },
      students
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
