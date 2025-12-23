import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { id, approved, cedula_status, status } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // ⭐ IMPORTANTE
  );

  const { error } = await supabase
    .from("profiles")
    .update({
      approved,
      cedula_status,
      status,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
