'use client';

import React from 'react';
import { motion } from 'framer-motion';

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
}

export default function SoftTable({
  columns,
  data,
  emptyMessage = 'No hay registros para mostrar.',
}: SoftTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-slate-100 bg-white/95 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="w-full overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/90">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 text-xs font-semibold tracking-wide text-slate-500 ${
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
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-sm text-slate-400"
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
                transition={{ delay: idx * 0.02 }}
                className="border-t border-slate-100/80 bg-white/80 hover:bg-cyan-50/60 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-3 text-sm text-slate-700 ${
                      col.align === 'center'
                        ? 'text-center'
                        : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
