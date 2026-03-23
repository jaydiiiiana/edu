import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function DELETE(req, { params }) {
  try {
    const { subjectId } = params;

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
