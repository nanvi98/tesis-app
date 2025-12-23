import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const { email, password, nombre, apellido } = await request.json();

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) return NextResponse.json({ error: error.message });

  await supabaseAdmin.from("profiles").insert({
    id: data.user.id,
    email,
    nombre,
    apellido,
    role: "admin",
    status: "activo",
  });

  return NextResponse.json({ success: true });
}
