import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, tier } = await req.json();
    if (!email || !tier) {
      return NextResponse.json({ error: "Email and tier required" }, { status: 400 });
    }

    const { error } = await supabase.from("waitlist").insert({
      email,
      tier,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("waitlist error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("waitlist error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
