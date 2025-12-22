'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  Trash2,
  Check,
  X,
  History,
  Loader2,
} from 'lucide-react';

// ─────────────────────────────
// Tipos
// ─────────────────────────────

type CitaEstado = 'pendiente' | 'confirmada' | 'cancelada' | 'reprogramada';

interface CitaHistorial {
  id: string;
  created_at: string;
  descripcion: string;
  fecha:string;
}

interface CitaMedico {
  id: string;
  nombre: string | null;
  email: string | null;
  foto_url?: string | null;
  especialidad?: string | null;
}

interface Cita {
  id: string;
  fecha: string;
  motivo: string | null;
  estado: CitaEstado;
  medico: CitaMedico | null;
  historial: CitaHistorial[];
}

export default function CitasPacientePage() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [modalCita, setModalCita] = useState<Cita | null>(null);
  const [updating, setUpdating] = useState(false);

  // ─────────────────────────────
  // Cargar citas del paciente
  // ─────────────────────────────
  const loadCitas = async () => {
    setLoading(true);
    setErrorMsg('');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCitas([]);
      setLoading(false);
      setErrorMsg('Sesión no válida, vuelve a iniciar sesión.');
      return;
    }

    const { data, error } = await supabase
      .from('citas')
      .select(
        `
        id,
        fecha,
        motivo,
        estado,
        medico:profiles!citas_medico_id_fkey (
          id,
          nombre,
          email,
          foto_url,
          especialidad
        ),
        historial:citas_historial (*)
      `
      )
      .eq('paciente_id', user.id)
      .order('fecha', { ascending: true });

    if (error) {
      console.error(error);
      setErrorMsg('No se pudieron cargar tus citas.');
      setLoading(false);
      return;
    }

    const mapped: Cita[] = (data ?? []).map((row: any) => ({
      id: row.id,
      fecha: row.fecha,
      motivo: row.motivo,
      estado: row.estado,
      medico: row.medico
        ? Array.isArray(row.medico)
          ? row.medico[0]
          : row.medico
        : null,
      historial: row.historial ?? [],
    }));

    setCitas(mapped);
    setLoading(false);
  };

  useEffect(() => {
    loadCitas();
  }, []);

  // ─────────────────────────────
  // Badges de estado
  // ─────────────────────────────
  const getEstadoBadge = (estado: CitaEstado) => {
    const base =
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold';
    if (estado === 'confirmada')
      return `${base} bg-emerald-50 text-emerald-700`;
    if (estado === 'cancelada')
      return `${base} bg-rose-50 text-rose-700 line-through`;
    if (estado === 'reprogramada')
      return `${base} bg-amber-50 text-amber-700`;
    return `${base} bg-sky-50 text-sky-700`;
  };

  // ─────────────────────────────
  // Actualizar estado (confirmar / cancelar)
  // ─────────────────────────────
  const updateEstado = async (id: string, nuevoEstado: CitaEstado) => {
    setUpdating(true);
    setErrorMsg('');

    const desc = `Estado actualizado a "${nuevoEstado}" por el paciente`;

    const { error } = await supabase.rpc('actualizar_estado_cita', {
      cita_id: id,
      estado_nuevo: nuevoEstado,
      descripcion: desc,
    });

    if (error) {
      console.error(error);
      setErrorMsg('No se pudo actualizar el estado de la cita.');
      setUpdating(false);
      return;
    }

    await loadCitas();
    setUpdating(false);
  };

  // ─────────────────────────────
  // Eliminar cita
  // ─────────────────────────────
  const deleteCita = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta cita?')) return;

    setUpdating(true);
    setErrorMsg('');

    const { error } = await supabase.from('citas').delete().eq('id', id);

    if (error) {
      console.error(error);
      setErrorMsg('No se pudo eliminar la cita.');
      setUpdating(false);
      return;
    }

    await loadCitas();
    setUpdating(false);
  };

  // ─────────────────────────────
  // Render
  // ─────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
              Mis citas
            </h1>
            <p className="text-xs sm:text-sm text-slate-600">
              Consulta, confirma, reprograma o cancela tus citas médicas.
            </p>
          </div>

          <a
            href="/panel/paciente/citas/nueva"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-sky-500 to-violet-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md hover:from-sky-600 hover:to-violet-600"
          >
            Agendar nueva cita
          </a>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40 text-slate-500 text-sm gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
            Cargando tus citas...
          </div>
        ) : citas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
            <Calendar className="h-6 w-6 text-slate-300" />
            <p>No tienes citas registradas.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {citas.map((cita) => {
              const fechaObj = new Date(cita.fecha);
              const esPasada = fechaObj.getTime() < Date.now();

              return (
                <div
                  key={cita.id}
                  className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col sm:flex-row sm:items-stretch justify-between gap-3"
                >
                  {/* IZQUIERDA: info */}
                  <div className="flex-1 space-y-2">
                    {/* Médico */}
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-200">
                        {cita.medico?.foto_url ? (
                          <img
                            src={cita.medico.foto_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                          <Stethoscope className="h-4 w-4 text-sky-500" />
                          {cita.medico?.nombre || 'Médico sin nombre'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {cita.medico?.especialidad || 'Especialidad no registrada'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {cita.medico?.email}
                        </p>
                      </div>
                    </div>

                    {/* Fecha / hora / estado */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-sky-500" />
                        {fechaObj.toLocaleDateString('es-MX', {
                          dateStyle: 'medium',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-4 w-4 text-sky-500" />
                        {fechaObj.toLocaleTimeString('es-MX', {
                          timeStyle: 'short',
                        })}
                      </span>
                      <span className={getEstadoBadge(cita.estado)}>
                        {cita.estado}
                      </span>
                      {esPasada && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-[11px] text-slate-500">
                          Pasada
                        </span>
                      )}
                    </div>

                    {/* Motivo */}
                    {cita.motivo && (
                      <p className="text-xs text-slate-600">
                        <span className="font-semibold">Motivo:</span> {cita.motivo}
                      </p>
                    )}

                    {/* Historial */}
                    {cita.historial && cita.historial.length > 0 && (
                      <div className="mt-1 rounded-xl bg-slate-50 px-3 py-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 mb-1">
                          <History className="h-3.5 w-3.5" />
                          <span className="font-semibold">Historial</span>
                        </div>
                        <ul className="space-y-1 max-h-28 overflow-y-auto text-[11px] text-slate-600">
                          {cita.historial.map((h) => (
                            <li key={h.id}>
                              <span className="font-medium">
                                {new Date(h.fecha).toLocaleString('es-MX', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}: {h.descripcion}
                              </span>
                            </li>
                          ))}

                        </ul>
                      </div>
                    )}
                  </div>

                  {/* DERECHA: acciones */}
                  <div className="flex flex-col justify-between items-end gap-3 min-w-[170px]">
                    <div className="flex flex-wrap gap-2 justify-end">
                      {/* Confirmar */}
                      {!esPasada &&
                        (cita.estado === 'pendiente' ||
                          cita.estado === 'reprogramada') && (
                          <button
                            onClick={() => updateEstado(cita.id, 'confirmada')}
                            disabled={updating}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-60"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Confirmar
                          </button>
                        )}

                      {/* Cancelar */}
                      {!esPasada &&
                        cita.estado !== 'cancelada' && (
                          <button
                            onClick={() => updateEstado(cita.id, 'cancelada')}
                            disabled={updating}
                            className="inline-flex items-center gap-1 rounded-xl bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancelar
                          </button>
                        )}

                      {/* Reprogramar */}
                      {!esPasada &&
                        cita.estado !== 'cancelada' && (
                          <button
                            onClick={() => setModalCita(cita)}
                            className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
                          >
                            Reprogramar
                          </button>
                        )}
                    </div>

                    {/* Eliminar */}
                    <button
                      onClick={() => deleteCita(cita.id)}
                      disabled={updating}
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      Eliminar cita
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL REPROGRAMAR */}
        {modalCita && (
          <ReagendarCitaModal
            cita={modalCita}
            onClose={() => setModalCita(null)}
            onSaved={() => {
              setModalCita(null);
              loadCitas();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────
// Modal reprogramar cita
// ─────────────────────────────

interface ReagendarProps {
  cita: Cita;
  onClose: () => void;
  onSaved: () => void;
}

function ReagendarCitaModal({ cita, onClose, onSaved }: ReagendarProps) {
  const [fechaNueva, setFechaNueva] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // convertir ISO → value para datetime-local
  useEffect(() => {
    const d = new Date(cita.fecha);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const value = `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(
      local.getDate()
    )}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    setFechaNueva(value);
  }, [cita.fecha]);

  const handleSave = async () => {
    if (!fechaNueva) {
      setError('Selecciona una nueva fecha y hora.');
      return;
    }

    const nuevaFecha = new Date(fechaNueva);
    const ahora = new Date();

    if (nuevaFecha.getTime() <= ahora.getTime()) {
      setError('No puedes reprogramar a una fecha pasada.');
      return;
    }

    setSaving(true);
    setError('');

    const nuevaIso = nuevaFecha.toISOString();

    // 1) actualizar cita
    const { error: updateError } = await supabase
      .from('citas')
      .update({
        fecha: nuevaIso,
        estado: 'reprogramada',
      })
      .eq('id', cita.id);

    if (updateError) {
      console.error(updateError);
      setError('No se pudo reprogramar la cita.');
      setSaving(false);
      return;
    }

    // 2) registrar en historial
    const descripcion = `Cita reprogramada por el paciente a ${nuevaFecha.toLocaleString(
      'es-MX'
    )}`;

    await supabase.from('citas_historial').insert({
      cita_id: cita.id,
      descripcion,
    });

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl border border-slate-100">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">
              Reprogramar cita
            </p>
            <h2 className="text-sm font-semibold text-slate-900">
              {cita.medico?.nombre || 'Médico'} –{' '}
              {new Date(cita.fecha).toLocaleString('es-MX', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-700">
              Nueva fecha y hora
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input
                type="datetime-local"
                className="w-full bg-transparent text-sm outline-none"
                value={fechaNueva}
                onChange={(e) => setFechaNueva(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-1">
              {error}
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-1.5 text-xs font-semibold text-white shadow-md disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
