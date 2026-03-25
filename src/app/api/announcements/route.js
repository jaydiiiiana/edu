import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade");

    let query = supabase.from("announcements").select("*, users(name)").order("created_at", { ascending: false });
    
    // Fetch either specific grade or all (null)
    if (grade) {
      query = query.or(`target_grade.is.null,target_grade.eq."${grade}"`);
    }

    const { data, error } = await query;
    if (error) {
      // If table doesn't exist, return empty array instead of failing
      if (error.code === 'PGSLE') return NextResponse.json([]);
      throw error;
    }
    
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { content, targetGrade, authorId } = await req.json();

    // Verify Headmaster
    const { data: user } = await supabase.from("users").select("role").eq("id", authorId).single();
    if (!user || user.role !== 'Headmaster') {
      return NextResponse.json({ error: "Only the Headmaster can post announcements!" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("announcements")
      .insert([{ content, target_grade: targetGrade || null, author_id: authorId }])
      .select()
      .single();

    if (error) {
      // If table doesn't exist, provide SQL
      if (error.code === '42P01') {
        return NextResponse.json({ error: "Table 'announcements' not found! Please run the SQL migration." }, { status: 500 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
