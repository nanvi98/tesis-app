'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  UserCheck2,
  UserX2,
  AlertTriangle,
  Search,
} from 'lucide-react';

import LoadingSpinner from '../components/LoadingSpinner';
import SoftTable, { type SoftTableColumn } from './SoftTable';
import ModalExpediente, { type Medico as ModalMedico } from './ModalExpediente';

// ─────────────────────────────
//  Tipos
// ─────────────────────────────

export type MedicoStatus = 'activo' | 'inactivo' | 'bloqueado' | 'pendiente';
export type CedulaStatus = 'pendiente' | 'valida' | 'rechazada' | null;

export interface MedicoProfile {
  id: string;
  nombre: string | null;
  apellido: string | null;
  email: string | null;
  role: 'medico';
  telefono?: string | null;
  sexo?: string | null;
  titulo?: string | null;
  especialidad?: string | null;
  cedula?: string | null;
  status: MedicoStatus | null | undefined;
  cedula_status: CedulaStatus;
  cedula_url?: string | null;
  approved?: boolean | null;
  notas_admin?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

type EstadoFiltro = 'todos' | MedicoStatus;
type CedulaFiltro = 'todas' | CedulaStatus;

// ─────────────────────────────
//  Página principal
// ─────────────────────────────

export default function MedicosPage() {
  const [medicos, setMedicos] = useState<MedicoProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoFiltro>('todos');
  const [cedulaFiltro, setCedulaFiltro] = useState<CedulaFiltro>('todas');
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedMedico, setSelectedMedico] = useState<ModalMedico | null>(null);
  const [showExpediente, setShowExpediente] = useState(false);

  // ─────────────────────────────
  //  Cargar médicos
  // ─────────────────────────────

