import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const consulta = await req.json();

    if (!consulta.pacienteId || !consulta.medicoId) {
      return NextResponse.json(
        { ok: false, error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("consultas")
      .insert([
        {
          paciente_id: consulta.pacienteId,
          medico_id: consulta.medicoId,
          notas: consulta.notas || "",
          diagnostico: consulta.diagnostico || "",
          estudios: consulta.estudios || null,
          radiografias: consulta.radiografias || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { ok: false, error: "Error procesando la petición" },
      { status: 400 }
    );
  }
}
