'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Calendar } from 'lucide-react';

export default function EditarCitaPage() {
  const router = useRouter();
  const params = useParams<{ citasId: string }>();
  const citaId = params.citasId;

  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [estado, setEstado] =
    useState<'pendiente' | 'confirmada' | 'cancelada'>('pendiente');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ─────────────────────────────
  // Cargar datos de la cita
  // ─────────────────────────────
  useEffect(() => {
    async function loadCita() {
      setError('');
      setLoading(true);

      const { data, error } = await supabase
        .from('citas')
        .select('id, fecha, motivo, estado')
        .eq('id', citaId)
        .single();

      if (error || !data) {
        console.error('Error cargando cita:', error);
        setError('No se pudo cargar la cita.');
        setLoading(false);
        return;
      }

      const fechaString = data.fecha ? String(data.fecha) : '';

      setFecha(fechaString.slice(0, 16));
      setMotivo(data.motivo ?? '');
      setEstado((data.estado as any) ?? 'pendiente');
      setLoading(false);
    }

    if (citaId) {
      void loadCita();
    }
  }, [citaId]);

  // ─────────────────────────────
  // Guardar cambios
  // ─────────────────────────────
  const handleGuardar = async () => {
    if (!fecha) {
      setError('Selecciona fecha y hora.');
      return;
    }

    setSaving(true);
    setError('');

    // 1) Actualizar cita
    const { error } = await supabase
      .from('citas')
      .update({
        fecha,
        motivo,
        estado,
      })
      .eq('id', citaId);

    if (error) {
      console.error('Error actualizando cita:', error);
      setError('No se pudo guardar la cita.');
      setSaving(false);
      return;
    }

    // 2) Registrar historial
    await supabase.from('citas_historial').insert({
      cita_id: citaId,
      estado: 'reprogramada',
      descripcion: `Cita modificada a ${fecha}`,
    });

    setSaving(false);
    router.push('/panel/medico/citas');
    router.refresh(); // fuerza actualización
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto mt-6">
        <p>Cargando cita…</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto mt-6 bg-white shadow-2xl rounded-2xl p-6 border border-slate-200">
      <h1 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
        Editar cita
      </h1>

      <div className="mb-4">
        <label className="text-sm font-medium">Fecha y hora:</label>
        <div className="flex items-center gap-2 border rounded-xl px-3 py-2 mt-1">
          <Calendar size={18} className="text-slate-400" />
          <input
            type="datetime-local"
            className="outline-none w-full"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-sm font-medium">Motivo:</label>
        <textarea
          className="w-full border rounded-xl px-3 py-2 mt-1 outline-none"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </div>

      <div className="mb-6">
        <label className="text-sm font-medium">Estado de la cita:</label>
        <select
          className="w-full border rounded-xl px-3 py-2 mt-1 text-sm outline-none"
          value={estado}
          onChange={(e) => setEstado(e.target.value as any)}
        >
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      {error && <p className="text-red-600 mb-3 text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
          disabled={saving}
        >
          Volver
        </button>
        <button
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-violet-600 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
          onClick={handleGuardar}
          disabled={saving}
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
