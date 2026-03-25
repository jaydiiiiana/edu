import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const response = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${id}&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const users = await response.json();
    return NextResponse.json(users[0] || null);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { role, requesterId } = body;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // --- Authorization checks ---
    if (!requesterId) {
      return NextResponse.json({ error: "Unauthorized: No requester ID provided." }, { status: 401 });
    }

    // Prevent changing own role
    if (requesterId === id) {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 403 });
    }

    // Prevent promoting to Headmaster
    if (role === "Headmaster") {
      return NextResponse.json({ error: "Cannot promote users to Headmaster via this endpoint." }, { status: 403 });
    }

    // Verify requester is a Headmaster
    const requesterRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${requesterId}&select=role`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const [requester] = await requesterRes.json();
    if (!requester || requester.role !== "Headmaster") {
      return NextResponse.json({ error: "Only the Headmaster can change user roles." }, { status: 403 });
    }

    // Verify target user is NOT a Headmaster
    const targetRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${id}&select=role`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const [targetUser] = await targetRes.json();
    if (targetUser && targetUser.role === "Headmaster") {
      return NextResponse.json({ error: "Cannot change the role of another Headmaster." }, { status: 403 });
    }

    // --- Perform the update ---
    const response = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${id}`, {
      method: "PATCH",
      headers: { 
        "apikey": supabaseKey, 
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ role })
    });
    
    const [updatedUser] = await response.json();
    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update user! 😿" }, { status: 500 });
  }
}
