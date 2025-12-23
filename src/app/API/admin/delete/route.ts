import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

    // 1) borrar de auth
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (authErr) {
      return NextResponse.json(
        { error: "Error en Auth: " + authErr.message },
        { status: 400 }
      );
    }

    // 2) borrar de profiles
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", id);

    if (profileErr) {
      return NextResponse.json(
        { error: "Error en profiles: " + profileErr.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Error inesperado" },
      { status: 500 }
    );
  }
}
