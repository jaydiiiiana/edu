import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { name, password, age, grade, verificationCode } = await req.json();
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

    // 1. Verify Code and Determine Role
    let role = "Student"; // Default if not using strict codes
    let creatorId = null;
    let expirationDate = null;

    if (verificationCode) {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const codeRes = await fetch(`${supabaseUrl}/rest/v1/registration_codes?code=eq.${verificationCode}&is_used=eq.false&created_at=gte.${oneDayAgo.toISOString()}&select=*`, {
        headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
      });
      const [invite] = await codeRes.json();
      
      if (!invite) {
        return NextResponse.json({ error: "Invalid or expired verification code! 😿" }, { status: 400 });
      }
      
      role = invite.role_to_grant;
      creatorId = invite.created_by; // This links the user to their creator/school

      // Calculate expiration date
      if (invite.duration_months && invite.duration_months > 0) {
        const now = new Date();
        now.setMonth(now.getMonth() + invite.duration_months);
        expirationDate = now.toISOString();
      }

      // 2. Mark code as used
      await fetch(`${supabaseUrl}/rest/v1/registration_codes?id=eq.${invite.id}`, {
        method: "PATCH",
        headers: { 
          "apikey": supabaseKey, 
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ is_used: true })
      });

      // 3. Automatically generate a replacement code for the same role/creator
      const newCodeStr = "CODE-" + Math.random().toString(36).substr(2, 6).toUpperCase();
      await fetch(`${supabaseUrl}/rest/v1/registration_codes`, {
        method: "POST",
        headers: { 
          "apikey": supabaseKey, 
          "Authorization": `Bearer ${supabaseKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          code: newCodeStr, 
          role_to_grant: invite.role_to_grant, 
          created_by: invite.created_by, 
          is_used: false 
        })
      });
    } else {
      // In strict mode, we could reject registrations without a code
      // return NextResponse.json({ error: "Verification code required! 🎓" }, { status: 400 });
    }

    // Insert new user
    const newUser = {
      name,
      password,
      age: parseInt(age) || 0,
      grade,
      role: role,
      invited_by: creatorId, // Keep track of who invited them
      subscription_expires_at: expirationDate, // Subscription control
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
