'use client';

import { CheckCircle, XCircle, Calendar } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCancelar: () => void;
  onReagendar: () => void;
}

export default function AccionesCitaModal({ onClose, onCancelar, onReagendar }: Props) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[350px] shadow-lg">

        <h2 className="text-lg font-semibold mb-4">
          ¿Qué deseas hacer con esta cita?
        </h2>

        <button
          onClick={onReagendar}
          className="w-full px-4 py-2 flex items-center gap-2 border rounded-lg hover:bg-slate-100 mb-2"
        >
          <Calendar size={18} className='text-blue-600'/>
          Reagendar cita
        </button>

        <button
          onClick={onCancelar}
          className="w-full px-4 py-2 flex items-center gap-2 border rounded-lg hover:bg-slate-100 mb-2"
        >
          <XCircle size={18} className='text-red-600'/>
          Cancelar cita
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full py-2 rounded-lg bg-slate-200"
        >
          Cerrar
        </button>

      </div>
    </div>
  );
}
