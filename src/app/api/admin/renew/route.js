
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { userId, targetUserId, months } = await req.json();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Verify user is Creator
    const { data: creator } = await supabase.from("users").select("role").eq("id", userId).single();
    if (!creator || creator.role !== 'Creator') {
        return NextResponse.json({ error: "Forbidden: You are not a Creator." }, { status: 403 });
    }

    // 2. Fetch the target Headmaster
    const { data: headmaster } = await supabase.from("users").select("*").eq("id", targetUserId).single();
    if (!headmaster) return NextResponse.json({ error: "Headmaster not found." }, { status: 404 });

    // 3. Calculate new expiry
    // If already expired, start from TODAY. If NOT expired, extend from existing expiry date.
    let currentExpiry = headmaster.subscription_expires_at ? new Date(headmaster.subscription_expires_at) : new Date();
    if (new Date() > currentExpiry) currentExpiry = new Date();

    const newExpiry = new Date(currentExpiry);
    newExpiry.setMonth(newExpiry.getMonth() + (months || 1));

    // 4. Update the Headmaster
    const { error: updateError } = await supabase
      .from("users")
      .update({ subscription_expires_at: newExpiry.toISOString() })
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newExpiry: newExpiry.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
