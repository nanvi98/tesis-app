'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { Search, User, Trash2, Calendar } from 'lucide-react';

export default function NuevaCitaPacientePage() {
  const router = useRouter();

  const [medicoQuery, setMedicoQuery] = useState('');
  const [medicos, setMedicos] = useState<any[]>([]);
  const [selectedMedico, setSelectedMedico] = useState<any>(null);

  const [fecha, setFecha] = useState('');
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔎 Buscar médico
  useEffect(() => {
    if (medicoQuery.trim().length < 1) return;

    async function searchMedicos() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'medico')
        .or(
          `nombre.ilike.%${medicoQuery}%, email.ilike.%${medicoQuery}%`
        );

      setMedicos(data ?? []);
    }

    searchMedicos();
  }, [medicoQuery]);

  const handleCrear = async () => {
    setError('');
    setLoading(true);

    const { data: session } = await supabase.auth.getUser();
    const user = session?.user;
    if (!user) return;

    if (!selectedMedico) {
      setError('Selecciona un médico');
      setLoading(false);
      return;
    }

    if (!fecha) {
      setError('Selecciona una fecha y hora');
      setLoading(false);
      return;
    }

    // ⛔ No permitir fechas pasadas
    const ahora = new Date();
    const seleccionada = new Date(fecha);
    if (seleccionada < ahora) {
      setError('No puedes agendar en una fecha pasada');
      setLoading(false);
      return;
    }

    // ⛔ Revisar disponibilidad
    const { data: ocupadas } = await supabase
      .from('citas')
      .select('id')
      .eq('medico_id', selectedMedico.id)
      .eq('fecha', seleccionada.toISOString());

    if (ocupadas && ocupadas.length > 0) {
      setError('Esa fecha ya está ocupada.');
      setLoading(false);
      return;
    }

    // ✔ Insertar cita
    const { error } = await supabase.from('citas').insert({
      medico_id: selectedMedico.id,
      paciente_id: user.id,
      fecha: seleccionada.toISOString(),
      motivo,
      estado: 'pendiente',
    });

    if (error) {
      setError('No se pudo crear la cita');
      setLoading(false);
      return;
    }

    router.push('/panel/paciente/citas');
  };

  return (
    <div className="max-w-xl mx-auto mt-6 bg-white shadow-2xl rounded-2xl p-6 border">
      <h1 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-sky-600 to-violet-600 bg-clip-text text-transparent">
        Crear nueva cita
      </h1>

      {/* Buscar médico */}
      <div className="mb-5">
        <p className="text-sm mb-2 font-medium text-slate-700">
          Médico:
        </p>
        <div className="flex items-center gap-2 border rounded-xl px-3 py-2">
          <Search size={18} className="text-slate-400" />
          <input
            className="w-full outline-none"
            placeholder="Buscar por nombre o correo"
            value={medicoQuery}
            onChange={(e) => setMedicoQuery(e.target.value)}
          />
        </div>

        {/* LISTA */}
        {medicos.length > 0 && !selectedMedico && (
          <div className="bg-white border rounded-xl mt-2 shadow-lg overflow-hidden">
            {medicos.map((m: any) => (
              <div
                key={m.id}
                className="px-3 py-3 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                onClick={() => setSelectedMedico(m)}
              >
                <User size={18} />
                <div>
                  <p className="font-medium">{m.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {m.medico_especialidad}
                  </p>
                  <p className="text-xs text-slate-500">{m.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedMedico && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex justify-between items-center">
            <div>
              <p className="font-medium">
                {selectedMedico.nombre}
              </p>
              <p className="text-xs text-slate-500">
                {selectedMedico.medico_especialidad}
              </p>
            </div>

            <Trash2
              onClick={() => setSelectedMedico(null)}
              className="text-red-500 cursor-pointer"
              size={18}
            />
          </div>
        )}
      </div>

      {/* Fecha */}
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

      {/* Motivo */}
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
        className="w-full py-3 rounded-xl text-white bg-gradient-to-r from-sky-600 to-violet-600 font-semibold"
        onClick={handleCrear}
        disabled={loading}
      >
        {loading ? 'Guardando...' : 'Agendar cita'}
      </button>
    </div>
  );
}
