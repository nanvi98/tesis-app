'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save } from 'lucide-react';

interface SignosProps {
  pacienteId: string;
}

export default function Signos({ pacienteId }: SignosProps) {
  const [signos, setSignos] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  async function cargarSignos() {
    const { data } = await supabase
      .from('consultas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })
      .limit(1);

    if (data?.length) {
      setSignos(data[0]);
    }
  }

  useEffect(() => {
    void cargarSignos();
  }, []);

  async function guardar() {
    setSaving(true);

    const { error } = await supabase
      .from('consultas')
      .update({
        presionarterial: signos.presionarterial,
        frecuenciacardiaca: signos.frecuenciacardiaca,
        frecuenciarespiratoria: signos.frecuenciarespiratoria,
        temperatura: signos.temperatura,
        saturacion: signos.saturacion,
        escaladolor: signos.escaladolor,
        notassignos: signos.notassignos,
      })
      .eq('id', signos.id);

    setSaving(false);

    if (error) {
      alert('Error guardando signos');
      return;
    }

    alert('Signos guardados correctamente');
  }

  if (!signos) {
    return <p className="text-sm text-slate-500">Cargando signos...</p>;
  }

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Presión arterial" name="presionarterial" value={signos.presionarterial}
          onChange={(e: any) => setSignos({ ...signos, presionarterial: e.target.value })}
        />
        <Input label="Frecuencia cardíaca" name="frecuenciacardiaca" value={signos.frecuenciacardiaca}
          onChange={(e: any) => setSignos({ ...signos, frecuenciacardiaca: e.target.value })}
        />
        <Input label="Frecuencia respiratoria" name="frecuenciarespiratoria" value={signos.frecuenciarespiratoria}
          onChange={(e: any) => setSignos({ ...signos, frecuenciarespiratoria: e.target.value })}
        />

        <Input label="Temperatura" name="temperatura" value={signos.temperatura}
          onChange={(e: any) => setSignos({ ...signos, temperatura: e.target.value })}
        />

        <Input label="Saturación de O₂" name="saturacion" value={signos.saturacion}
          onChange={(e: any) => setSignos({ ...signos, saturacion: e.target.value })}
        />

        <Input label="Escala del dolor" name="escaladolor" value={signos.escaladolor}
          onChange={(e: any) => setSignos({ ...signos, escaladolor: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm text-slate-700 font-medium">
          Notas adicionales
        </label>
        <textarea
          className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-cyan-600 outline-none"
          value={signos.notassignos ?? ''}
          onChange={(e) => setSignos({ ...signos, notassignos: e.target.value })}
        />
      </div>

      <button
        onClick={guardar}
        className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-xl shadow"
        disabled={saving}
      >
        <Save size={18} />
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}


/*** COMPONENTES INTERNOS ***/
function Input({ label, value, name, onChange }: any) {
  return (
    <label className="flex flex-col text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        value={value ?? ''}     // <--- FIX CLAVE
        onChange={onChange}
        className="mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-cyan-600 outline-none"
      />
    </label>
  );
}
