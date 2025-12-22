'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

export interface SoftTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (row: any) => React.ReactNode;
}

interface SoftTableProps {
  columns: SoftTableColumn[];
  data: any[];
  emptyMessage?: string;
  onOpenExpediente?: (row: any) => void;
}

export default function SoftTable({
  columns,
  data,
  emptyMessage = 'No hay registros para mostrar.',
  onOpenExpediente,
}: SoftTableProps) {
  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-slate-100 bg-white/95 shadow-[0_18px_55px_rgba(15,23,42,0.10)] backdrop-blur-xl">
      {/* Barrita superior de color */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-sky-500 to-teal-400" />

      <div className="w-full overflow-x-auto pt-1">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/95">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-xs font-semibold tracking-wide text-slate-500 uppercase ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}

              {onOpenExpediente && (
                <th className="px-6 py-4 w-32 text-center text-xs font-semibold uppercase text-slate-500">
                  Expediente
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (onOpenExpediente ? 1 : 0)}
                  className="px-6 py-10 text-center text-sm text-slate-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {data.map((row, idx) => (
              <motion.tr
                key={row.id ?? idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="border-t border-slate-100/80 bg-white/70 odd:bg-slate-50/40 hover:bg-sky-50/80 transition-all"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 text-sm text-slate-700 ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}

                {onOpenExpediente && (
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => onOpenExpediente(row)}
                      className="mx-auto flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-100 to-sky-200 px-4 py-2 text-sm font-medium text-sky-700 shadow-sm transition-all hover:from-sky-200 hover:to-sky-300 hover:shadow"
                    >
                      <FileText size={18} />
                      Ver
                    </button>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
