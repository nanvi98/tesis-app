import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      nombre,
      apellido,
      email,
      role,
      telefono,
      sexo,
      titulo,
      especialidad,
      cedula,
      status,
      cedula_status,
      approved,
      notas,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getAllUsers error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
