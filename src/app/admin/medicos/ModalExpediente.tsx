'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, FileText, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

// IMPORTACIÓN DEL TIPO CORRECTO DESDE PAGE
import type { MedicoStatus, MedicoProfile } from './page';

export interface Medico {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  telefono?: string | null;
  sexo?: string | null;
  especialidad?: string | null;
  titulo?: string | null;
  status?: MedicoStatus | null | undefined;
  approved?: boolean | null;
  cedula?: string | null;
  cedula_status?: 'pendiente' | 'valida' | 'rechazada' | null;
  created_at?: string | null;
  notas_admin?: string | null;
}

interface ModalExpedienteProps {
  open: boolean;
  medico: Medico | null;
  onClose: () => void;
  onUpdated?: (updated: Partial<Medico> & { id: string }) => void;
}

type TabKey = 'general' | 'documento';

export default function ModalExpediente({
  open,
  medico,
  onClose,
  onUpdated,
}: ModalExpedienteProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [notas, setNotas] = useState('');
  const [savingNotas, setSavingNotas] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (medico?.notas_admin) {
      setNotas(medico.notas_admin);
    } else {
      setNotas('');
    }
    setMensaje(null);
    setActiveTab('general');
  }, [medico, open]);

  if (!open || !medico) return null;

  const nombreCompleto = `${medico.titulo ?? ''} ${medico.nombre ?? ''} ${
    medico.apellido ?? ''
  }`
    .replace(/\s+/g, ' ')
    .trim();

  const estadoMedico: MedicoStatus =
    medico.cedula_status === 'valida'
      ? (medico.status ?? 'activo')
      : 'inactivo';

  const estadoCedula =
    medico.cedula_status === 'valida'
      ? 'valida'
      : medico.cedula_status === 'rechazada'
      ? 'rechazada'
      : 'pendiente';

  const badgeEstadoMedicoClasses =
    estadoMedico === 'activo'
      ? 'bg-emerald-100 text-emerald-700'
      : estadoMedico === 'bloqueado'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-slate-100 text-slate-600';

  const badgeEstadoCedulaClasses =
    estadoCedula === 'valida'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-amber-100 text-amber-700';

  const actualizarEstadoMedico = async (nuevo: MedicoStatus) => {
    if (!medico) return;
    setUpdatingEstado(true);
    setMensaje(null);

    const { error } = await supabase
      .from('profiles')
      .update({ status: nuevo })
      .eq('id', medico.id);

    if (error) {
      console.error(error);
      setMensaje('⚠️ No se pudo actualizar el estado del médico.');
    } else {
      onUpdated?.({ id: medico.id, status: nuevo });
      onClose();
      setMensaje('✓ Estado del médico actualizado.');
    }

    setUpdatingEstado(false);
  };

  const actualizarEstadoCedula = async (aprobada: boolean) => {
    if (!medico) return;
    setUpdatingEstado(true);

    const nuevoStatus: MedicoStatus = aprobada ? 'activo' : 'inactivo';
    const nuevoCedula: 'valida' | 'pendiente' = aprobada ? 'valida' : 'pendiente';

    const res = await fetch("/api/updateCedula", {
      method: "POST",
      headers: {
    "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: medico.id,
        approved: aprobada,
        cedula_status: nuevoCedula,
        status: nuevoStatus,
      }),
    });

    const text = await res.clone().text();

    if (!res.ok) {
      console.error("ERROR:",text);
      setMensaje("⚠️ No se pudo actualizar");
      setUpdatingEstado(false);
      return;
    }

    // Avisamos al padre
    onUpdated?.({
      id: medico.id,
      cedula_status: nuevoCedula,
      status: nuevoStatus,
      approved: aprobada,
    });
    onClose();

    setMensaje('✓ Estado actualizado.');
    setUpdatingEstado(false);
  };

  const handleGuardarNotas = async () => {
    if (!medico) return;
    setSavingNotas(true);
    setMensaje(null);

    const { error } = await supabase
      .from('profiles')
      .update({ notas_admin: notas })
      .eq('id', medico.id);

    if (error) {
      console.error(error);
      setMensaje(
        '⚠️ No se pudieron guardar las notas (revisa que exista la columna notas_admin).'
      );
    } else {
      setMensaje('✅ Notas guardadas correctamente.');
      onUpdated?.({ id: medico.id, notas_admin: notas });
      onClose();
    }

    setSavingNotas(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Panel principal */}
          <motion.div
            className="relative flex h-[85vh] w-[90vw] max-w-6xl overflow-hidden rounded-3xl bg-slate-50 shadow-[0_30px_90px_rgba(15,23,42,0.45)]"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 210, damping: 20 }}
          >
            {/* IZQUIERDA */}
            <div className="flex w-80 flex-col bg-gradient-to-b from-sky-500 via-sky-600 to-sky-700 px-7 py-8 text-white">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-100/90">
                  Expediente médico
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full bg-sky-600/70 p-1 hover:bg-sky-700"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Perfil */}
              <div className="mt-6 flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-50/95 text-sky-600 shadow-lg">
                  <span className="text-3xl font-semibold">
                    {(medico.nombre ?? 'M')[0]}
                  </span>
                </div>
                <p className="mt-4 text-sm uppercase tracking-wide text-sky-100/80">
                  Médico
                </p>
                <h2 className="mt-1 text-xl font-semibold leading-snug">
                  {nombreCompleto || 'Sin nombre'}
                </h2>
                <p className="mt-1 text-xs text-sky-100/80">
                  {medico.especialidad || 'Sin especialidad'}
                </p>
              </div>

              {/* Info */}
              <div className="mt-6 space-y-2 text-sm">
                <p className="text-sky-100/80">
                  <span className="font-semibold">Email:</span> {medico.email}
                </p>
                <p className="text-sky-100/80">
                  <span className="font-semibold">Teléfono:</span>{' '}
                  {medico.telefono || '—'}
                </p>
                <p className="text-sky-100/80">
                  <span className="font-semibold">Cédula:</span>{' '}
                  {medico.cedula || '—'}
                </p>
              </div>

              <div className="mt-auto pt-6 text-[10px] text-sky-100/70">
                <p>
                  ID: <span className="font-mono">{medico.id}</span>
                </p>
                {medico.created_at && (
                  <p className="mt-1">
                    Registro:{' '}
                    {new Date(medico.created_at).toLocaleString('es-MX')}
                  </p>
                )}
              </div>
            </div>

            {/* DERECHA */}
            <div className="flex flex-1 flex-col bg-slate-50/95">
              {/* Tabs + Badges */}
              <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50/80 px-8 pt-6 pb-3">
                <div className="flex gap-3 rounded-full bg-slate-100/80 p-1">
                  <button
                    onClick={() => setActiveTab('general')}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      activeTab === 'general'
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    General
                  </button>
                  <button
                    onClick={() => setActiveTab('documento')}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      activeTab === 'documento'
                        ? 'bg-white text-sky-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Documento
                  </button>
                </div>

                <div className="flex gap-2 text-xs font-semibold">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${badgeEstadoMedicoClasses}`}
                  >
                    <ShieldCheck size={14} />
                    Médico {estadoMedico}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 ${badgeEstadoCedulaClasses}`}
                  >
                    <FileText size={14} />
                    Cédula {estadoCedula}
                  </span>
                </div>
              </div>

              {/* Contenido scroll */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {activeTab === 'general' && (
                  <>
                    {/* Datos personales */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <section className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-800">
                          Datos personales
                        </h3>
                        <dl className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Nombre:</dt>
                            <dd className="font-medium">
                              {nombreCompleto || '—'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Sexo:</dt>
                            <dd className="font-medium">
                              {medico.sexo || '—'}
                            </dd>
                          </div>
                        </dl>
                      </section>

                      {/* Profesionales */}
                      <section className="rounded-2xl bg-white p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-slate-800">
                          Datos profesionales
                        </h3>
                        <dl className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Especialidad:</dt>
                            <dd className="font-medium">
                              {medico.especialidad || '—'}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Correo:</dt>
                            <dd className="flex items-center gap-1 font-medium text-sky-600">
                              <Mail size={14} />
                              {medico.email}
                            </dd>
                          </div>
                        </dl>
                      </section>
                    </div>

                    {/* Notas */}
                    <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Notas internas
                      </h3>
                      <textarea
                        className="mt-2 h-32 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-200"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                      />
                      <div className="mt-3 flex justify-end gap-3 text-xs text-slate-500">
                        {mensaje && <span>{mensaje}</span>}
                        <button
                          onClick={handleGuardarNotas}
                          disabled={savingNotas}
                          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-60"
                        >
                          {savingNotas ? 'Guardando…' : 'Guardar'}
                        </button>
                      </div>
                    </section>

                    {/* Estado médico */}
                    <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Cambiar estado del médico
                      </h3>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => actualizarEstadoMedico('activo')}
                          disabled={updatingEstado}
                          className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:opacity-60"
                        >
                          Activo
                        </button>
                        <button
                          onClick={() => actualizarEstadoMedico('inactivo')}
                          disabled={updatingEstado}
                          className="rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-100 disabled:opacity-60"
                        >
                          Inactivo
                        </button>
                        <button
                          onClick={() => actualizarEstadoMedico('bloqueado')}
                          disabled={updatingEstado}
                          className="rounded-full bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm hover:bg-rose-100 disabled:opacity-60"
                        >
                          Bloquear
                        </button>
                      </div>
                    </section>
                  </>
                )}

                {activeTab === 'documento' && (
                  <section className="rounded-2xl bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Documento de cédula
                    </h3>

                    <p className="mt-3 text-sm">
                      Cédula: <b>{medico.cedula || 'No registrada'}</b>
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {medico.cedula_status === 'valida' ? (
                        <button
                          onClick={() => actualizarEstadoCedula(false)}
                          disabled={updatingEstado}
                          className="rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-100 disabled:opacity-60"
                        >
                          Marcar como pendiente
                        </button>
                      ) : (
                        <button
                          onClick={() => actualizarEstadoCedula(true)}
                          disabled={updatingEstado}
                          className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-100 disabled:opacity-60"
                        >
                          Marcar como válida
                        </button>
                      )}
                    </div>

                    {mensaje && (
                      <p className="mt-3 text-xs text-slate-500">{mensaje}</p>
                    )}
                  </section>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-8 py-4">
                <button
                  onClick={onClose}
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-600 shadow hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-slate-50 shadow hover:bg-slate-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
