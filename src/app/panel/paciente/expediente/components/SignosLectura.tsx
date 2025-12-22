'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function SignosLectura({ pacienteId }: { pacienteId: string }) {

  const [signos, setSignos] = useState<any>(null);

  async function load() {
    const { data } = await supabase
      .from("consultas")
      .select("*")
      .eq("paciente_id", pacienteId)
      .order("fecha", { ascending: false })
      .limit(1);

    if (data?.length) {
      setSignos(data[0]);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (!signos) {
    return <p className="text-sm text-slate-500">No hay signos registrados.</p>;
  }

  return (
    <div className="space-y-4 text-sm text-slate-700 bg-white p-4 rounded-xl border shadow">

      <p><b>Presión arterial:</b> {signos.presionarterial ?? "No registrado"}</p>
      <p><b>Frecuencia cardíaca:</b> {signos.frecuenciacardiaca ?? "No registrado"}</p>
      <p><b>Frecuencia respiratoria:</b> {signos.frecuenciarespiratoria ?? "No registrado"}</p>
      <p><b>Temperatura:</b> {signos.temperatura ?? "No registrado"}</p>
      <p><b>Saturación:</b> {signos.saturacion ?? "No registrado"}</p>
      <p><b>Escala del dolor:</b> {signos.escaladolor ?? "No registrado"}</p>

      {signos.notassignos && (
        <p><b>Notas:</b> {signos.notassignos}</p>
      )}

    </div>
  );
}
