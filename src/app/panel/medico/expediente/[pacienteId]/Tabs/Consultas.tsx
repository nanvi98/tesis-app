'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from "next/link";
import ImageGallery from "../components/ImageGallery";
import EditarConsultaModal from "../components/EditarConsultaModal";
import {
  Calendar,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  PlusCircle
} from 'lucide-react';

interface Consulta {
  id: string;
  fecha: string;
  motivo: string | null;
  diagnostico: string | null;
  notas: string | null;

  radiografia?: string | null;
  imagen_procesada?: string | null;
  imagen_etiquetada?: string | null;

  actividadfisica?: string | null;
  resultadoia?: string | null;
  estudios?: string | null;

  fuma?: boolean | null;
  alcohol?: boolean | null;
  fracturas?: boolean | null;
  lugarfractura?: string | null;

  familiaresosteoporosis?: boolean | null;
  quienesosteoporosis?: string | null;

  familiaresosteoartritis?: boolean | null;
  quienesosteoartritis?: string | null;

  medicamentos?: boolean | null;
  cualesmedicamentos?: string | null;

  medico_nombre?: string | null;
  medico_correo?: string | null;
}

export default function Consultas({ pacienteId }: { pacienteId: string }) {

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [editConsulta, setEditConsulta] = useState<any>(null);

  // -----------------------------------------------------
  // 🔍 ESTADOS DE ZOOM PARA CADA IMAGEN (3 independientes)
  // -----------------------------------------------------
  const [zoomRad, setZoomRad] = useState({ visible: false, position: "center", size: "200%" });
  const [zoomProc, setZoomProc] = useState({ visible: false, position: "center", size: "200%" });
  const [zoomEtiq, setZoomEtiq] = useState({ visible: false, position: "center", size: "200%" });

  // Handler reutilizable para hover-zoom
  const createZoomHandlers = (setZoom: any) => ({
    onMove: (e: any) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoom({ visible: true, position: `${x}% ${y}%`, size: "200%" });
    },
    onLeave: () => setZoom((z: any) => ({ ...z, visible: false }))
  });

  const radHandlers = createZoomHandlers(setZoomRad);
  const procHandlers = createZoomHandlers(setZoomProc);
  const etiqHandlers = createZoomHandlers(setZoomEtiq);

  async function cargar() {
    const { data } = await supabase
      .from('consultas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false });

    if (data) setConsultas(data as Consulta[]);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function eliminarConsulta(id: string) {
    const ok = confirm("¿Eliminar la consulta?");
    if (!ok) return;

    const { error } = await supabase
      .from("consultas")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error eliminando");
      return;
    }

    alert("Consulta eliminada ✔");
    cargar();
  }

  function puedeEditar(fecha: string) {
    const fechaConsulta = new Date(fecha);
    const limite = 24 * 60 * 60 * 1000;
    return Date.now() - fechaConsulta.getTime() < limite;
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800">
          <Calendar className="w-5 h-5 text-cyan-600" />
          Historial de consultas
        </h2>

        {typeof window !== "undefined" &&
          window.location.pathname.startsWith("/panel/medico") && (
            <Link
              href={`/panel/medico/expediente/${pacienteId}/nueva-consulta`}
              className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700
                text-white text-sm font-medium rounded-xl px-4 py-2 shadow transition"
            >
              <PlusCircle className="w-4 h-4" />
              Nueva consulta
            </Link>
          )}
      </div>

      {/* IMÁGENES GENERALES */}
      <div className="bg-white rounded-2xl shadow border border-slate-200 p-4">
        <ImageGallery pacienteId={pacienteId} />
      </div>

      {consultas.length === 0 && (
        <p className="text-sm text-slate-500 italic pt-4">
          Aún no hay consultas registradas.
        </p>
      )}

      {/* TIMELINE */}
      <div className="relative space-y-6">
        <div className="absolute left-4 top-0 w-1 bg-slate-200 rounded-full h-full" />

        {consultas.map((c) => {
          const isOpen = open[c.id];
          const editable = puedeEditar(c.fecha);

          return (
            <div key={c.id} className="relative pl-10">

              <div className="absolute left-0 top-2">
                <div className="w-4 h-4 bg-cyan-600 rounded-full border-2 border-white shadow" />
              </div>

              <div className="bg-white rounded-2xl shadow border border-slate-100 p-5 space-y-2">

                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Calendar size={16} className="text-cyan-600" />
                  {new Date(c.fecha).toLocaleDateString('es-MX')}
                </p>

                <div className="text-sm text-slate-800">
                  {c.diagnostico && <p><b>Diagnóstico:</b> {c.diagnostico}</p>}
                  {c.motivo && <p><b>Motivo:</b> {c.motivo}</p>}
                </div>

                {/* IMÁGENES CON ZOOM */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">

                  {/* Radiografía */}
                  {c.radiografia && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Radiografía</p>

                      <div
                        onMouseMove={radHandlers.onMove}
                        onMouseLeave={radHandlers.onLeave}
                        className="w-full h-40 rounded-xl border shadow-inner bg-center bg-no-repeat bg-contain"
                        style={{
                          backgroundImage: `url(${c.radiografia})`,
                          backgroundPosition: zoomRad.visible ? zoomRad.position : "center",
                          backgroundSize: zoomRad.visible ? zoomRad.size : "contain",
                        }}
                      />
                    </div>
                  )}

                  {/* Procesada */}
                  {c.imagen_procesada && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Procesada</p>

                      <div
                        onMouseMove={procHandlers.onMove}
                        onMouseLeave={procHandlers.onLeave}
                        className="w-full h-40 rounded-xl border shadow-inner bg-center bg-no-repeat bg-contain"
                        style={{
                          backgroundImage: `url(${c.imagen_procesada})`,
                          backgroundPosition: zoomProc.visible ? zoomProc.position : "center",
                          backgroundSize: zoomProc.visible ? zoomProc.size : "contain",
                        }}
                      />
                    </div>
                  )}

                  {/* Etiquetada */}
                  {c.imagen_etiquetada && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Etiquetada</p>

                      <div
                        onMouseMove={etiqHandlers.onMove}
                        onMouseLeave={etiqHandlers.onLeave}
                        className="w-full h-40 rounded-xl border shadow-inner bg-center bg-no-repeat bg-contain"
                        style={{
                          backgroundImage: `url(${c.imagen_etiquetada})`,
                          backgroundPosition: zoomEtiq.visible ? zoomEtiq.position : "center",
                          backgroundSize: zoomEtiq.visible ? zoomEtiq.size : "contain",
                        }}
                      />
                    </div>
                  )}

                </div>

                {/* BOTONES */}
                {editable ? (
                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-xs px-2 py-1 rounded bg-yellow-500 text-white"
                      onClick={() => setEditConsulta(c)}
                    >
                      Editar
                    </button>

                    <button
                      className="text-xs px-2 py-1 rounded bg-red-600 text-white"
                      onClick={() => eliminarConsulta(c.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-2 italic">
                    Consulta bloqueada para cambios
                  </p>
                )}

                <button
                  onClick={() =>
                    setOpen((prev) => ({ ...prev, [c.id]: !isOpen }))
                  }
                  className="text-sm text-cyan-700 font-medium inline-flex items-center gap-1 mt-1"
                >
                  {isOpen ? (
                    <>Ocultar detalles <ChevronUp size={16} /></>
                  ) : (
                    <>Ver detalles <ChevronDown size={16} /></>
                  )}
                </button>

                {isOpen && (
                  <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-700 border-t border-slate-200">

                    <Detail label="Notas" value={c.notas} />
                    <Detail label="Actividad física" value={c.actividadfisica} />
                    <Detail label="Estudios" value={c.estudios} />
                    <Detail label="Resultado IA" value={c.resultadoia} />

                    <Bool label="Fuma" value={c.fuma} />
                    <Bool label="Alcohol" value={c.alcohol} />
                    <Bool label="Fracturas previas" value={c.fracturas} />

                    <Detail label="Lugar de fractura" value={c.lugarfractura} />

                    <Bool label="Fam. osteoporosis" value={c.familiaresosteoporosis} />
                    <Detail label="Quiénes" value={c.quienesosteoporosis} />

                    <Bool label="Fam. osteoartritis" value={c.familiaresosteoartritis} />
                    <Detail label="Quiénes" value={c.quienesosteoartritis} />

                    <Bool label="Medicamentos" value={c.medicamentos} />
                    <Detail label="Cuáles medicamentos" value={c.cualesmedicamentos} />

                    <div className="md:col-span-2 pt-2 flex items-center gap-2 text-slate-600">
                      <Stethoscope className="w-4 h-4 text-emerald-600" />
                      {c.medico_nombre} — {c.medico_correo}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {editConsulta && (
        <EditarConsultaModal
          consulta={editConsulta}
          onClose={() => setEditConsulta(null)}
          onSave={cargar}
        />
      )}
    </div>
  );
}

/* COMPONENTES EXTRA */
function Detail({ label, value }: any) {
  if (!value) return null;
  return <p><b>{label}:</b> {value}</p>;
}

function Bool({ label, value }: any) {
  if (value === null || value === undefined) return null;
  return <p><b>{label}:</b> {value ? 'Sí' : 'No'}</p>;
}
