import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { withinRateLimit, clientIp, isPlausibleEmail } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    if (!withinRateLimit(`waitlist:${clientIp(req)}`, 5)) {
      return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
    }

    const { email, tier } = await req.json();
    if (!isPlausibleEmail(email) || !tier || typeof tier !== "string" || tier.length > 50) {
      return NextResponse.json({ error: "A valid email and tier are required" }, { status: 400 });
    }

    const { error } = await supabase.from("waitlist").insert({
      email: email.trim().toLowerCase(),
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
