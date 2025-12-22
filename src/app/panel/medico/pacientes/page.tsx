"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Search, User, FilePlus2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { getOrCreateChat } from "@/utils/chats";

interface Paciente {
  id: string;
  nombre: string | null;
  sexo: string | null;
  requiere_estudio: boolean;
  fecha_registro: string;
}

export default function PacientesAsignadosPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchPacientes() {
      const userResp = await supabase.auth.getUser();
      const user = userResp.data.user;
      if (!user) return;

      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('medico_id', user.id)
        .order('fecha_registro', { ascending: false });

      if (error) {
        console.log('Error cargando pacientes:', error);
        setLoading(false);
        return;
      }

      setPacientes(data || []);
      setLoading(false);
    }

    fetchPacientes();
  }, []);

  async function eliminarPaciente(id: string) {
    const confirmacion = confirm('¿Seguro que quieres eliminar al paciente?');
    if (!confirmacion) return;

    const { error } = await supabase
      .from('pacientes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando:', error);
      return;
    }

    setPacientes(prev => prev.filter(p => p.id !== id));
  }

  /*async function abrirChat(pacienteId: string) {
    const userResp = await supabase.auth.getUser();
    const user = userResp.data.user;
    if (!user) return;

    try {
      const chatId = await getOrCreateChat(user.id, pacienteId);
      router.push(`/panel/medico/chat/${chatId}`);
    } catch (error) {
      console.log("Error abriendo el chat:", error);
    }
  }
*/
  return (
    <div className="space-y-5">

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Pacientes asignados
        </h1>

        <Link
          href="/panel/medico/pacientes/agregar"
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-xl shadow font-medium transition"
        >
          + Añadir paciente
        </Link>
      </div>

      <div className="rounded-3xl bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]
          border border-slate-100/60 p-5">

        {/* Search bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 w-full rounded-xl
              bg-slate-50 px-3 py-2 border border-slate-200">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              placeholder="Buscar paciente por nombre..."
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
          </div>
        ) : pacientes.length === 0 ? (
          <div className="text-slate-500 text-sm italic py-6 text-center">
            Aún no tienes pacientes asignados ✨
          </div>
        ) : (
          <ul className="space-y-3">
            {pacientes.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-2xl bg-sky-50 
                px-4 py-3 hover:bg-sky-100 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-sky-500 text-white rounded-full 
                      flex items-center justify-center shadow">
                    <User className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800 capitalize">
                      {p.nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.fecha_registro).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">

                  <span
                    className={`px-3 py-1 text-xs rounded-full font-medium ${p.requiere_estudio
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                      }`}
                  >
                    {p.requiere_estudio ? 'Requiere estudio' : 'Sin estudio'}
                  </span>

                  <Link
                    href={`/panel/medico/expediente/${p.id}`}
                    className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-700
                      text-white text-xs rounded-xl px-3 py-1.5 shadow font-semibold transition"
                  >
                    <FilePlus2 className="h-4 w-4" />
                    Ver expediente
                  </Link>

                  <button
                    onClick={() => eliminarPaciente(p.id)}
                    className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl shadow font-semibold transition"
                  >
                    🗑 Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
