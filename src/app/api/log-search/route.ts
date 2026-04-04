import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { research_interest, university, is_authenticated } = await req.json();
    await supabaseAdmin.from("search_logs").insert({
      research_interest: research_interest ?? null,
      university: university ?? null,
      is_authenticated: is_authenticated ?? false,
      created_at: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true });
  } catch {
    // Silently fail — logging should never break the user experience
    return NextResponse.json({ ok: false });
  }
}
