'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  Stethoscope,
  Calendar,
  AlertCircle,
  XCircle,
  Loader2,
} from 'lucide-react';

interface Medico {
  id: string;
  nombre: string | null;
  email: string | null;
  foto_url?: string | null;
  especialidad?: string | null;
}

export default function NuevaCitaPacientePage() {
  const router = useRouter();

  const [medicoQuery, setMedicoQuery] = useState('');
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [selectedMedico, setSelectedMedico] = useState<Medico | null>(null);

  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);

  // min para datetime-local (no pasado)
  const minDateTime = useMemo(() => {
    const now = new Date();
    // pequeño margen de 10 minutos
    now.setMinutes(now.getMinutes() + 10);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(
      local.getDate()
    )}T${pad(local.getHours())}:${pad(local.getMinutes())}`;
  }, []);

  // ─────────────────────────────
  // Buscar médicos
  // ─────────────────────────────
  useEffect(() => {
    if (selectedMedico) {
      // si ya hay uno seleccionado, no seguimos mostrando lista
      setMedicos([]);
      return;
    }

    if (medicoQuery.trim().length < 2) {
      setMedicos([]);
      return;
    }

    const search = async () => {
      setBuscando(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nombre, email, foto_url, especialidad')
        .eq('role', 'medico')
        .or(
          `nombre.ilike.%${medicoQuery}%,email.ilike.%${medicoQuery}%,especialidad.ilike.%${medicoQuery}%`
        )
        .order('nombre', { ascending: true });

      if (error) {
        console.error(error);
      }

      setMedicos(data ?? []);
      setBuscando(false);
    };

    search();
  }, [medicoQuery, selectedMedico]);

  // ─────────────────────────────
  // Crear cita
  // ─────────────────────────────
  const handleCrear = async () => {
    setError('');

    if (!selectedMedico) {
      setError('Selecciona un médico para agendar tu cita.');
      return;
    }

    if (!fecha) {
      setError('Selecciona fecha y hora de la cita.');
      return;
    }

    const fechaSeleccionada = new Date(fecha);
    const ahora = new Date();

    if (fechaSeleccionada.getTime() <= ahora.getTime()) {
      setError('No puedes agendar una cita en una fecha y hora pasadas.');
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      setError('Sesión no válida, vuelve a iniciar sesión.');
      return;
    }

    // Validar conflictos de horario con ese médico
    const { data: citasMedico, error: citasError } = await supabase
      .from('citas')
      .select('id, fecha, estado')
      .eq('medico_id', selectedMedico.id)
      .neq('estado', 'cancelada');

    if (citasError) {
      console.error(citasError);
    } else {
      const conflicto = (citasMedico ?? []).some((c: any) => {
        const f = new Date(c.fecha);
        // misma hora exacta (diferencia menor a 30 minutos)
        const diffMin = Math.abs(f.getTime() - fechaSeleccionada.getTime()) / 60000;
        return diffMin < 30; // asumiendo bloques de 30 min
      });

      if (conflicto) {
        setLoading(false);
        setError(
          'El médico ya tiene una cita cercana a esa hora. Por favor elige otro horario.'
        );
        return;
      }
    }

    // Insertar cita
    const { error: insertError } = await supabase.from('citas').insert({
      medico_id: selectedMedico.id,
      paciente_id: user.id,
      fecha: fechaSeleccionada.toISOString(),
      motivo: motivo.trim() || null,
      estado: 'pendiente',
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error(insertError);
      setError('No se pudo crear la cita. Intenta de nuevo.');
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/panel/paciente/citas');
  };

  // ─────────────────────────────
  // Render
  // ─────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100">
      <div className="max-w-xl mx-auto mt-6 bg-white shadow-2xl rounded-3xl p-6 border border-slate-100 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
              Agendar nueva cita
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Busca a tu médico, elige fecha y motivo de la consulta.
            </p>
          </div>
        </div>

        {/* Selección de médico */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Médico</p>

          {!selectedMedico && (
            <>
              <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-3 py-2 bg-slate-50">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Buscar por nombre, especialidad o correo"
                  value={medicoQuery}
                  onChange={(e) => setMedicoQuery(e.target.value)}
                />
              </div>

              {buscando && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-500" />
                  Buscando médicos...
                </div>
              )}

              {medicos.length > 0 && (
                <div className="mt-2 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-56 overflow-y-auto">
                  {medicos.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMedico(m)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                        {m.foto_url ? (
                          <img
                            src={m.foto_url}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                      <div className="leading-tight">
                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                          <Stethoscope className="h-4 w-4 text-sky-500" />
                          {m.nombre || 'Sin nombre'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {m.especialidad || 'Especialidad no registrada'}
                        </p>
                        <p className="text-[11px] text-slate-400">{m.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {selectedMedico && (
            <div className="mt-1 flex items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-3 py-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  {selectedMedico.foto_url ? (
                    <img
                      src={selectedMedico.foto_url}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-4 w-4 text-slate-500" />
                  )}
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                    <Stethoscope className="h-4 w-4 text-sky-500" />
                    {selectedMedico.nombre}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedMedico.especialidad || 'Especialidad no registrada'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedMedico.email}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedMedico(null);
                  setMedicoQuery('');
                }}
                className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                <XCircle className="h-3.5 w-3.5 text-rose-500" />
                Cambiar médico
              </button>
            </div>
          )}
        </div>

        {/* Fecha y hora */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Fecha y hora
          </label>
          <div className="flex items-center gap-2 border border-slate-200 rounded-2xl px-3 py-2 bg-slate-50">
            <Calendar className="h-4 w-4 text-slate-400" />
            <input
              type="datetime-local"
              className="w-full bg-transparent outline-none text-sm"
              value={fecha}
              min={minDateTime}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            No se permiten fechas pasadas. Considera al menos unos minutos de margen.
          </p>
        </div>

        {/* Motivo */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">
            Motivo de la consulta (opcional)
          </label>
          <textarea
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-sky-200"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder="Ej. Dolor de rodilla, seguimiento de estudios, resultados..."
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-2xl bg-rose-50 border border-rose-100 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-violet-600 shadow-md hover:from-sky-700 hover:to-violet-700 disabled:opacity-60 flex items-center justify-center gap-2"
          onClick={handleCrear}
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Guardando cita…' : 'Agendar cita'}
        </button>
      </div>
    </div>
  );
}
