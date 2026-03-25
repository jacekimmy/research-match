import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = getSupabase();
  const sort = req.nextUrl.searchParams.get("sort") || "upvotes";
  const order = sort === "newest" ? "created_at" : "upvotes";

  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order(order, { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const { content, category, author_name } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Feedback content is required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feedback")
    .insert({
      content: content.trim(),
      category: category || "General Feedback",
      author_name: author_name?.trim() || "Anonymous",
      upvotes: 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const supabase = getSupabase();
  const { id } = await req.json();

  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const { error } = await supabase.rpc("increment_upvotes", { row_id: id });

  if (error) {
    const { data: current } = await supabase.from("feedback").select("upvotes").eq("id", id).single();
    if (current) {
      await supabase.from("feedback").update({ upvotes: (current.upvotes || 0) + 1 }).eq("id", id);
    }
  }

  return NextResponse.json({ success: true });
}
