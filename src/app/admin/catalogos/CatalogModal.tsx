'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Globe2,
  Building2,
  Search,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import SoftTable, { SoftTableColumn } from './SoftTable';

export type CatalogKey =
  | 'especialidades'
  | 'tiposEstudio'
  | 'motivos'
  | 'ubicaciones'
  | 'roles'
  | 'medicamentos'
  | 'signos'
  | 'protocolos';

export interface CatalogConfig {
  key: CatalogKey;
  title: string;
  description: string;
  tipo?: string; // usado para catalogos generales
  showCosto?: boolean;
  isUbicaciones?: boolean;
}

interface CatalogModalProps {
  open: boolean;
  onClose: () => void;
  config: CatalogConfig;
}

interface CatalogRow {
  id: string;
  tipo: string;
  nombre: string;
  descripcion: string | null;
  costo: number | null;
}

interface EstadoRow extends CatalogRow {}
interface CiudadRow extends CatalogRow {}

const TIPO_ESTADO = 'ubicacion_estado';
const TIPO_CIUDAD = 'ubicacion_ciudad';

export default function CatalogModal({
  open,
  onClose,
  config,
}: CatalogModalProps) {
  const { isUbicaciones } = config;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative flex h-[88vh] w-[96vw] max-w-6xl flex-col overflow-hidden rounded-[32px] bg-slate-50 shadow-[0_30px_80px_rgba(15,23,42,0.55)] border border-slate-200/70"
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 18 }}
            transition={{ type: 'spring', stiffness: 210, damping: 20 }}
          >
            {isUbicaciones ? (
              <UbicacionesContent config={config} onClose={onClose} />
            ) : (
              <GenericCatalogContent config={config} onClose={onClose} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────────────
   CONTENIDO GENÉRICO
   ───────────────────────────── */

function GenericCatalogContent({
  config,
  onClose,
}: {
  config: CatalogConfig;
  onClose: () => void;
}) {
  const { title, description, tipo = '', showCosto } = config;

  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [desc, setDesc] = useState('');
  const [costo, setCosto] = useState<string>('');

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const s = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(s) ||
        (r.descripcion ?? '').toLowerCase().includes(s)
    );
  }, [rows, search]);

  const fetchRows = async () => {
    setLoading(true);
    setErrorMsg('');
    const { data, error } = await supabase
      .from('catalogos')
      .select('*')
      .eq('tipo', tipo)
      .order('nombre', { ascending: true });

    if (error) {
      console.error(error);
      setErrorMsg('Error al cargar el catálogo. Verifica la tabla "catalogos".');
      setLoading(false);
      return;
    }

    const mapped: CatalogRow[] =
      data?.map((row: any) => ({
        id: row.id,
        tipo: row.tipo,
        nombre: row.nombre ?? '',
        descripcion: row.descripcion ?? null,
        costo: row.costo !== null ? Number(row.costo) : null,
      })) ?? [];

    setRows(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo]);

  const resetForm = () => {
    setNombre('');
    setDesc('');
    setCosto('');
    setEditingId(null);
  };

  const handleEdit = (row: CatalogRow) => {
    setEditingId(row.id);
    setNombre(row.nombre);
    setDesc(row.descripcion ?? '');
    setCosto(row.costo !== null ? String(row.costo) : '');
  };

  const handleDelete = async (row: CatalogRow) => {
    const ok = confirm(`¿Eliminar "${row.nombre}" del catálogo?`);
    if (!ok) return;

    const { error } = await supabase.from('catalogos').delete().eq('id', row.id);
    if (error) {
      console.error(error);
      alert('No se pudo eliminar. Revisa la consola.');
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      alert('El nombre es obligatorio.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const payload: any = {
      tipo,
      nombre: nombre.trim(),
      descripcion: desc.trim() || null,
    };

    if (showCosto) {
      payload.costo = costo.trim() ? Number(costo) : null;
    }

    try {
      if (editingId) {
        const { error, data } = await supabase
          .from('catalogos')
          .update(payload)
          .eq('id', editingId)
          .select();

        if (error) {
          console.error(error);
          setErrorMsg('No se pudo actualizar el registro.');
        } else if (data && data[0]) {
          setRows((prev) =>
            prev.map((r) =>
              r.id === editingId
                ? {
                    id: data[0].id,
                    tipo: data[0].tipo,
                    nombre: data[0].nombre,
                    descripcion: data[0].descripcion,
                    costo:
                      data[0].costo !== null ? Number(data[0].costo) : null,
                  }
                : r
            )
          );
          resetForm();
        }
      } else {
        const { error, data } = await supabase
          .from('catalogos')
          .insert(payload)
          .select();

        if (error) {
          console.error(error);
          setErrorMsg('No se pudo crear el registro.');
        } else if (data && data[0]) {
          setRows((prev) => [
            ...prev,
            {
              id: data[0].id,
              tipo: data[0].tipo,
              nombre: data[0].nombre,
              descripcion: data[0].descripcion,
              costo:
                data[0].costo !== null ? Number(data[0].costo) : null,
            },
          ]);
          resetForm();
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const columns: SoftTableColumn[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800">{row.nombre}</span>
          {row.descripcion && (
            <span className="text-xs text-slate-400">{row.descripcion}</span>
          )}
        </div>
      ),
    },
    ...(showCosto
      ? [
          {
            key: 'costo',
            label: 'Costo',
            align: 'right' as const,
            render: (row: CatalogRow) =>
              row.costo !== null ? (
                <span className="font-mono text-sm text-slate-700">
                  ${row.costo.toFixed(2)}
                </span>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              ),
          },
        ]
      : []),
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row: CatalogRow) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-100"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-teal-400 via-cyan-500 to-sky-500 px-7 py-4 text-white">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-xs text-white/80">{description}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
        >
          <X size={18} />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-7 py-5">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          {/* Buscador + tabla */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3 top-2.5 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Buscar en el catálogo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-slate-200 bg-slate-50/80 px-9 py-2 text-sm text-slate-800 outline-none ring-cyan-100 focus:bg-white focus:ring-2"
                />
              </div>
              {rows.length > 0 && (
                <span className="text-xs text-slate-500">
                  {filteredRows.length} de {rows.length} ítems
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">
                Cargando catálogo...
              </div>
            ) : (
              <SoftTable columns={columns} data={filteredRows} />
            )}

            {errorMsg && (
              <p className="mt-1 text-xs text-rose-600">{errorMsg}</p>
            )}
          </div>

          {/* Formulario lateral */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-600">
                  {editingId ? 'Editar elemento' : 'Nuevo elemento'}
                </p>
                <p className="text-[11px] text-slate-500">
                  Completa los campos y guarda los cambios.
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                <Plus size={16} />
              </div>
            </div>

            <div className="mt-1 space-y-2">
              <input
                type="text"
                placeholder="Nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-800 outline-none ring-cyan-100 focus:bg-white focus:ring-2"
              />
              <textarea
                placeholder="Descripción (opcional)"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="h-20 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-800 outline-none ring-cyan-100 focus:bg-white focus:ring-2"
              />
              {showCosto && (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Costo (opcional)"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-800 outline-none ring-cyan-100 focus:bg-white focus:ring-2"
                />
              )}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancelar edición
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="ml-auto rounded-full bg-gradient-to-r from-teal-500 to-sky-500 px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:from-teal-600 hover:to-sky-600 disabled:opacity-60"
              >
                {saving
                  ? 'Guardando...'
                  : editingId
                  ? 'Guardar cambios'
                  : 'Agregar al catálogo'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-slate-200/80 bg-slate-50/80 px-7 py-3">
        <button
          onClick={onClose}
          className="rounded-full bg-white px-5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
        >
          Cerrar
        </button>
      </div>
    </>
  );
}

/* ─────────────────────────────
   UBICACIONES
   ───────────────────────────── */

function UbicacionesContent({
  config,
  onClose,
}: {
  config: CatalogConfig;
  onClose: () => void;
}) {
  const { title, description } = config;

  const [estados, setEstados] = useState<EstadoRow[]>([]);
  const [ciudades, setCiudades] = useState<CiudadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEstado, setSearchEstado] = useState('');
  const [searchCiudad, setSearchCiudad] = useState('');
  const [selectedEstadoId, setSelectedEstadoId] = useState<string | null>(null);

  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nuevaCiudad, setNuevaCiudad] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedEstado = useMemo(
    () => estados.find((e) => e.id === selectedEstadoId) ?? null,
    [estados, selectedEstadoId]
  );

  const filteredEstados = useMemo(() => {
    if (!searchEstado.trim()) return estados;
    const s = searchEstado.toLowerCase();
    return estados.filter((e) => e.nombre.toLowerCase().includes(s));
  }, [estados, searchEstado]);

  const filteredCiudades = useMemo(() => {
    let list = ciudades;
    if (selectedEstado) {
      list = list.filter(
        (c) =>
          (c.descripcion ?? '').toLowerCase() ===
          selectedEstado.nombre.toLowerCase()
      );
    }
    if (searchCiudad.trim()) {
      const s = searchCiudad.toLowerCase();
      list = list.filter((c) => c.nombre.toLowerCase().includes(s));
    }
    return list;
  }, [ciudades, selectedEstado, searchCiudad]);

  const fetchUbicaciones = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('catalogos')
      .select('*')
      .in('tipo', [TIPO_ESTADO, TIPO_CIUDAD])
      .order('nombre', { ascending: true });

    const estadosData: EstadoRow[] =
      data
        ?.filter((r: any) => r.tipo === TIPO_ESTADO)
        .map((r: any) => ({
          id: r.id,
          tipo: r.tipo,
          nombre: r.nombre ?? '',
          descripcion: r.descripcion ?? null,
          costo: r.costo !== null ? Number(r.costo) : null,
        })) ?? [];

    const ciudadesData: CiudadRow[] =
      data
        ?.filter((r: any) => r.tipo === TIPO_CIUDAD)
        .map((r: any) => ({
          id: r.id,
          tipo: r.tipo,
          nombre: r.nombre ?? '',
          descripcion: r.descripcion ?? null,
          costo: r.costo !== null ? Number(r.costo) : null,
        })) ?? [];

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setEstados(estadosData);
    setCiudades(ciudadesData);
    if (!selectedEstadoId && estadosData[0]) {
      setSelectedEstadoId(estadosData[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUbicaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddEstado = async () => {
    if (!nuevoEstado.trim()) return;
    setSaving(true);

    const payload = {
      tipo: TIPO_ESTADO,
      nombre: nuevoEstado.trim(),
      descripcion: null,
      costo: null,
    };

    const { data, error } = await supabase
      .from('catalogos')
      .insert(payload)
      .select();

    setSaving(false);

    if (error) {
      console.error(error);
      alert('No se pudo crear el estado.');
      return;
    }

    if (data && data[0]) {
      const est: EstadoRow = {
        id: data[0].id,
        tipo: data[0].tipo,
        nombre: data[0].nombre,
        descripcion: data[0].descripcion,
        costo: data[0].costo !== null ? Number(data[0].costo) : null,
      };
      setEstados((prev) => [...prev, est]);
      setNuevoEstado('');
      setSelectedEstadoId(est.id);
    }
  };

  const handleAddCiudad = async () => {
    if (!nuevaCiudad.trim() || !selectedEstado) return;
    setSaving(true);

    const payload = {
      tipo: TIPO_CIUDAD,
      nombre: nuevaCiudad.trim(),
      descripcion: selectedEstado.nombre,
      costo: null,
    };

    const { data, error } = await supabase
      .from('catalogos')
      .insert(payload)
      .select();

    setSaving(false);

    if (error) {
      console.error(error);
      alert('No se pudo crear la ciudad.');
      return;
    }

    if (data && data[0]) {
      const c: CiudadRow = {
        id: data[0].id,
        tipo: data[0].tipo,
        nombre: data[0].nombre,
        descripcion: data[0].descripcion,
        costo: data[0].costo !== null ? Number(data[0].costo) : null,
      };
      setCiudades((prev) => [...prev, c]);
      setNuevaCiudad('');
    }
  };

  const handleDeleteEstado = async (estado: EstadoRow) => {
    const ciudadesDelEstado = ciudades.filter(
      (c) =>
        (c.descripcion ?? '').toLowerCase() === estado.nombre.toLowerCase()
    );

    const msg =
      ciudadesDelEstado.length > 0
        ? `Este estado tiene ${ciudadesDelEstado.length} ciudades asociadas. Se eliminarán también. ¿Continuar?`
        : `¿Eliminar el estado "${estado.nombre}"?`;

    const ok = confirm(msg);
    if (!ok) return;

    const idsCiudades = ciudadesDelEstado.map((c) => c.id);
    if (idsCiudades.length > 0) {
      const { error: errCiudades } = await supabase
        .from('catalogos')
        .delete()
        .in('id', idsCiudades);
      if (errCiudades) {
        console.error(errCiudades);
        alert('No se pudieron eliminar las ciudades.');
        return;
      }
      setCiudades((prev) => prev.filter((c) => !idsCiudades.includes(c.id)));
    }

    const { error } = await supabase
      .from('catalogos')
      .delete()
      .eq('id', estado.id);

    if (error) {
      console.error(error);
      alert('No se pudo eliminar el estado.');
      return;
    }

    setEstados((prev) => prev.filter((e) => e.id !== estado.id));
    if (selectedEstadoId === estado.id) {
      setSelectedEstadoId(null);
    }
  };

  const handleDeleteCiudad = async (ciudad: CiudadRow) => {
    const ok = confirm(`¿Eliminar la ciudad "${ciudad.nombre}"?`);
    if (!ok) return;

    const { error } = await supabase
      .from('catalogos')
      .delete()
      .eq('id', ciudad.id);

    if (error) {
      console.error(error);
      alert('No se pudo eliminar la ciudad.');
      return;
    }

    setCiudades((prev) => prev.filter((c) => c.id !== ciudad.id));
  };

  const columnsCiudades: SoftTableColumn[] = [
    {
      key: 'nombre',
      label: 'Ciudad',
      render: (row: CiudadRow) => (
        <div className="flex flex-col">
          <span className="font-medium text-slate-800">{row.nombre}</span>
          {row.descripcion && (
            <span className="text-[11px] text-slate-400">
              Estado: {row.descripcion}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      label: 'Acciones',
      align: 'right',
      render: (row: CiudadRow) => (
        <button
          onClick={() => handleDeleteCiudad(row)}
          className="rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100"
        >
          <Trash2 size={14} />
        </button>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-600 px-7 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/20">
            <Globe2 size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-xs text-sky-100/90">{description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full bg-white/20 p-2 text-sky-50 hover:bg-white/30"
        >
          <X size={18} />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-7 py-5">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-slate-500">
            Cargando ubicaciones...
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            {/* Estados */}
            <div className="flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">
                    Estados
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Selecciona un estado para ver sus ciudades.
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                  <MapPin size={16} />
                </div>
              </div>

              <div className="mt-2 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar estado..."
                    value={searchEstado}
                    onChange={(e) => setSearchEstado(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-slate-50/80 px-9 py-2 text-xs text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  />
                </div>
              </div>

              <div className="mt-2 max-h-72 space-y-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-2">
                {filteredEstados.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-slate-400">
                    No hay estados registrados.
                  </p>
                ) : (
                  filteredEstados.map((e) => {
                    const countCiudades = ciudades.filter(
                      (c) =>
                        (c.descripcion ?? '').toLowerCase() ===
                        e.nombre.toLowerCase()
                    ).length;
                    const selected = selectedEstadoId === e.id;
                    return (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEstadoId(e.id)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition ${
                          selected
                            ? 'bg-sky-600 text-sky-50'
                            : 'bg-white/80 text-slate-700 hover:bg-sky-50'
                        }`}
                      >
                        <span className="font-semibold">{e.nombre}</span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] ${
                            selected
                              ? 'bg-sky-500/80 text-sky-50'
                              : 'bg-sky-50 text-sky-600'
                          }`}
                        >
                          {countCiudades} ciudades
                        </span>
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            handleDeleteEstado(e);
                          }}
                          className={`ml-2 rounded-full border px-1.5 py-0.5 text-[10px] ${
                            selected
                              ? 'border-sky-200 text-sky-50/90'
                              : 'border-slate-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          <Trash2 size={11} />
                        </button>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-2 space-y-2">
                <p className="text-[11px] font-medium text-slate-600">
                  Añadir nuevo estado
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej. Ciudad de México"
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  />
                  <button
                    onClick={handleAddEstado}
                    disabled={saving || !nuevoEstado.trim()}
                    className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>

            {/* Ciudades */}
            <div className="flex flex-col gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_16px_50px_rgba(15,23,42,0.08)] border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Ciudades por estado
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {selectedEstado
                      ? `Estado seleccionado: ${selectedEstado.nombre}`
                      : 'Selecciona un estado para ver y crear ciudades.'}
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <Building2 size={16} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3 top-2.5 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Buscar ciudad..."
                    value={searchCiudad}
                    onChange={(e) => setSearchCiudad(e.target.value)}
                    className="w-full rounded-full border border-slate-200 bg-slate-50/80 px-9 py-2 text-xs text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  />
                </div>
              </div>

              <div className="mt-2">
                <SoftTable
                  columns={columnsCiudades}
                  data={filteredCiudades}
                  emptyMessage={
                    selectedEstado
                      ? 'No hay ciudades registradas para este estado.'
                      : 'Selecciona un estado para ver sus ciudades.'
                  }
                />
              </div>

              <div className="mt-2 space-y-2">
                <p className="text-[11px] font-medium text-slate-600">
                  Añadir nueva ciudad
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre de la ciudad"
                    value={nuevaCiudad}
                    onChange={(e) => setNuevaCiudad(e.target.value)}
                    className="flex-1 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                  />
                  <button
                    onClick={handleAddCiudad}
                    disabled={
                      saving || !nuevaCiudad.trim() || !selectedEstado
                    }
                    className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-sky-600 hover:to-indigo-600 disabled:opacity-60"
                  >
                    Agregar
                  </button>
                </div>
                {!selectedEstado && (
                  <p className="text-[10px] text-slate-400">
                    Primero selecciona un estado para asociar las ciudades.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-slate-200/80 bg-slate-50/80 px-7 py-3">
        <button
          onClick={onClose}
          className="rounded-full bg-white px-5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-100"
        >
          Cerrar
        </button>
      </div>
    </>
  );
}
