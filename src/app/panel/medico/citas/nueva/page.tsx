'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Calendar, Search, User } from 'lucide-react';

export default function NuevaCitaPage() {
  const router = useRouter();
  const [pacienteQuery, setPacienteQuery] = useState('');
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<any>(null);

  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Buscar paciente por nombre, correo o teléfono
  useEffect(() => {
    if (pacienteQuery.trim().length < 1) return;

    async function searchPacientes() {
      const { data, error: supaError } = await supabase
        .from('profiles')
        .select('*')
        .or(
          `nombre.ilike.%${pacienteQuery}%,email.ilike.%${pacienteQuery}%,telefono.ilike.%${pacienteQuery}%`
        );

      if (!supaError) {
        setPacientes(data ?? []);
      }
    }

    searchPacientes();
  }, [pacienteQuery]);

  const handleCrear = async () => {
    if (!selectedPaciente || !fecha) {
      setError('Selecciona un paciente y la fecha/hora');
      return;
    }

    setLoading(true);

    // CAMBIO IMPORTANTE Y CORRECTO
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('citas').insert({
      medico_id: user?.id,
      paciente_id: selectedPaciente.id,
      fecha: new Date(fecha).toISOString(),
      motivo,
      estado: 'pendiente',
      created_at: new Date().toISOString()
    });

    setLoading(false);

    if (error) {
      console.log(error);
      setError("No se pudo crear la cita");
      return;
    }

    router.push('/panel/medico/citas');
  };

  return (
    <div className="max-w-xl mx-auto mt-6 bg-white shadow-2xl rounded-2xl p-6 border border-slate-200">
      <h1 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
        Crear nueva cita
      </h1>

      {/* Buscar paciente */}
      <div className="mb-5">
        <p className="text-sm mb-2 font-medium text-slate-700">Paciente:</p>
        <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            className="w-full outline-none"
            placeholder="Buscar por nombre, correo o teléfono"
            value={pacienteQuery}
            onChange={(e) => setPacienteQuery(e.target.value)}
          />
        </div>

        {pacientes.length > 0 && !selectedPaciente && (
          <div className="bg-white border rounded-xl mt-2 shadow-lg overflow-hidden">
            {pacientes.map((p: any) => (
              <div
                key={p.id}
                className="px-3 py-3 hover:bg-slate-100 cursor-pointer flex items-center gap-2"
                onClick={() => setSelectedPaciente(p)}
              >
                <User size={18} />
                <div>
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-xs text-slate-500">{p.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedPaciente && (
          <div className="mt-3 bg-sky-50 border border-sky-200 rounded-xl px-3 py-2">
            <p>
              <span className="font-medium">Paciente seleccionado:</span>
              <br /> {selectedPaciente.nombre} ({selectedPaciente.email})
            </p>
          </div>
        )}
      </div>

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

      <div className="mb-6">
        <label className="text-sm font-medium">Motivo:</label>
        <textarea
          className="w-full border rounded-xl px-3 py-2 mt-1 outline-none"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </div>

      {error && <p className="text-red-600 mb-3">{error}</p>}

      <button
        className="w-full py-3 rounded-xl text-white bg-gradient-to-r from-sky-600 to-violet-600 font-semibold hover:opacity-90 transition"
        onClick={handleCrear}
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Agendar cita'}
      </button>
    </div>
  );
}
