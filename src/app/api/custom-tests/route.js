import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fetch custom tests from Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/custom_tests?select=*`, {
      headers: { "apikey": supabaseKey, "Authorization": `Bearer ${supabaseKey}` }
    });
    const customTests = await response.json();

    // Reconstruct data into grade keys for simplicity
    const finalData = {};
    customTests.forEach((t) => {
      if (!finalData[t.grade]) finalData[t.grade] = [];
      finalData[t.grade].push(t.test_data);
    });

    return NextResponse.json(finalData);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch custom tests! 😿" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { grade, test } = await req.json();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Insert new custom test
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/custom_tests`, {
      method: "POST",
      headers: { 
        "apikey": supabaseKey, 
        "Authorization": `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({ grade, test_data: test, created_at: new Date().toISOString() })
    });
    
    const [insertData] = await insertResponse.json();

    return NextResponse.json({ success: true, test: insertData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save custom test! 😿" }, { status: 500 });
  }
}
