export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const decodeKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/users?select=id,level&role=eq.Student`, {
      method: "GET",
      headers: {
        "apikey": decodeKey,
        "Authorization": `Bearer ${decodeKey}`,
      },
    });

    const data = await response.json();
    const total = Array.isArray(data) ? data.length : 0;
    
    // Simple logic: If level > 2, they "finished" their first grade goals
    const graduated = Array.isArray(data) ? data.filter(u => u.level >= 2).length : 0;
    
    const successRate = total > 0 ? Math.round((graduated / total) * 100) : 0;

    return Response.json({ total, graduated, successRate });
  } catch (error) {
    return Response.json({ total: 0, graduated: 0, successRate: 0 });
  }
}
