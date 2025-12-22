'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export interface CatalogConfig {
  key: string;
  title: string;
  description: string;
  tipo: string;
  showCosto?: boolean;
}

interface CatalogModalProps {
  open: boolean;
  onClose: () => void;
  config: CatalogConfig;
}

interface CatalogRow {
  id: string;
  nombre: string;
  descripcion?: string | null;
  costo?: number | null;
}

export default function CatalogModal({
  open,
  onClose,
  config,
}: CatalogModalProps) {
  const [items, setItems] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('catalogos')
        .select('*')
        .eq('tipo', config.tipo)
        .order('nombre', { ascending: true });

      if (!error && data) {
        const mapped: CatalogRow[] = data.map((r: any) => ({
          id: r.id,
          nombre: r.nombre,
          descripcion: r.descripcion,
          costo: r.costo,
        }));
        setItems(mapped);
      }

      setLoading(false);
    };

    load();
  }, [open, config.tipo]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="
            fixed inset-0 z-[100]
            bg-slate-900/40 backdrop-blur-sm
            flex items-center justify-center
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* CONTENEDOR PRINCIPAL */}
          <motion.div
            initial={{ scale: 0.94, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 15, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="
              w-[92%] max-w-3xl max-h-[90vh]
              rounded-3xl bg-white/85 backdrop-blur-xl
              shadow-[0_20px_60px_rgba(0,0,0,0.25)]
              border border-slate-200
              overflow-hidden flex flex-col
            "
          >
            {/* HEADER */}
            <div
              className="
                bg-gradient-to-r
                from-teal-400 via-cyan-500 to-sky-500
                px-6 py-4 text-white flex justify-between items-center
              "
            >
              <div>
                <h2 className="text-lg font-semibold tracking-wide">
                  {config.title}
                </h2>
                <p className="text-xs text-white/80">{config.description}</p>
              </div>

              <button
                onClick={onClose}
                className="
                  p-2 rounded-full bg-white/20 hover:bg-white/30
                  transition
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">

              {loading && (
                <p className="text-center text-slate-400 py-6">
                  Cargando...
                </p>
              )}

              {!loading && items.length === 0 && (
                <p className="text-center text-slate-400 py-6">
                  No hay elementos en este catálogo.
                </p>
              )}

              {!loading &&
                items.map((item) => (
                  <div
                    key={item.id}
                    className="
                      rounded-xl bg-white shadow-sm border border-slate-200
                      p-4 hover:shadow-md transition
                    "
                  >
                    <p className="font-medium text-slate-800">
                      {item.nombre}
                    </p>

                    {item.descripcion && (
                      <p className="text-sm text-slate-600 leading-snug mt-1">
                        {item.descripcion}
                      </p>
                    )}

                    {config.showCosto && item.costo !== null && (
                      <p className="text-sm font-semibold text-cyan-700 mt-1">
                        ${item.costo}
                      </p>
                    )}
                  </div>
                ))}
            </div>

            {/* FOOTER */}
            <div className="border-t border-slate-200 bg-white/60 px-6 py-3 flex justify-end">
              <button
                onClick={onClose}
                className="
                  rounded-full bg-slate-100 px-5 py-1.5 text-xs font-semibold
                  text-slate-600 shadow-sm hover:bg-slate-200
                "
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
