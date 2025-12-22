'use client';

interface Props {
  onConfirm: () => void;
  onClose: () => void;
}

export default function CancelarCitaModal({ onConfirm, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-[350px] shadow-lg">

        <h2 className="text-lg font-semibold mb-4 text-red-600">
          Cancelar cita
        </h2>

        <p className="text-sm mb-4">
          ¿Estás seguro de cancelar esta cita?
        </p>

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2 rounded-lg"
          >
            Sí, Cancelar
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
