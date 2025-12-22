'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { X, ZoomIn, Trash2 } from 'lucide-react';

interface ImageRow {
  id: string | number;
  paciente_id: string;
  consulta_id?: string | null;
  url: string;
  fecha: string;
}

interface ImageGalleryProps {
  pacienteId: string;
}

export default function ImageGallery({ pacienteId }: ImageGalleryProps) {
  const [imagenes, setImagenes] = useState<ImageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagenSeleccionada, setImagenSeleccionada] = useState<ImageRow | null>(null);

  async function cargarImagenes() {
    setLoading(true);

    const { data, error } = await supabase
      .from('imagenes')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });

    if (error) {
      console.error(error);
      setImagenes([]);
    } else {
      setImagenes((data || []) as ImageRow[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (!pacienteId) return;
    void cargarImagenes();
  }, [pacienteId]);

  async function eliminarImagen(img: ImageRow) {
    const confirmar = confirm('¿Eliminar esta imagen del expediente?');
    if (!confirmar) return;

    await supabase.from('imagenes').delete().eq('id', img.id);

    try {
      const url = new URL(img.url);
      const parts = url.pathname.split('/object/public/radiografias/');
      if (parts.length === 2) {
        const filePath = parts[1];
        await supabase.storage.from('radiografias').remove([filePath]);
      }
    } catch (e) {
      console.warn('Error eliminando del bucket');
    }

    setImagenes((prev) => prev.filter((i) => i.id !== img.id));
    if (imagenSeleccionada?.id === img.id) {
      setImagenSeleccionada(null);
    }
  }

  return (
    <div className="space-y-3">
      {loading ? (
        <p className="text-sm text-slate-500">Cargando imágenes...</p>
      ) : imagenes.length === 0 ? (
        <p className="text-sm text-slate-500 italic">
          Aún no hay radiografías registradas para este paciente.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {imagenes.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50"
            >
              {/* Etiqueta Inicial */}
              {img.consulta_id == null && (
                <span className="absolute top-1 left-1 bg-cyan-600 text-white text-[10px] px-2 py-[2px] rounded">
                  Inicial
                </span>
              )}

              <img
                src={img.url}
                alt="Radiografía"
                className="w-full h-32 md:h-40 object-cover cursor-zoom-in group-hover:brightness-110 transition"
                onClick={() => setImagenSeleccionada(img)}
              />

              {/* FECHA */}
              <p className="text-[11px] text-center text-slate-600 pb-1">
                {new Date(img.fecha).toLocaleDateString('es-MX')}
              </p>

              <button
                onClick={() => eliminarImagen(img)}
                className="absolute top-2 right-2 inline-flex items-center justify-center
                bg-red-600/90 text-white rounded-full w-7 h-7 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {imagenSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="relative bg-slate-900 rounded-2xl max-w-4xl w-full overflow-hidden">
            <button
              onClick={() => setImagenSeleccionada(null)}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex flex-col md:flex-row">
              <div className="flex-1 bg-black flex items-center justify-center max-h-[80vh]">
                <img
                  src={imagenSeleccionada.url}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>

              <div className="w-full md:w-64 bg-slate-900/90 text-slate-100 p-4 space-y-2 text-xs">
                <p>
                  <b>Fecha:</b>{' '}
                  {new Date(imagenSeleccionada.fecha).toLocaleDateString('es-MX')}
                </p>

                <p className="text-[11px] text-slate-400">
                  ID Paciente:{' '}
                  <span className="font-mono text-[10px]">
                    {imagenSeleccionada.paciente_id}
                  </span>
                </p>

                <button
                  onClick={() => eliminarImagen(imagenSeleccionada)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-1.5 rounded-lg text-[11px]"
                >
                  Eliminar imagen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
