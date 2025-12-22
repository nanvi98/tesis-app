'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Inicial from '../../medico/expediente/[pacienteId]/Tabs/Inicial';
import SignosLectura from "./components/SignosLectura";
import Consultas from '../../medico/expediente/[pacienteId]/Tabs/Consultas';

export default function ExpedientePaciente() {
  const [tab, setTab] = useState<'inicial' | 'signos' | 'consultas'>('inicial');
  const [paciente, setPaciente] = useState<any>(null);
  const [consultaInicial, setConsultaInicial] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      // Buscar paciente asociado
      const { data: pacienteData } = await supabase
        .from('pacientes')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

      setPaciente(pacienteData);

      // Cargar primera consulta
      if (pacienteData) {
        const { data: consulta } = await supabase
          .from('consultas')
          .select('*')
          .eq('paciente_id', pacienteData.id)
          .order('fecha', { ascending: true })
          .limit(1)
          .maybeSingle();

        setConsultaInicial(consulta);
      }
    }

    load();
  }, []);

  if (!paciente) return <p>Cargando expediente…</p>;

  return (
    <div className="space-y-6">
      <div className="bg-white border shadow rounded-2xl p-4">
        <h1 className="text-xl font-semibold text-slate-800">
          Mi expediente médico
        </h1>

        <p className="text-sm text-slate-500">
          Paciente: {paciente.nombre}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('inicial')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'inicial' ? 'bg-cyan-600 text-white' : 'bg-white border'
          }`}
        >
          Consulta inicial
        </button>

        <button
          onClick={() => setTab('signos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'signos' ? 'bg-cyan-600 text-white' : 'bg-white border'
          }`}
        >
          Signos vitales
        </button>

        <button
          onClick={() => setTab('consultas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'consultas' ? 'bg-cyan-600 text-white' : 'bg-white border'
          }`}
        >
          Historial
        </button>
      </div>

      {tab === 'inicial' && (
        <Inicial paciente={paciente} consulta={consultaInicial} />
      )}

      {tab === 'signos' && (
        <SignosLectura pacienteId={paciente.id} />
      )}

      {tab === 'consultas' && (
        <Consultas pacienteId={paciente.id} />
      )}
    </div>
  );
}

