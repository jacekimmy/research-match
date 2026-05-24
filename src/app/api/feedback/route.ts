import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAIL = "thomasjacekim@gmail.com";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function authenticatedAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return false;

  return data.user?.email === ADMIN_EMAIL;
}

export async function GET(req: NextRequest) {
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

export async function PUT(req: NextRequest) {
  if (!(await authenticatedAdmin(req))) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id, resolved } = await req.json();

  if (!id) return NextResponse.json({ error: "ID required." }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("feedback")
    .update({ resolved: !!resolved })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
