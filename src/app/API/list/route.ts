import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  const { data } = await supabaseAdmin.from("profiles")
    .select("*")
    .eq("role", "admin");

  return NextResponse.json({ data });
}