  const fetchMedicos = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/getAllUsers', { 
        cache: 'no-store',
        next:{revalidate:0}, 
      });
      const text = await res.text();

      let users: any[] = [];
      try {
        users = JSON.parse(text);
      } catch (err) {
        console.error('JSON ERROR:', err);
        console.log('RAW:', text);
      }

      const medicosFiltrados = users.filter((u: any) => u.role === 'medico');
      console.log('NUEVOS DATOS:', medicosFiltrados);
      setMedicos(medicosFiltrados);
    } catch (e) {
      console.error('FETCH ERROR:', e);
      setErrorMsg('Error al cargar médicos.');
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMedicos();
  }, []);

  // ─────────────────────────────
  //  Filtros + búsqueda
  // ─────────────────────────────

  const filteredMedicos = useMemo(() => {
    let list = [...medicos];

    if (estadoFiltro !== 'todos') {
      list = list.filter((m) => m.status === estadoFiltro);
    }

    if (cedulaFiltro !== 'todas') {
      list = list.filter((m) => m.cedula_status === cedulaFiltro);
    }

    if (search.trim() !== '') {
      const s = search.toLowerCase();
      list = list.filter(
        (m) =>
          (m.nombre?.toLowerCase() ?? '').includes(s) ||
          (m.apellido?.toLowerCase() ?? '').includes(s) ||
          (m.email?.toLowerCase() ?? '').includes(s)
      );
    }


    return list;
  }, [medicos, estadoFiltro, cedulaFiltro, search]);

  // ─────────────────────────────
  //  KPIs
  // ─────────────────────────────

  const total = medicos.length;
  const activos = medicos.filter(
    (m) => (m.cedula_status === 'valida' ? m.status : 'inactivo') === 'activo'
  ).length;
  const bloqueados = medicos.filter((m) => m.status === 'bloqueado').length;
  const cedulaPendiente = medicos.filter(
    (m) => m.cedula_status === 'pendiente'
  ).length;

  // ─────────────────────────────
  //  SoftTable – columnas
  // ─────────────────────────────

  const columns: SoftTableColumn[] = [
    {
      key: 'medico',
      label: 'Médico',
      width: '28%',
      render: (row) => {
        const m = row as MedicoProfile;
        const inicial =
          (m.nombre?.[0] ?? m.apellido?.[0] ?? 'M').toUpperCase();
        const nombreCompleto = `${m.titulo ?? ''} ${m.nombre} ${m.apellido}`
          .replace(/\s+/g, ' ')
          .trim();

        return (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-sm font-semibold shadow-sm">
              {inicial}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800">
                {nombreCompleto || 'Sin nombre'}
              </span>
              <span className="text-xs text-slate-500">
                {m.especialidad || 'Sin especialidad'}
              </span>
            </div>
          </div>
        );
      },
    },

    {
      key: 'email',
      label: 'Email',
      width: '24%',
      render: (row) => {
        const m = row as MedicoProfile;
        return (
          <span className="text-sm text-slate-700 truncate">{m.email}</span>
        );
      },
    },

    {
      key: 'status',
      label: 'Estado',
      align: 'center',
      width: '14%',
      render: (row) => {
        const m = row as MedicoProfile;

        // LÓGICA DE NEGOCIO: si la cédula NO es válida, se muestra inactivo
        const statusEfectivo: MedicoStatus =
          m.cedula_status === 'valida' 
          ? (m.status ?? 'inactivo')
          :'inactivo';

        const base =
          'inline-flex min-w-[90px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold';
        const classes =
          statusEfectivo === 'activo'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : statusEfectivo === 'bloqueado'
            ? 'bg-rose-50 text-rose-700 border border-rose-100'
            : 'bg-slate-50 text-slate-600 border border-slate-100';

        return (
          <span className={`${base} ${classes}`}>
            {statusEfectivo.charAt(0).toUpperCase() + statusEfectivo.slice(1)}
          </span>
        );
      },
    },

    {
      key: 'cedula_status',
      label: 'Estado cédula',
      align: 'center',
      width: '15%',
      render: (row) => {
        const m = row as MedicoProfile;
        const estado =
          m.cedula_status === 'valida'
            ? 'Válida'
            : m.cedula_status === 'rechazada'
            ? 'Rechazada'
            : 'Pendiente';

        const base =
          'inline-flex min-w-[110px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold';
        const classes =
          m.cedula_status === 'valida'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            : m.cedula_status === 'rechazada'
            ? 'bg-rose-50 text-rose-700 border border-rose-100'
            : 'bg-amber-50 text-amber-700 border border-amber-100';

        return <span className={`${base} ${classes}`}>{estado}</span>;
      },
    },

    {
      key: 'created_at',
      label: 'Fecha registro',
      align: 'center',
      width: '14%',
      render: (row) => {
        const m = row as MedicoProfile;
        if (!m.created_at)
          return <span className="text-xs text-slate-400">—</span>;

        const fecha = new Date(m.created_at).toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        return (
          <span className="text-xs font-medium text-slate-600">{fecha}</span>
        );
      },
    },

    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      width: '15%',
      render: (row) => {
        const m = row as MedicoProfile;
        return (
          <button
            onClick={() => handleOpenExpediente(m)}
            className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-slate-50 shadow-sm hover:bg-slate-800"
          >
            Ver expediente
          </button>
        );
      },
    },
  ];

  const handleOpenExpediente = (m: MedicoProfile) => {
    const medicoForModal: ModalMedico = {
      id: m.id,
      nombre: m.nombre,
      apellido: m.apellido,
      email: m.email,
      telefono: m.telefono,
      sexo: m.sexo,
      especialidad: m.especialidad,
      titulo: m.titulo,
      status: (m.status ?? 'inactivo') as MedicoStatus,
      approved: m.approved ?? null,
      cedula: m.cedula,
      cedula_status: m.cedula_status,
      created_at: m.created_at ?? null,
      notas_admin: m.notas_admin ?? null,
    };

    setSelectedMedico(medicoForModal);
    setShowExpediente(true);
  };

  const handleCloseExpediente = () => {
    setShowExpediente(false);
    setSelectedMedico(null);
    
  };

  const handleMedicoUpdated = (
    updated: Partial<ModalMedico> & { id: string }
  ) => {
    setMedicos((prev) =>
      prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m))
    );
  };
  // ─────────────────────────────
  //  Render
  // ─────────────────────────────

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 px-6 py-6">
      {/* Halo suave detrás del contenido */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center">
        <div className="mt-6 h-40 w-[720px] rounded-full bg-gradient-to-r from-sky-300/50 via-sky-400/50 to-teal-300/50 blur-3xl opacity-70" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Título y subtítulo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex flex-col gap-1"
        >
          <h1 className="flex items-center gap-2 text-3xl font-semibold text-slate-900">
            <span className="rounded-2xl bg-sky-100 p-2 text-sky-600 shadow-sm">
              <Stethoscope className="h-6 w-6" />
            </span>
            Panel de médicos
          </h1>
          <p className="text-sm text-slate-500">
            Revisa la información, estados y documentación de los médicos
            registrados en la plataforma.
          </p>
        </motion.div>

        {/* KPIs / Tarjetas */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-slate-100/80 bg-white/95 p-4 shadow-[0_14px_40px_rgba(15,23,42,0.10)]"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-sky-400 to-emerald-400" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Total médicos
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-3xl font-semibold text-slate-900">
                {total}
              </span>
              <UserCheck2 className="h-7 w-7 text-sky-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-3xl border border-emerald-100/80 bg-emerald-50/80 p-4 shadow-[0_14px_40px_rgba(16,185,129,0.25)]"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-800/80">
              Activos
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-3xl font-semibold text-emerald-900">
                {activos}
              </span>
              <UserCheck2 className="h-7 w-7 text-emerald-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative overflow-hidden rounded-3xl border border-rose-100/80 bg-rose-50/85 p-4 shadow-[0_14px_40px_rgba(244,63,94,0.20)]"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-rose-400 to-pink-500" />
            <span className="text-xs font-medium uppercase tracking-wide text-rose-800/80">
              Bloqueados
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-3xl font-semibold text-rose-900">
                {bloqueados}
              </span>
              <UserX2 className="h-7 w-7 text-rose-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative overflow-hidden rounded-3xl border border-amber-100/80 bg-amber-50/85 p-4 shadow-[0_14px_40px_rgba(245,158,11,0.25)]"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
            <span className="text-xs font-medium uppercase tracking-wide text-amber-800/80">
              Cédula pendiente
            </span>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-3xl font-semibold text-amber-900">
                {cedulaPendiente}
              </span>
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
          </motion.div>
        </div>

        {/* Filtros + Buscador */}
        <div className="mb-6 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Buscador */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-sky-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, apellido o correo..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-8 py-2 text-sm text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              {/* Estado médico */}
              <div className="flex flex-wrap gap-2">
                {(
                  ['todos', 'pendiente', 'activo', 'inactivo', 'bloqueado'] as EstadoFiltro[]
                ).map((f) => (
                  <button
                    key={f}
                    onClick={() => setEstadoFiltro(f)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                      estadoFiltro === f
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-white text-sky-700 border-sky-100 hover:bg-sky-50'
                    }`}
                  >
                    {f === 'todos'
                      ? 'Todos'
                      : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Estado cédula */}
              <div className="flex flex-wrap gap-2">
                {(
                  ['todas', 'pendiente', 'valida', 'rechazada'] as CedulaFiltro[]
                ).map((f) => (
                  <button
                    key={String(f)}
                    onClick={() => setCedulaFiltro(f)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                      cedulaFiltro === f
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-white text-violet-700 border-violet-100 hover:bg-violet-50'
                    }`}
                  >
                    {f === 'todas'
                      ? 'Todas'
                      : f === null
                      ? 'Null'
                      : String(f).charAt(0).toUpperCase() +
                        String(f).slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabla o loading */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <SoftTable
            columns={columns}
            data={filteredMedicos}
            emptyMessage="No se encontraron médicos con los filtros actuales."
          />
        )}

        {/* Error */}
        {errorMsg && (
          <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Modal Expediente */}
        {selectedMedico && (
          <ModalExpediente
            open={showExpediente}
            medico={selectedMedico}
            onUpdated={handleMedicoUpdated}
            onClose={handleCloseExpediente}
          />
        )}
      </div>
    </div>
  );
}
