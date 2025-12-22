'use client';

export const dynamic = "force-dynamic";

import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, User, ClipboardList, Image, Syringe } from 'lucide-react';
import Link from 'next/link';

const tabs = [
  { id: 'datos', label: 'Datos del paciente', icon: User },
  { id: 'visitas', label: 'Visitas', icon: ClipboardList },
  { id: 'imagenes', label: 'Radiografías', icon: Image },
  { id: 'tratamiento', label: 'Tratamiento', icon: Syringe },
];

export default function Expediente() {
  const { pacienteId } = useParams();
  const [activeTab, setActiveTab] = useState('datos');
  const [paciente, setPaciente] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPaciente() {
      const { data, error } = await supabase
        .from('medico_pacientes')
        .select('*')
        .eq('id', pacienteId)
        .single();

      if (!error) setPaciente(data);

      setLoading(false);
    }

    fetchPaciente();
  }, [pacienteId]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );

  if (!paciente)
    return (
      <div className="text-center py-20 text-slate-500">
        Paciente no encontrado
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <h1 className="text-xl font-semibold text-slate-900">
          Expediente médico
        </h1>

        <Link
          href="/panel/medico/pacientes"
          className="text-sm text-sky-600 hover:underline"
        >
          ← Regresar
        </Link>
      </div>

      {/* NOMBRE */}
      <div className="p-5 bg-white rounded-2xl shadow border">
        <p className="text-2xl font-bold capitalize text-slate-800">
          {paciente.nombre}
        </p>
        <p className="text-slate-500 text-sm">
          Registrado el:{' '}
          {new Date(paciente.fecha_registro).toLocaleDateString('es-MX')}
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition
              ${
                active
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white border hover:bg-slate-100'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="p-6 bg-white rounded-2xl shadow border min-h-[300px]">
        {activeTab === 'datos' && (
          <div className="space-y-2">
            <p><b>Sexo:</b> {paciente.sexo}</p>
            <p><b>Requiere estudios:</b> {paciente.requiere_estudio ? 'Sí' : 'No'}</p>
          </div>
        )}

        {activeTab === 'visitas' && (
          <div className="text-slate-500">
            Aquí van las visitas 🩺
          </div>
        )}

        {activeTab === 'imagenes' && (
          <div className="text-slate-500">
            Aquí van las radiografías 📸
          </div>
        )}

        {activeTab === 'tratamiento' && (
          <div className="text-slate-500">
            Aquí va el tratamiento 💊
          </div>
        )}
      </div>
    </div>
  );
}
