'use client';

export const dynamic = "force-dynamic";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Inicial from './Tabs/Inicial';
import Signos from './Tabs/Signos';
import Consultas from './Tabs/Consultas';
import { supabase } from '@/lib/supabaseClient';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ExpedientePage() {
  const { pacienteId } = useParams() as { pacienteId: string };

  const [tab, setTab] = useState<'inicial' | 'signos' | 'consultas'>('inicial');
  const [paciente, setPaciente] = useState<any>(null);
  const [consultaInicial, setConsultaInicial] = useState<any>(null);

  async function cargarPaciente() {
    const { data } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', pacienteId)
      .single();

    setPaciente(data);
  }

  async function cargarConsultaInicial() {
    const { data } = await supabase
      .from('consultas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: true })
      .limit(1)
      .single();

    setConsultaInicial(data);
  }

  useEffect(() => {
    if (!pacienteId) return;
    void cargarPaciente();
    void cargarConsultaInicial();
  }, [pacienteId]);
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="bg-white border shadow rounded-2xl p-4">
        <h1 className="text-xl font-semibold text-slate-800">
          Expediente de {paciente?.nombre ?? ''}
        </h1>
        <p className="text-sm text-slate-500">
          ID: {pacienteId}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('inicial')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'inicial' ? 'bg-cyan-600 text-white' : 'bg-white border'
            }`}
        >
          Consulta inicial
        </button>

        <button
          onClick={() => setTab('signos')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'signos' ? 'bg-cyan-600 text-white' : 'bg-white border'
            }`}
        >
          Signos vitales
        </button>

        <button
          onClick={() => setTab('consultas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'consultas' ? 'bg-cyan-600 text-white' : 'bg-white border'
            }`}
        >
          Historial
        </button>

        <button
          onClick={() => router.back()}
          className="text-sm mb-4 inline-flex items-center gap-2 bg-slate-200 hover:bg-slate-300 
  text-slate-700 px-4 py-2 rounded-xl shadow-sm transition"
        >
          <ArrowLeft size={16} />
          Regresar
        </button>

      </div>

      {tab === 'inicial' && (
        <Inicial paciente={paciente} consulta={consultaInicial} />
      )}

      {tab === 'signos' && (
        <Signos pacienteId={pacienteId} />
      )}

      {tab === 'consultas' && (
        <Consultas pacienteId={pacienteId} />
      )}

    </div>
  );
}
