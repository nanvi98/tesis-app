'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Calendar,
  Clock,
  Pencil,
  Trash2,
  Plus,
  User,
  Check,
  X,
} from 'lucide-react';
import Link from 'next/link';
import ReagendarCitaModal from './components/ReagendarCitaModal';

export default function CitasPage() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalCita, setModalCita] = useState<any>(null);

  const loadCitas = async () => {
    setLoading(true);

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) {
      setCitas([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('citas')
      .select(`
        id,
        fecha,
        motivo,
        estado,
        paciente:profiles!citas_paciente_id_fkey(nombre,email),
        historial:citas_historial(*)
      `)
      .eq('medico_id', session.user.id)
      .order('fecha', { ascending: true });

    setCitas(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadCitas();
  }, []);

  const updateEstado = async (id: string, nuevoEstado: string) => {
    const desc = `Estado actualizado a: ${nuevoEstado}`;

    const { error } = await supabase.rpc('actualizar_estado_cita', {
      cita_id: id,
      estado_nuevo: nuevoEstado,
      descripcion: desc,
    });

    if (error) {
      console.log(error);
      alert("No se pudo actualizar");
    }

    await loadCitas();
  };

  const deleteCita = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta cita?')) return;

    await supabase.from('citas').delete().eq('id', id);
    await loadCitas();
  };

  const getEstadoBadge = (estado: string) => {
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

  return (
    <div className="max-w-3xl mx-auto mt-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-violet-600 text-transparent bg-clip-text">
          Citas programadas
        </h1>

        <Link href="/panel/medico/citas/nueva">
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-white text-sm font-semibold">
            <Plus size={18} />
            Nueva cita
          </button>
        </Link>
      </div>

      {loading && <p>Cargando…</p>}

      {!loading && citas.length === 0 && (
        <p className="text-slate-500">No hay citas registradas.</p>
      )}

      <div className="grid gap-4">
        {citas.map((c) => (
          <div
            key={c.id}
            className="p-4 bg-white shadow rounded-xl flex justify-between items-center border border-slate-100"
          >
            <div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {c.paciente?.nombre}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {c.paciente?.email}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-slate-500 text-sm mt-2">
                <Calendar size={15} />

                {new Date(c.fecha).toLocaleDateString('es-MX', {
                  dateStyle: 'medium',
                })}

                <Clock size={15} />

                {new Date(c.fecha).toLocaleTimeString('es-MX', {
                  timeStyle: 'short',
                })}

                <span className={getEstadoBadge(c.estado)}>
                  {c.estado}
                </span>
              </div>

              {c.motivo && (
                <p className="text-sm text-slate-500 mt-1">
                  Motivo: {c.motivo}
                </p>
              )}

              {/* Historial con fecha correcta */}
              {c.historial?.length > 0 && (
                <div className="mt-2 text-xs text-slate-600">
                  <p className="font-semibold text-slate-700">Historial:</p>
                  <ul className="list-disc pl-4">
                    {c.historial.map((h: any) => {
                      const match = h.descripcion.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
                      const fecha = match
                        ? new Date(match[0]).toLocaleString('es-MX', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Sin fecha';

                      return (
                        <li key={h.id}>
                          {fecha}: {h.descripcion}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-end">
              <div className="flex gap-2">
                <button
                  onClick={() => updateEstado(c.id, 'confirmada')}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                >
                  <Check size={14} />
                  Confirmar
                </button>

                <button
                  onClick={() => updateEstado(c.id, 'cancelada')}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100"
                >
                  <X size={14} />
                  Cancelar
                </button>
              </div>

              <div className="flex gap-3 items-center text-slate-500">
                <button
                  onClick={() => setModalCita(c)}
                  className="cursor-pointer text-amber-600 hover:text-amber-700"
                >
                  Reprogramar
                </button>

                <Link href={`/panel/medico/citas/${c.id}/editar`}>
                  <Pencil className="cursor-pointer hover:text-blue-600" size={18} />
                </Link>

                <Trash2
                  className="cursor-pointer text-red-500 hover:text-red-700"
                  onClick={() => deleteCita(c.id)}
                  size={18}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

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
  );
}
