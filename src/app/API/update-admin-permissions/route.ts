// /app/api/update-permissions/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { id, permissions } = await req.json();

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ permissions })
      .eq("id", id);

    if (error) {
      console.error(error);
      return NextResponse.json({ success: false, error });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: e });
  }
}
