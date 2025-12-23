'use client';

import PatientsForm from '../../components/PatientsForm';
import { useMedico } from '@/context/MedicoContext';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

export default function AgregarPacientePage() {
  const { medico } = useMedico();

  if (!medico) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Cargando datos del médico...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      {/* CONTENEDOR PARA QUE QUEDE ALINEADO COMO TODO TU PANEL */}
      <div className="px-8 py-6 md:px-12 md:py-8 w-full">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)]
            p-10 mx-auto w-full max-w-5xl border border-slate-100/60"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-cyan-500 p-3 rounded-2xl">
              <UserPlus size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Registrar nuevo paciente
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Llena el expediente inicial del paciente.
              </p>
            </div>
          </div>

          {/* Aquí se renderiza el FORMULARIO COMPLETO */}
          <PatientsForm onSave={() => {}} />
        </motion.div>
      </div>
    </div>
  );
}
