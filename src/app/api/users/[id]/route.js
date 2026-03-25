import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { role, grade, section, requesterId } = body;

    // --- Authorization checks ---
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized: No requester ID provided." }, { status: 401 });
    }

    // Verify requester is a Headmaster
    const { data: requester, error: reqError } = await supabase
      .from("users")
      .select("role")
      .eq("id", requesterId)
      .single();

    if (reqError || !requester || requester.role !== "Headmaster") {
      return NextResponse.json({ error: "Only the Headmaster can modify user data." }, { status: 403 });
    }

    // Protection: Cannot change self role or target another headmaster
    if (role && requesterId === id) {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 403 });
    }
    if (role === "Headmaster") {
      return NextResponse.json({ error: "Cannot promote users to Headmaster." }, { status: 403 });
    }

    // Verify target user is NOT another Headmaster (to protect the owner)
    const { data: targetUser } = await supabase.from("users").select("role").eq("id", id).single();
    if (role && targetUser?.role === "Headmaster") {
       return NextResponse.json({ error: "Cannot change the role of another Headmaster." }, { status: 403 });
    }

    // --- Perform the update ---
    const updateData = {};
    if (role) updateData.role = role;
    if (grade) updateData.grade = grade;
    if (section) updateData.section = section;

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: `Database error: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("PATCH /api/users/[id] error:", error);
    return NextResponse.json({ error: "Failed to update user: " + error.message }, { status: 500 });
  }
}

