'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  ClipboardList,
  Beaker,
  MapPinned,
  Pill,
  UserCog,
  Activity,
  FilePlus2,
} from 'lucide-react';
import CatalogCard from './CatalogCard';
import CatalogModal, { CatalogConfig, CatalogKey } from './CatalogModal';

const CATALOGS: CatalogConfig[] = [
  {
    key: 'especialidades',
    title: 'Especialidades médicas',
    description: 'Traumatología, geriatría, radiología, reumatología, etc.',
    tipo: 'catalog_especialidad',
  },
  {
    key: 'tiposEstudio',
    title: 'Tipos de estudio',
    description: 'Radiografías, DEXA, análisis complementarios y más.',
    tipo: 'catalog_tipo_estudio',
    showCosto: true,
  },
  {
    key: 'motivos',
    title: 'Motivos de consulta',
    description: 'Dolor de rodilla, control, revisión postoperatoria, etc.',
    tipo: 'catalog_motivo_consulta',
  },
  {
    key: 'ubicaciones',
    title: 'Ubicaciones (Estados y Ciudades)',
    description: 'Gestiona los estados y sus ciudades asociadas.',
    isUbicaciones: true,
  },
  {
    key: 'roles',
    title: 'Roles y perfiles',
    description: 'Roles adicionales o etiquetas internas.',
    tipo: 'catalog_rol',
  },
  {
    key: 'medicamentos',
    title: 'Medicamentos frecuentes',
    description: 'Medicamentos de uso común en los reportes clínicos.',
    tipo: 'catalog_medicamento',
    showCosto: true,
  },
  {
    key: 'signos',
    title: 'Signos y síntomas',
    description: 'Dolor, inflamación, rigidez, pérdida de fuerza, etc.',
    tipo: 'catalog_signo_sintoma',
  },
  {
    key: 'protocolos',
    title: 'Protocolos / Indicaciones',
    description: 'Indicaciones estándar posteriores al diagnóstico.',
    tipo: 'catalog_protocolo',
  },
];

const catalogIcon = (key: CatalogKey) => {
  switch (key) {
    case 'especialidades':
      return <Stethoscope size={28} />;
    case 'tiposEstudio':
      return <Beaker size={28} />;
    case 'motivos':
      return <ClipboardList size={28} />;
    case 'ubicaciones':
      return <MapPinned size={28} />;
    case 'roles':
      return <UserCog size={28} />;
    case 'medicamentos':
      return <Pill size={28} />;
    case 'signos':
      return <Activity size={28} />;
    case 'protocolos':
      return <FilePlus2 size={28} />;
    default:
      return <ClipboardList size={28} />;
  }
};

export default function CatalogosPage() {
  const [selected, setSelected] = useState<CatalogConfig | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 pb-20">

      {/* HERO SUAVE */}
      <div className="w-full h-40 bg-gradient-to-r from-teal-300/30 via-cyan-300/30 to-sky-300/30 backdrop-blur-md shadow-inner rounded-b-[40px] flex items-center">
        <div className="mx-auto max-w-[1500px] px-10">
          <h1 className="text-3xl font-semibold text-slate-800 drop-shadow-sm">
            Catálogos del sistema
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Administra las listas maestras utilizadas en formularios y reportes.
          </p>
        </div>
      </div>

      {/* CONTENEDOR GLASS */}
      <div className="-mt-10 mx-auto max-w-[1500px] rounded-3xl bg-white/40 backdrop-blur-xl px-10 py-12 shadow-[0_20px_50px_rgba(0,0,0,0.15)]">

        {/* ETIQUETA */}
        <div className="inline-flex items-center gap-2 mb-10 rounded-full bg-white/70 backdrop-blur-md px-4 py-1 text-xs font-medium text-slate-700 shadow-sm border border-white/40">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
          Centro de configuración
        </div>

        {/* GRID GLASS */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-8 md:grid-cols-2 xl:grid-cols-3"
        >
          {CATALOGS.map((cat) => (
            <div
              key={cat.key}
              className="rounded-3xl bg-white/50 backdrop-blur-xl border border-white/40 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all p-6 cursor-pointer"
              onClick={() => setSelected(cat)}
            >
              {/* Icono */}
              <div className="w-14 h-14 flex items-center justify-center rounded-full bg-cyan-100/60 text-cyan-600 shadow-inner mb-4">
                {catalogIcon(cat.key)}
              </div>

              {/* Título */}
              <h2 className="font-semibold text-slate-800 text-lg">{cat.title}</h2>

              {/* Descripción */}
              <p className="text-sm text-slate-600 mt-1">{cat.description}</p>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-cyan-700 font-medium">Toca para gestionar</span>
                <span className="px-3 py-1 bg-slate-900 text-white text-xs rounded-full shadow-md">
                  ITEMS
                </span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* MODAL */}
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
