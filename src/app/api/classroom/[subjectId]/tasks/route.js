import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req, { params }) {
  try {
    const { subjectId } = params;
    const body = await req.json();
    const { userId, type, title, content, questions } = body;

    const { data, error } = await supabase
      .from("lessons")
      .insert([{
        title,
        subject_id: parseInt(subjectId),
        type: type === "quiz" ? "quiz" : "lecture",
        content: content || null,
        questions: questions || null
      }])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
