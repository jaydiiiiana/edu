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
    const { userId, type, title, content, mediaUrl, questions } = body;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Auth check: requester must be Headmaster OR Owner of the subject
    const { data: requester } = await supabase.from("users").select("role").eq("id", userId).single();
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data: subject } = await supabase.from("subjects").select("created_by").eq("id", subjectId).single();
    
    const isAuthorized = requester.role === "Headmaster" || (subject && subject.created_by == userId);
    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden! only Headmaster or the owner can add tasks here." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("lessons")
      .insert([{
        title,
        subject_id: subjectId,
        type: type === "quiz" ? "quiz" : "lecture",
        content: content || null,
        media_url: mediaUrl || null,
        questions: questions || null
      }])
      .select();

    if (error) throw error;

    return NextResponse.json(data[0]);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
