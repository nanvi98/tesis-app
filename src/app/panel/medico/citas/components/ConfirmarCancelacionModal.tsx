'use client';

import { XCircle, CheckCircle, X } from 'lucide-react';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmarCancelacionModal({
  visible,
  onClose,
  onConfirm,
}: Props) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-[340px]">

        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <XCircle className="text-red-500" />
          Cancelar cita
        </h2>

        <p className="text-slate-600 mb-6">
          ¿Seguro que deseas cancelar esta cita?
        </p>

        <div className="flex justify-end gap-3">
          <button
            className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-100"
            onClick={onClose}
          >
            Cerrar
          </button>

          <button
            className="px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 flex items-center gap-2"
            onClick={onConfirm}
          >
            <CheckCircle size={18}/>
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
