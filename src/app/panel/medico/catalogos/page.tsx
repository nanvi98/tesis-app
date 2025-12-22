'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Beaker,
  Pill,
  Activity,
  MapPinned,
} from 'lucide-react';

import CatalogCard from './CatalogCard';
import CatalogModal from './CatalogModal';

const CATALOGS = [
  {
    key: 'especialidades',
    title: 'Especialidades médicas',
    description: 'Traumatología, geriatría, reumatología, etc.',
    tipo: 'catalog_especialidad'
  },
  {
    key: 'estudios',
    title: 'Tipos de estudio',
    description: 'Rayos X, DEXA, análisis complementarios, etc.',
    tipo: 'catalog_tipo_estudio'
  },
  {
    key: 'medicamentos',
    title: 'Medicamentos',
    description: 'Fármacos frecuentes en tratamiento y diagnóstico.',
    tipo: 'catalog_medicamento'
  },
  {
    key: 'signos',
    title: 'Signos y síntomas',
    description: 'Dolor, inflamación, rigidez, etc.',
    tipo: 'catalog_signo_sintoma'
  },
  {
    key: 'ubicaciones',
    title: 'Ubicaciones',
    description: 'Hospitales y centros de atención.',
    tipo: 'ubicacion'
  },
];

const getIcon = (key: string) => {
  switch (key) {
    case 'especialidades':
      return <Stethoscope size={28} />;
    case 'estudios':
      return <Beaker size={28} />;
    case 'medicamentos':
      return <Pill size={28} />;
    case 'signos':
      return <Activity size={28} />;
    case 'ubicaciones':
      return <MapPinned size={28} />;
    default:
      return <Stethoscope size={28} />;
  }
};

export default function CatalogosPage() {
  const [selected, setSelected] = useState<any | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 pb-20">

      <div className="w-full h-40 bg-gradient-to-r from-teal-300/30 via-cyan-300/30 to-sky-300/30 backdrop-blur-md shadow-inner rounded-b-[40px] flex items-center">
        <div className="mx-auto max-w-[1500px] px-10">
          <h1 className="text-3xl font-semibold text-slate-800 drop-shadow-sm">
            Catálogos de referencia
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Consulta rápida de listas médicas.
          </p>
        </div>
      </div>

      <div className="-mt-10 mx-auto max-w-[1500px] rounded-3xl bg-white/40 backdrop-blur-xl px-10 py-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
        >
          {CATALOGS.map((cat) => (
            <CatalogCard
              key={cat.key}
              title={cat.title}
              description={cat.description}
              icon={getIcon(cat.key)}
              onClick={() => setSelected(cat)}
            />
          ))}
        </motion.div>
      </div>

      {/* ❗AQUÍ VA EL MODAL */}
      {selected && (
        <CatalogModal
          open={!!selected}
          onClose={() => setSelected(null)}
          config={selected}
        />
      )}
    </div>
  );
}
