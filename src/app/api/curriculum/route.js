import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    // 1. Fetch subjects
    let subjQuery = supabase.from("subjects").select("*");
    if (role === 'Teacher' && userId) {
      subjQuery = subjQuery.eq('created_by', userId);
    }
    const { data: subjects, error: subjErr } = await subjQuery;
    if (subjErr) throw subjErr;

    // 2. Fetch all lessons and enrollments in parallel
    const [lessonsRes, enrollmentsRes] = await Promise.all([
      supabase.from("lessons").select("*").order("display_order", { ascending: true }),
      supabase.from("subject_enrollments").select("*, users(name)")
    ]);

    if (lessonsRes.error) throw lessonsRes.error;
    if (enrollmentsRes.error) throw enrollmentsRes.error;

    const allLessons = lessonsRes.data || [];
    const allEnrollments = enrollmentsRes.data || [];

    const formatted = subjects.reduce((acc, subj) => {
      // Filter by enrollment for students
      const subjectEnrollments = allEnrollments.filter(e => e.subject_id === subj.id);
      const isEnrolled = subjectEnrollments.some(e => e.user_id == userId);
      
      if (role === 'Student' && !isEnrolled) return acc;

      if (!acc[subj.grade]) acc[subj.grade] = [];
      acc[subj.grade].push({
        id: subj.id,
        title: subj.title,
        icon: subj.icon,
        code: subj.code,
        lessons: allLessons
          .filter(l => l.subject_id === subj.id)
          .map(l => ({
            id: l.id,
            title: l.title,
            type: l.type,
            content: l.content,
            questions: l.questions,
            order: l.display_order
          })),
        students: subjectEnrollments.map(e => e.users?.name || "Anonymous")
      });
      return acc;
    }, {});

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { grade, subjectTitle, subjectIcon, lessonTitle, lessonType, lessonContent, questions, isSubjectOnly, joinSubjectCode, userId } = body;

    // Handle joining a subject via code
    if (joinSubjectCode && userId) {
      const { data: subject, error: findErr } = await supabase
        .from("subjects")
        .select("id")
        .eq("code", joinSubjectCode.toUpperCase())
        .single();
      
      if (findErr || !subject) throw new Error("Invalid Code!");

      const { error: joinErr } = await supabase
        .from("subject_enrollments")
        .insert([{ user_id: userId, subject_id: subject.id }]);

      if (joinErr && joinErr.code !== '23505') throw joinErr; // Ignore duplicate joins
      return NextResponse.json({ success: true, subjectId: subject.id });
    }

    // 1. Get or Create Subject (for Teachers)
    let { data: subject, error: getSubjErr } = await supabase
      .from("subjects")
      .select("*")
      .eq("grade", grade)
      .eq("title", subjectTitle)
      .single();

    if (!subject) {
      const code = "CAT-" + Math.random().toString(36).substr(2, 4).toUpperCase();
      const { data: newSubj, error: createSubjErr } = await supabase
        .from("subjects")
        .insert([{ grade, title: subjectTitle, icon: subjectIcon || "📄", code, created_by: userId }])
        .select()
        .single();
      if (createSubjErr) throw createSubjErr;
      subject = newSubj;
    }

    if (isSubjectOnly) {
       return NextResponse.json({ success: true, subjectCode: subject.code });
    }

    // 2. Create Lesson
    const { data: newLesson, error: createLessonErr } = await supabase
      .from("lessons")
      .insert([{
        subject_id: subject.id,
        title: lessonTitle,
        type: lessonType,
        content: lessonContent,
        questions: questions,
        display_order: 0
      }])
      .select()
      .single();

    if (createLessonErr) throw createLessonErr;

    return NextResponse.json({ success: true, lessonId: newLesson.id, subjectCode: subject.code });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
