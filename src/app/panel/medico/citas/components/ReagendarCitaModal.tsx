'use client';

import { useState } from "react";
import { supabase } from '@/lib/supabaseClient';

interface Props {
  cita: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function ReagendarCitaModal({ cita, onClose, onSaved }: Props) {
  const [nuevaFecha, setNuevaFecha] = useState('');

  const guardar = async () => {
    if (!nuevaFecha) return alert("Selecciona fecha y hora");

    // update cita
    const { error } = await supabase
      .from('citas')
      .update({ fecha: nuevaFecha, estado: 'reprogramada' })
      .eq('id', cita.id);

    // historial
    await supabase.from('citas_historial').insert({
      cita_id: cita.id,
      estado: 'reprogramada',
      descripcion: `Cita reagendada al ${nuevaFecha}`,
    });

    if (error) {
      alert("Error reagendando la cita");
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[350px] shadow-lg">

        <h2 className="text-lg font-semibold mb-4 text-blue-600">
          Reagendar cita
        </h2>

        <input
          type="datetime-local"
          className="border w-full rounded-lg p-2 mb-4"
          value={nuevaFecha}
          onChange={(e) => setNuevaFecha(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={guardar}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg"
          >
            Guardar
          </button>

          <button
            onClick={onClose}
            className="flex-1 bg-slate-200 py-2 rounded-lg"
          >
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
