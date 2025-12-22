'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useMedico } from '@/context/MedicoContext';

export default function EditarConsultaModal({ consulta, onClose, onSave }: any) {

  const { medico } = useMedico();

  const [motivo, setMotivo] = useState(consulta.motivo || '');
  const [diagnostico, setDiagnostico] = useState(consulta.diagnostico || '');
  const [notas, setNotas] = useState(consulta.notas || '');

  async function guardar() {

    await supabase
      .from('consultas')
      .update({
        motivo,
        diagnostico,
        notas,
        updated_by: medico.correo,
        last_update: new Date().toISOString()
      })
      .eq('id', consulta.id);

    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white shadow-lg rounded-2xl p-6 w-[400px] space-y-3">

        <h2 className="text-lg font-semibold">Editar consulta</h2>

        <textarea className="w-full border rounded p-2"
          rows={2}
          value={motivo}
          onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo"
        />

        <textarea className="w-full border rounded p-2"
          rows={2}
          value={diagnostico}
          onChange={e => setDiagnostico(e.target.value)}
          placeholder="Diagnóstico"
        />

        <textarea className="w-full border rounded p-2"
          rows={3}
          value={notas}
          onChange={e => setNotas(e.target.value)}
          placeholder="Notas"
        />

        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 bg-slate-300 rounded"
            onClick={onClose}>Cerrar</button>

          <button className="px-3 py-1 bg-cyan-600 text-white rounded"
            onClick={guardar}>
            Guardar
          </button>
        </div>

      </div>
    </div>
  );
}
