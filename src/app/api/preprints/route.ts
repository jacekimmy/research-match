import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Pre-Print Edge has been removed." }, { status: 410 });
}
