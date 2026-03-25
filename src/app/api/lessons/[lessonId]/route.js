import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST: Check quiz answer server-side
export async function POST(req, { params }) {
  try {
    const { lessonId } = params;
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
    const { lessonId } = params;
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

