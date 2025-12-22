'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Search, User } from 'lucide-react';

export default function BuscarPaciente() {
  const [texto, setTexto] = useState('');
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [medicoId, setMedicoId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setMedicoId(user.id);
    }
    getUser();
  }, []);

  const handleBuscar = async () => {
    if (!texto.trim()) {
      setPacientes([]);
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        nombre,
        email,
        telefono,
        created_at,
        role,
        asignacion:medico_pacientes!fk_paciente(medico_id)
      `)
      .eq('role', 'paciente')
      .or(`nombre.ilike.%${texto}%,email.ilike.%${texto}%,telefono.ilike.%${texto}%`);

    if (error) {
      console.log(error);
      setErrorMsg('Ocurrió un error al buscar pacientes.');
      setPacientes([]);
    } else {
      setPacientes(data || []);
    }

    setLoading(false);
  };

  const adoptarPaciente = async (pacienteId: string) => {
    if (!medicoId) return;

    // VALIDAMOS DUPLICADO
    const { data: existe } = await supabase
      .from('medico_pacientes')
      .select('id')
      .eq('paciente_id', pacienteId)
      .eq('medico_id', medicoId)
      .maybeSingle();

    if (existe) {
      alert('Este paciente ya está asignado a este médico.');
      return;
    }

    const confirmar = confirm('¿Quieres adoptar a este paciente?');
    if (!confirmar) return;

    const { error } = await supabase
      .from('medico_pacientes')
      .insert({
        paciente_id: pacienteId,
        medico_id: medicoId,
        fecha_registro: new Date().toISOString(),
      });

    if (error) {
      console.log(error);
      alert('Error al adoptar al paciente');
      return;
    }

    setPacientes(prev =>
      prev.map(p =>
        p.id === pacienteId
          ? { ...p, asignacion: [{ medico_id: medicoId }] }
          : p
      )
    );
  };

  const liberarPaciente = async (pacienteId: string) => {
    if (!medicoId) return;

    const confirmar = confirm('¿Quieres liberar a este paciente?');
    if (!confirmar) return;

    const { error } = await supabase
      .from('medico_pacientes')
      .delete()
      .eq('paciente_id', pacienteId)
      .eq('medico_id', medicoId);

    if (error) {
      alert('Error al liberar paciente');
      return;
    }

    setPacientes(prev =>
      prev.map(p =>
        p.id === pacienteId
          ? { ...p, asignacion: [] }
          : p
      )
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-10">
        Buscar paciente
      </h1>

      <div className="flex items-center gap-4 max-w-4xl">
        <div className="flex items-center w-full rounded-2xl shadow-md border border-slate-200 bg-white px-5 py-4">
          <Search size={20} className="text-slate-400 mr-2" />
          <input
            className="w-full bg-transparent outline-none text-sm text-slate-700"
            placeholder="Nombre, correo o teléfono…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
          />
        </div>

        <button
          onClick={handleBuscar}
          className="px-6 py-2.5 rounded-2xl font-semibold bg-gradient-to-r from-cyan-600 to-emerald-600
          text-white shadow hover:scale-105 transition-all"
        >
          Buscar
        </button>
      </div>

      <div className="mt-8 max-w-4xl space-y-4">
        {pacientes.map((p) => {
          const asignado = p.asignacion?.length > 0;
          const esDeEsteMedico =
            asignado && p.asignacion[0].medico_id === medicoId;

          return (
            <div
              key={p.id}
              className="bg-white border border-slate-200 shadow-sm 
              rounded-2xl px-5 py-4 flex justify-between items-center
              hover:shadow-lg hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r 
                  from-cyan-600 to-emerald-600 flex justify-center items-center text-white shadow">
                  <User size={20} />
                </div>

                <div className="flex flex-col">
                  <p className="font-semibold text-slate-900 text-lg">
                    {p.nombre}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.email} • {p.telefono}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    router.push(
                      `/panel/medico/expediente/${p.id}?readonly=${!esDeEsteMedico}`
                    )
                  }
                  className="text-xs bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-2 rounded-xl shadow transition"
                >
                  Ver expediente
                </button>

                {!esDeEsteMedico ? (
                  <button
                    onClick={() => adoptarPaciente(p.id)}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl shadow transition"
                  >
                    Adoptar paciente
                  </button>
                ) : (
                  <>

                    <button
                      onClick={() => liberarPaciente(p.id)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl shadow transition"
                    >
                      ❌ Liberar
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
