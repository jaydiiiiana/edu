import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function PATCH(req, { params }) {
  try {
    const { subjectId } = await params;
    const { isPublic, userId } = await req.json();

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: requester } = await supabase.from("users").select("role").eq("id", userId).single();
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { data: subject } = await supabase.from("subjects").select("created_by").eq("id", subjectId).single();
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    const isAuthorized = requester.role === "Headmaster" || (subject.created_by && subject.created_by == userId);
    if (!isAuthorized) return NextResponse.json({ error: "Forbidden!" }, { status: 403 });

    const { error } = await supabase.from("subjects").update({ is_public: isPublic }).eq("id", subjectId);
    if (error) throw error;

    return NextResponse.json({ success: true, isPublic });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { subjectId } = await params;
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get("requesterId");

    if (!requesterId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch requester role
    const { data: requester } = await supabase.from("users").select("role").eq("id", requesterId).single();
    if (!requester) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch subject owner
    const { data: subject } = await supabase.from("subjects").select("created_by").eq("id", subjectId).single();
    if (!subject) return NextResponse.json({ error: "Subject not found" }, { status: 404 });

    // Autorized if Headmaster OR Owner
    const isAuthorized = requester.role === "Headmaster" || (subject.created_by && subject.created_by == requesterId);
    if (!isAuthorized) return NextResponse.json({ error: "Forbidden! only Headmaster or the owner can delete this." }, { status: 403 });

    // Delete enrollments first
    await supabase.from("subject_enrollments").delete().eq("subject_id", subjectId);
    // Delete lessons
    await supabase.from("lessons").delete().eq("subject_id", subjectId);
    // Delete the subject
    const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

