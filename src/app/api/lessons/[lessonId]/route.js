import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST: Check quiz answer server-side
export async function POST(req, { params }) {
  try {
    const { lessonId } = await params;
    const { questionIndex, answer } = await req.json();

    const { data: lesson, error } = await supabase
      .from("lessons")
      .select("questions")
      .eq("id", lessonId)
      .single();

    if (error || !lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const questions = lesson.questions || [];
    if (questionIndex < 0 || questionIndex >= questions.length) {
      return NextResponse.json({ error: "Invalid question index" }, { status: 400 });
    }

    const correctAnswer = questions[questionIndex].a;
    const isCorrect = answer === correctAnswer;

    return NextResponse.json({ 
      correct: isCorrect, 
      correctAnswer: correctAnswer 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { lessonId } = await params;
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get("requesterId");

    if (!requesterId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch requester role
    const { data: requester } = await supabase.from("users").select("role").eq("id", requesterId).single();
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch lesson and verify subject ownership
    const { data: lesson } = await supabase.from("lessons").select("subject_id").eq("id", lessonId).single();
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const { data: subject } = await supabase.from("subjects").select("created_by").eq("id", lesson.subject_id).single();
    
    // Authorize: Headmaster OR Owner
    const isAuthorized = requester.role === "Headmaster" || (subject && subject.created_by == requesterId);
    if (!isAuthorized) return NextResponse.json({ error: "Forbidden!" }, { status: 403 });

    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


