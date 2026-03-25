
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // 1. Delete Expired Codes (Lazy Cleanup)
    await supabase
      .from("registration_codes")
      .delete()
      .lt("created_at", oneDayAgo.toISOString())
      .eq("is_used", false);

    // 2. Fetch Active Codes
    const { data: invites, error } = await supabase
      .from("registration_codes")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(invites);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { userId, roleToGrant, durationMonths } = await req.json();
    
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify user role matches what they are trying to grant
    const { data: user } = await supabase.from("users").select("role").eq("id", userId).single();
    if (!user) throw new Error("User not found");

    const isAuthorized = 
        (user.role === 'Creator' && roleToGrant === 'Headmaster') ||
        (user.role === 'Headmaster' && roleToGrant === 'Teacher') ||
        (user.role === 'Teacher' && roleToGrant === 'Student');

    // Also allow Headmaster to create Student codes if they want
    const isHeadmasterGrantingStudent = user.role === 'Headmaster' && roleToGrant === 'Student';

    if (!isAuthorized && !isHeadmasterGrantingStudent) {
        return NextResponse.json({ error: "Forbidden: You cannot grant this role." }, { status: 403 });
    }

    const newCode = "CODE-" + Math.random().toString(36).substr(2, 6).toUpperCase();

    const { data, error } = await supabase
      .from("registration_codes")
      .insert([{
        code: newCode,
        role_to_grant: roleToGrant,
        created_by: userId,
        duration_months: durationMonths || 1, // Default to 1 month
        is_used: false
      }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
