import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    // 1. Fetch user grade if student
    let userGrade = null;
    if (userId && role === 'Student') {
      const { data: userData } = await supabase.from("users").select("grade").eq("id", userId).single();
      if (userData) userGrade = userData.grade;
    }

    // 2. Fetch subjects
    let subjects;
    try {
      let subjQuery = supabase.from("subjects").select("*");
      if (role === 'Teacher' && userId) {
        subjQuery = subjQuery.eq('created_by', userId);
      }
      const { data, error: subjErr } = await subjQuery;
      if (subjErr) {
        // If created_by column doesn't exist, fetch all subjects
        if (subjErr.message?.includes("created_by")) {
          console.warn("'created_by' column not found, fetching all subjects.");
          const { data: allSubj, error: allErr } = await supabase.from("subjects").select("*");
          if (allErr) throw allErr;
          subjects = allSubj;
        } else {
          throw subjErr;
        }
      } else {
        subjects = data;
      }
    } catch (e) {
      throw e;
    }

    // 2. Fetch all lessons and enrollments in parallel
    const [lessonsRes, enrollmentsRes] = await Promise.all([
      supabase.from("lessons").select("*").order("display_order", { ascending: true }),
      supabase.from("subject_enrollments").select("*, users(name)")
    ]);

    if (lessonsRes.error) throw lessonsRes.error;
    if (enrollmentsRes.error) throw enrollmentsRes.error;

    const allLessons = lessonsRes.data || [];
    const allEnrollments = enrollmentsRes.data || [];

    const isStudent = role === 'Student';

    const formatted = subjects.reduce((acc, subj) => {
      // Filter for students: must be enrolled OR subject is public and matches their grade
      const subjectEnrollments = allEnrollments.filter(e => e.subject_id === subj.id);
      const isEnrolled = subjectEnrollments.some(e => e.user_id == userId);
      const isPublicMatch = subj.is_public && subj.grade === userGrade;
      
      if (isStudent && !isEnrolled && !isPublicMatch) return acc;

      if (!acc[subj.grade]) acc[subj.grade] = [];
      acc[subj.grade].push({
        id: subj.id,
        title: subj.title,
        icon: subj.icon,
        is_public: subj.is_public,
        // Students should NOT see the invite code or student list
        code: isStudent ? undefined : subj.code,
        studentsCount: subjectEnrollments.length,
        lessons: allLessons
          .filter(l => l.subject_id === subj.id)
          .map(l => ({
            id: l.id,
            title: l.title,
            type: l.type,
            content: l.content,
            media_url: l.media_url,
            // Students should NOT see quiz answers in the subject list
            questions: isStudent && l.type === 'quiz'
              ? (l.questions || []).map(q => ({ q: q.q, options: q.options }))
              : l.questions,
            order: l.display_order
          })),
        students: isStudent ? undefined : subjectEnrollments.map(e => e.users?.name || "Anonymous")
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

    // Normalize field names: admin page sends { type:"subject", title, icon }
    // but older code used { subjectTitle, subjectIcon, isSubjectOnly }
    const isSubjectOnly = body.type === "subject" || body.isSubjectOnly;
    const grade = body.grade;
    const subjectTitle = body.subjectTitle || body.title;
    const subjectIcon = body.subjectIcon || body.icon || "📚";
    const lessonTitle = body.lessonTitle || body.title;
    const lessonType = body.lessonType || (body.questions ? "quiz" : "lecture");
    const lessonContent = body.lessonContent || body.content;
    const mediaUrl = body.mediaUrl;
    const questions = body.questions;
    const joinSubjectCode = body.joinSubjectCode;
    const userId = body.userId;
    const isPublic = body.isPublic || false;

    // Handle joining a subject via code
    if (joinSubjectCode && userId) {
      const codeToFind = joinSubjectCode.trim().toUpperCase();
      console.log("Looking for subject code:", codeToFind);

      const { data: subject, error: findErr } = await supabase
        .from("subjects")
        .select("id, code")
        .eq("code", codeToFind)
        .single();
      
      console.log("Found subject:", subject, "Error:", findErr);
      if (findErr || !subject) throw new Error("Invalid Code! No subject found with code: " + codeToFind);

      // Check if already enrolled
      const { data: existing } = await supabase
        .from("subject_enrollments")
        .select("user_id")
        .eq("user_id", userId)
        .eq("subject_id", subject.id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, subjectId: subject.id, message: "Already enrolled!" });
      }

      const { error: joinErr } = await supabase
        .from("subject_enrollments")
        .insert([{ user_id: userId, subject_id: subject.id }]);

      if (joinErr && joinErr.code !== '23505') throw joinErr;
      return NextResponse.json({ success: true, subjectId: subject.id });
    }

    // 1. Get or Create Subject (for Teachers)
    // Also filter by created_by so two teachers can have subjects with same name
    let subjectQuery = supabase
      .from("subjects")
      .select("*")
      .eq("grade", grade)
      .eq("title", subjectTitle);
    
    if (userId) {
      subjectQuery = subjectQuery.eq("created_by", userId);
    }
    let { data: subject } = await subjectQuery.maybeSingle();

    if (!subject) {
      const code = "CAT-" + Math.random().toString(36).substr(2, 4).toUpperCase();
      
      // Try with created_by first, fall back without it if the column doesn't exist
      let newSubj, createSubjErr;
      const result1 = await supabase
        .from("subjects")
        .insert([{ grade, title: subjectTitle, icon: subjectIcon, code, created_by: userId, is_public: isPublic }])
        .select()
        .single();
      
      if (result1.error && (result1.error.message?.includes("created_by") || result1.error.message?.includes("is_public"))) {
        // Column doesn't exist yet — try inserting with what we can
        const fields = { grade, title: subjectTitle, icon: subjectIcon, code };
        if (!result1.error.message?.includes("created_by")) fields.created_by = userId;
        if (!result1.error.message?.includes("is_public")) fields.is_public = isPublic;

        const result2 = await supabase
          .from("subjects")
          .insert([fields])
          .select()
          .single();
        if (result2.error) throw result2.error;
        newSubj = result2.data;
      } else if (result1.error) {
        throw result1.error;
      } else {
        newSubj = result1.data;
      }

      subject = newSubj;
    }

    // If only creating a subject (not a lesson), return here
    if (isSubjectOnly) {
       return NextResponse.json({ success: true, code: subject.code, subjectCode: subject.code });
    }

    // 2. Create Lesson
    const { data: newLesson, error: createLessonErr } = await supabase
      .from("lessons")
      .insert([{
        subject_id: subject.id,
        title: lessonTitle,
        type: lessonType,
        content: lessonContent,
        media_url: mediaUrl,
        questions: questions,
        display_order: 0
      }])
      .select()
      .single();

    if (createLessonErr) throw createLessonErr;

    return NextResponse.json({ success: true, lessonId: newLesson.id, code: subject.code, subjectCode: subject.code });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
