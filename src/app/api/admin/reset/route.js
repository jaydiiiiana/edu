
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify user is a Creator
    const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
    if (!user || user.role !== 'Creator') {
        return NextResponse.json({ error: "Forbidden: Only Creators can reset the universe. 🐾" }, { status: 403 });
    }

    console.log("Starting System Reset triggered by:", userId);

    // Order matters for foreign key constraints!
    // 1. Delete progress and enrollments
    await supabase.from("subject_enrollments").delete().neq("id", 0); // Delete all
    await supabase.from("registration_codes").delete().neq("id", 0); // Delete all
    
    // 2. Delete lessons
    await supabase.from("lessons").delete().neq("id", 0); 
    
    // 3. Delete subjects
    await supabase.from("subjects").delete().neq("id", 0);

    // 4. Delete announcements
    await supabase.from("announcements").delete().neq("id", 0);
    
    // 5. Delete all users EXCEPT Creators
    const { error: userError } = await supabase
      .from("users")
      .delete()
      .neq("role", "Creator");

    if (userError) throw userError;

    return NextResponse.json({ success: true, message: "System Reset Complete! 🌌✅ All schools, students, and lessons cleared." });
  } catch (error) {
    console.error("Reset Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
