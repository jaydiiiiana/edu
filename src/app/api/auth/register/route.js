import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, password, age, grade } = await req.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if user exists
    const checkUser = await fetch(`${supabaseUrl}/rest/v1/users?name=ilike.${name}&select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const users = await checkUser.json();

    if (users && users.length > 0) {
      return NextResponse.json({ error: "Username taken! 😿" }, { status: 400 });
    }

    // Insert new user
    const newUser = {
      name,
      password,
      age: parseInt(age),
      grade,
      exp: 0,
      level: 1,
      created_at: new Date().toISOString()
    };

    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: "POST",
      headers: { 
        "apikey": supabaseKey, 
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify(newUser)
    });
    
    const [insertedUser] = await insertResponse.json();

    return NextResponse.json({ success: true, user: insertedUser });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to register! 😿 (Check Supabase Config)" }, { status: 500 });
  }
}
