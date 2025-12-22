'use client';

export const dynamic = "force-dynamic";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useParams, useRouter } from 'next/navigation';
import { FilePlus2, ImagePlus } from 'lucide-react';
import { useMedico } from '@/context/MedicoContext';

export default function NuevaConsultaPage() {

  const router = useRouter();
  const { pacienteId } = useParams();
  const { medico } = useMedico();

  const [motivo, setMotivo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [notas, setNotas] = useState('');
  const [requiereEstudio, setRequiereEstudio] = useState(false);

  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  if (!medico) return (
    <p className="text-center mt-10 text-lg">Cargando datos del médico...</p>
  );

  async function guardarConsulta(e: any) {
    e.preventDefault();
    setLoading(true);

    const fecha = new Date().toISOString();

    // 1) Creamos la consulta
    const { data, error } = await supabase
      .from('consultas')
      .insert({
        paciente_id: String(pacienteId),
        motivo,
        diagnostico,
        notas,
        fecha,
        medico_nombre: medico.nombre,
        medico_correo: medico.correo,
      })
      .select()
      .single();

    if (error) {
      setLoading(false);
      alert('❌ Error al registrar la consulta');
      return;
    }

    const consultaId = data.id;

    // 2) Si hay imagen, subirla
    if (file) {
      const filePath = `${pacienteId}/${Date.now()}-${file.name}`;

      const { error: upErr } = await supabase.storage
        .from('radiografias')
        .upload(filePath, file);

      if (!upErr) {
        const url =
          supabase.storage.from('radiografias').getPublicUrl(filePath).data.publicUrl;

        await supabase.from('imagenes').insert({
          paciente_id: pacienteId,
          consulta_id: consultaId,
          url,
        });
      }
    }

    // ⭐ 3) Actualizamos el estado clínico del paciente
    await supabase
      .from('medico_pacientes')
      .update({ requiere_estudio: requiereEstudio })
      .eq('paciente_id', pacienteId);

    setLoading(false);

    alert('Consulta registrada con éxito ✔');
    router.push(`/panel/medico/expediente/${pacienteId}`);
  }

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-xl rounded-3xl border">

      {/* HEADER */}
      <div className="flex items-center gap-3 text-slate-800 mb-6">
        <FilePlus2 className="text-cyan-600" size={32} />
        <h1 className="text-2xl font-bold">
          Registrar nueva consulta
        </h1>
      </div>

      <form onSubmit={guardarConsulta} className="space-y-6">

        <label className="flex flex-col">
          <span className="font-medium">Motivo de consulta</span>
          <textarea
            className="border p-3 rounded-xl mt-1"
            rows={3}
            required
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </label>

        <label className="flex flex-col">
          <span className="font-medium">Diagnóstico</span>
          <textarea
            className="border p-3 rounded-xl mt-1"
            rows={3}
            required
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
          />
        </label>

        <label className="flex flex-col">
          <span className="font-medium">Notas y observaciones</span>
          <textarea
            className="border p-3 rounded-xl mt-1"
            rows={4}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </label>

        {/* ⭐ CAMPO REQUIERE ESTUDIO */}
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={requiereEstudio}
            onChange={(e) => setRequiereEstudio(e.target.checked)}
          />
          Requiere estudio
        </label>

        {/* UPLOAD DE RADIOGRAFIA */}
        <div className="p-4 rounded-xl bg-slate-50 border text-sm space-y-2">
          <span className="font-medium flex items-center gap-2">
            <ImagePlus size={18} /> Radiografía
          </span>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm"
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-600 to-emerald-600
           text-white py-3 rounded-xl font-semibold shadow-lg hover:opacity-90
           transition"
        >
          {loading ? 'Guardando...' : 'Guardar consulta'}
        </button>

        <button
          type="button"
          onClick={() => router.back()}
          className="w-full mt-2 bg-gray-500 text-white py-3 rounded-xl font-semibold"
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
