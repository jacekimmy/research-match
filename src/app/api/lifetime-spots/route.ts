import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "lifetime_spots_claimed")
      .single();

    const claimed = data && !error ? parseInt(data.value, 10) : 0;
    return NextResponse.json({ remaining: Math.max(0, 200 - claimed) });
  } catch {
    return NextResponse.json({ remaining: 200 });
  }
}
