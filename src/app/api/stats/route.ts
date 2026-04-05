import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 60; // cache for 60 seconds

export async function GET() {
  try {
    const { count } = await supabaseAdmin
      .from("search_logs")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({ searches: count ?? 0 });
  } catch {
    return NextResponse.json({ searches: 0 });
  }
}
