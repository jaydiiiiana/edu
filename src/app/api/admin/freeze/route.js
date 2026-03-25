
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { userId, targetUserId } = await req.json();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Verify user is Creator
    const { data: creator } = await supabase.from("users").select("role").eq("id", userId).single();
    if (!creator || creator.role !== 'Creator') {
        return NextResponse.json({ error: "Forbidden: You are not a Creator." }, { status: 403 });
    }

    // 2. Freeze the Headmaster
    // Set expiry to 1 second ago to instantly freeze the account
    const pastDate = new Date();
    pastDate.setSeconds(pastDate.getSeconds() - 1);

    const { error: updateError } = await supabase
      .from("users")
      .update({ subscription_expires_at: pastDate.toISOString() })
      .eq("id", targetUserId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, newExpiry: pastDate.toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
