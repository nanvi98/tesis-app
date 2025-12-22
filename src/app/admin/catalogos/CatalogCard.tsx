'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface CatalogCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string;
}

export default function CatalogCard({
  title,
  description,
  icon,
  onClick,
  badge,
}: CatalogCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="
        relative w-full text-left outline-none
      "
    >
      {/* CONTENEDOR PRINCIPAL */}
      <div
        className="
          rounded-[28px]
          bg-white/90 backdrop-blur-xl
          border border-slate-200/70
          shadow-[0_10px_35px_rgba(15,23,42,0.08)]
          p-6
          transition-all hover:shadow-[0_14px_45px_rgba(15,23,42,0.12)]
        "
      >
        {/* ICONO + TITLE */}
        <div className="flex items-start gap-4">
          <div
            className="
              flex h-12 w-12 items-center justify-center 
              rounded-2xl
              bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100
              text-cyan-700 shadow-inner
            "
          >
            {icon}
          </div>

          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-500 leading-tight">
              {description}
            </p>
          </div>
        </div>

        {/* ACCIONES INFERIORES */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[12px] font-medium text-cyan-700">
            Toca para gestionar
          </span>

          <span
            className="
              inline-flex items-center justify-center
              rounded-full
              bg-slate-900
              text-[11px] text-white font-semibold
              px-4 py-1
              shadow-sm
              uppercase tracking-wide
            "
          >
            Ítems
          </span>
        </div>

        {/* BADGE SUPERIOR DERECHA */}
        {badge && (
          <span
            className="
              absolute right-4 top-4
              rounded-full
              bg-gradient-to-r from-slate-100 to-sky-100
              px-3 py-1
              text-[11px] font-semibold
              text-slate-600 shadow-sm
            "
          >
            {badge}
          </span>
        )}
      </div>
    </motion.button>
  );
}
