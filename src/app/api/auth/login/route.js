import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, password } = await req.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fetch user from Supabase using REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/users?name=ilike.${name}&password=eq.${password}&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const users = await response.json();

    if (users && users.length > 0) {
      // Return user without password (security)
      const { password: _, ...userSafe } = users[0];
      return NextResponse.json({ success: true, user: userSafe });
    }

    return NextResponse.json({ error: "Wrong name or paw-phrase! 😿" }, { status: 401 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to login! 😿 (Check Supabase Config)" }, { status: 500 });
  }
}
