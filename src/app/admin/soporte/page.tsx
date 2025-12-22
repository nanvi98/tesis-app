'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LifeBuoy,
  AlertCircle,
  MessageCircle,
  Search,
  Plus,
  Send,
  Tag,
  User,
  Shield,
  Paperclip,
  Loader2,
  Clock3,
  ArrowLeftRight,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

/*─────────────────────────────────────────────
  TIPOS
──────────────────────────────────────────────*/

export type TicketEstado = 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';

export type TicketPrioridad = 'baja' | 'media' | 'alta' | 'urgente';

export interface Ticket {
  id: string;
  usuario_id: string | null;
  usuario_nombre: string | null;
  admin_id: string | null;
  admin_nombre: string | null;
  titulo: string;
  categoria: string;
  prioridad: TicketPrioridad;
  estado: TicketEstado;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export type SenderType = 'admin' | 'user';

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: SenderType;
  sender_id: string | null;
  sender_nombre: string | null;
  mensaje: string | null;
  archivo_url: string | null;
  created_at: string;
}

export interface NuevoTicketPayload {
  titulo: string;
  categoria: string;
  prioridad: TicketPrioridad;
  descripcion: string;
}

/*─────────────────────────────────────────────
  LABELS Y COLORES
──────────────────────────────────────────────*/

export const ESTADO_LABEL: Record<TicketEstado, string> = {
  abierto: 'Abierto',
  en_progreso: 'En progreso',
  resuelto: 'Resuelto',
  cerrado: 'Cerrado',
};

export const PRIORIDAD_LABEL: Record<TicketPrioridad, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const PRIORIDAD_COLORS: Record<TicketPrioridad, string> = {
  baja: 'bg-emerald-50 text-emerald-700',
  media: 'bg-sky-50 text-sky-700',
  alta: 'bg-amber-50 text-amber-700',
  urgente: 'bg-rose-50 text-rose-700',
};

export const ESTADO_COLORS: Record<TicketEstado, string> = {
  abierto: 'bg-sky-50 text-sky-700',
  en_progreso: 'bg-violet-50 text-violet-700',
  resuelto: 'bg-emerald-50 text-emerald-700',
  cerrado: 'bg-slate-100 text-slate-600',
};

/*─────────────────────────────────────────────
  COMPONENTE PRINCIPAL
──────────────────────────────────────────────*/
export default function SoportePage({ roleOverride }: { roleOverride?: string }) {

  /* Estados base */
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  /* Filtros */
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<'todos' | TicketEstado>('todos');
  const [prioridadFilter, setPrioridadFilter] = useState<'todas' | TicketPrioridad>('todas');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');

  /* Nuevo ticket */
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [nuevoTicket, setNuevoTicket] = useState<NuevoTicketPayload>({
    titulo: '',
    categoria: '',
    prioridad: 'media',
    descripcion: '',
  });

  /* Admins para reasignación */
  const [admins, setAdmins] = useState<{ id: string; nombre: string | null }[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);

  /* Usuario actual */
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string | null;
    nombre: string | null;
  } | null>(null);

  /* Modal de reasignación */
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [updatingAdmin, setUpdatingAdmin] = useState(false);

  /*─────────────────────────────────────────────
    FETCH usuario actual
  ─────────────────────────────────────────────*/
  const fetchCurrentUser = async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setCurrentUser(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre, role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error cargando profile:', error);
      setCurrentUser(null);
      return;
    }

    setCurrentUser({
      id: data.id,
      nombre: data.nombre,
      role: roleOverride || data.role,
    });
  };

  /*─────────────────────────────────────────────
    FETCH admins
  ─────────────────────────────────────────────*/
  const fetchAdmins = async () => {
    setLoadingAdmins(true);

    const { data, error } = await supabase
      .from('profiles')
      .select('id, nombre')
      .eq('role', 'admin')
      .order('nombre', { ascending: true });

    if (error) {
      console.error('Error cargando admins:', error);
      setLoadingAdmins(false);
      return;
    }

    setAdmins(data || []);
    setLoadingAdmins(false);
  };

  /*─────────────────────────────────────────────
    Autocerrar tickets resueltos > 7 días
  ─────────────────────────────────────────────*/
  const autoCloseOldTickets = async (ticketsData: Ticket[]) => {
    const now = new Date();

    const toClose = ticketsData.filter((t) => {
      if (t.estado !== 'resuelto') return false;
      if (!t.updated_at) return false;
      const diff =
        (now.getTime() - new Date(t.updated_at).getTime()) /
        (1000 * 60 * 60 * 24);
      return diff >= 7;
    });

    if (!toClose.length) return;

    const ids = toClose.map((t) => t.id);
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from('soporte_tickets')
      .update({ estado: 'cerrado', closed_at: nowIso })
      .in('id', ids);

    if (error) {
      console.error('Error autocerrando:', error);
      return;
    }

    setTickets((prev) =>
      prev.map((t) =>
        ids.includes(t.id)
          ? { ...t, estado: 'cerrado', closed_at: nowIso }
          : t
      )
    );
  };

  /*─────────────────────────────────────────────
    FETCH tickets
  ─────────────────────────────────────────────*/
  const fetchTickets = async () => {
    setLoadingTickets(true);
    setErrorMsg('');

    let query = supabase
      .from('soporte_tickets')
      .select(`
    id,
    usuario_id,
    admin_id,
    titulo,
    categoria,
    prioridad,
    estado,
    descripcion,
    created_at,
    updated_at,
    closed_at,
    usuario:profiles!soporte_tickets_usuario_id_fkey (nombre),
    admin:profiles!soporte_tickets_admin_id_fkey (nombre)
  `)
      .order('created_at', { ascending: false });

    if (currentUser?.role === 'medico') {
      query = query.eq('admin_id', currentUser.id);
    }

    if (currentUser?.role === 'paciente') {
      query = query.eq('usuario_id', currentUser.id);
    }
    const { data, error } = await query;

    if (error) {
      console.error(error);
      setErrorMsg('Error al cargar los tickets.');
      setLoadingTickets(false);
      return;
    }

    const mapped = (data || []).map((t: any) => ({
      ...t,
      usuario_nombre: t.usuario?.nombre ?? null,
      admin_nombre: t.admin?.nombre ?? null,
    })) as Ticket[];

    setTickets(mapped);
    setLoadingTickets(false);

    autoCloseOldTickets(mapped);
  };
  /*─────────────────────────────────────────────
    FETCH mensajes del ticket (con join a profiles)
  ──────────────────────────────────────────────*/
  const fetchMessages = async (ticketId: string) => {
    setLoadingMessages(true);

    const { data, error } = await supabase
      .from('soporte_mensajes')
      .select(
        `
      *,
      sender:profiles!soporte_mensajes_sender_id_fkey (nombre)
    `
      )
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      setLoadingMessages(false);
      return;
    }

    const mapped = (data ?? []).map((m: any) => ({
      ...m,
      sender_nombre: m.sender?.nombre ?? null,
    })) as TicketMessage[];

    setMessages(mapped);
    setLoadingMessages(false);
  };

  /*─────────────────────────────────────────────
    useEffect inicial
  ──────────────────────────────────────────────*/
  useEffect(() => {
    fetchCurrentUser();
    fetchAdmins();
  }, []);
  // 2. Cuando ya tengamos al usuario logueado, ahora sí pedimos los tickets
  useEffect(() => {
    if (!currentUser) return; // aún no está listo el usuario

    fetchTickets();
  }, [currentUser]);

  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'soporte_tickets' },
        () => fetchTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /*─────────────────────────────────────────────
    Seleccionar ticket
  ──────────────────────────────────────────────*/
  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAttachedFile(null);
    setNewMessage('');
    fetchMessages(ticket.id);
  };

  /*─────────────────────────────────────────────
    Enviar mensaje (admin / user)
  ──────────────────────────────────────────────*/
  const handleSendMessage = async () => {
    if (!selectedTicket) return;

    if (selectedTicket.estado === 'cerrado') {
      setErrorMsg('No puedes enviar mensajes en un ticket cerrado.');
      return;
    }

    if (!newMessage.trim() && !attachedFile) return;

    setSending(true);
    setErrorMsg('');

    let archivoUrl: string | null = null;

    /* Subir archivo si existe */
    if (attachedFile) {
      setUploadingFile(true);

      try {
        const ext = attachedFile.name.split('.').pop() || 'bin';
        const filePath = `ticket-${selectedTicket.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('soporte_adjuntos')
          .upload(filePath, attachedFile);

        if (uploadError) {
          console.error(uploadError);
          setErrorMsg('Error subiendo archivo adjunto.');
        } else {
          const { data: publicData } = supabase.storage
            .from('soporte_adjuntos')
            .getPublicUrl(filePath);

          archivoUrl = publicData?.publicUrl ?? null;
        }
      } finally {
        setUploadingFile(false);
      }
    }

    /* Tipo de remitente */
    const senderType: SenderType =
      currentUser?.role === 'admin' ? 'admin' : 'user';

    const payload = {
      ticket_id: selectedTicket.id,
      sender_type: senderType,
      sender_id: currentUser?.id ?? null,
      mensaje: newMessage.trim() || null,
      archivo_url: archivoUrl,
    };

    const { data, error } = await supabase
      .from('soporte_mensajes')
      .insert(payload)
      .select(
        `
      *,
      sender:profiles!sender_id (nombre)
    `
      )
      .single();

    if (error) {
      console.error(error);
      setErrorMsg('No se pudo enviar el mensaje.');
      setSending(false);
      return;
    }

    const newMsg: TicketMessage = {
      ...data,
      sender_nombre: (data as any)?.sender?.nombre ?? null,
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage('');
    setAttachedFile(null);
    setSending(false);

    /* Actualizar estado del ticket */
    let nuevoEstado: TicketEstado | null = null;

    if (senderType === 'admin') {
      if (selectedTicket.estado === 'abierto' || selectedTicket.estado === 'resuelto') {
        nuevoEstado = 'en_progreso';
      }
    } else {
      if (selectedTicket.estado === 'resuelto') {
        nuevoEstado = 'en_progreso';
      }
    }

    const updatePayload: Partial<Ticket> = {
      updated_at: new Date().toISOString(),
    };

    if (nuevoEstado) {
      (updatePayload as any).estado = nuevoEstado;
    }

    if (senderType === 'admin' && currentUser?.id && !selectedTicket.admin_id) {
      (updatePayload as any).admin_id = currentUser.id;
    }

    if (Object.keys(updatePayload).length > 1) {
      const { error: updateError } = await supabase
        .from('soporte_tickets')
        .update(updatePayload)
        .eq('id', selectedTicket.id);

      if (updateError) {
        console.error(updateError);
      } else {
        setSelectedTicket((prev) =>
          prev
            ? {
              ...prev,
              estado: (nuevoEstado || prev.estado) as TicketEstado,
              admin_id: (updatePayload as any).admin_id ?? prev.admin_id,
            }
            : prev
        );

        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? {
                ...t,
                estado: (nuevoEstado || t.estado) as TicketEstado,
                admin_id: (updatePayload as any).admin_id ?? t.admin_id,
              }
              : t
          )
        );
      }
    }
  };

  /*─────────────────────────────────────────────
    Crear ticket
  ──────────────────────────────────────────────*/
  const handleCreateTicket = async () => {
    if (!nuevoTicket.titulo.trim()) return;

    setCreatingTicket(true);
    setErrorMsg('');

    const payload = {
      usuario_id: currentUser?.id ?? null,
      admin_id: null,
      titulo: nuevoTicket.titulo.trim(),
      categoria: nuevoTicket.categoria.trim() || 'general',
      prioridad: nuevoTicket.prioridad,
      descripcion: nuevoTicket.descripcion.trim() || null,
      estado: 'abierto' as TicketEstado,
    };

    const { data, error } = await supabase
      .from('soporte_tickets')
      .insert(payload)
      .select(`
      *,
      usuario:profiles!soporte_tickets_usuario_id_fkey (nombre),
      admin:profiles!soporte_tickets_admin_id_fkey (nombre)
    `)
      .single();

    if (error) {
      console.error(error);
      setErrorMsg('No se pudo crear el ticket.');
      setCreatingTicket(false);
      return;
    }

    const ticketNuevo: Ticket = {
      ...(data as any),
      usuario_nombre: (data as any)?.usuario?.nombre ?? null,
      admin_nombre: (data as any)?.admin?.nombre ?? null,
    };

    setTickets((prev) => [ticketNuevo, ...prev]);

    setShowNewTicketModal(false);
    setNuevoTicket({
      titulo: '',
      categoria: '',
      prioridad: 'media',
      descripcion: '',
    });

    setCreatingTicket(false);
    setSelectedTicket(ticketNuevo);
    fetchMessages(ticketNuevo.id);
  };


  /*─────────────────────────────────────────────
    Cerrar ticket
  ──────────────────────────────────────────────*/
  const handleCloseTicket = async () => {
    if (!selectedTicket) return;

    const now = new Date().toISOString();

    const { error } = await supabase
      .from('soporte_tickets')
      .update({
        estado: 'cerrado',
        closed_at: now,
        updated_at: now,
        admin_id: currentUser?.id ?? selectedTicket.admin_id
      })
      .eq('id', selectedTicket.id);

    if (error) {
      console.error(error);
      setErrorMsg('No se pudo cerrar el ticket.');
      return;
    }

    setSelectedTicket((prev) =>
      prev ? { ...prev, estado: 'cerrado', closed_at: now } : prev
    );

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, estado: 'cerrado', closed_at: now }
          : t
      )
    );
  };


  /*─────────────────────────────────────────────
    ELIMINAR ticket
  ──────────────────────────────────────────────*/
  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;

    if (!confirm("¿Seguro que deseas eliminar este ticket?")) return;

    // 1. Eliminar en base de datos
    const { error } = await supabase
      .from('soporte_tickets')
      .delete()
      .eq('id', selectedTicket.id);

    if (error) {
      console.error(error);
      setErrorMsg('No se pudo eliminar el ticket.');
      return;
    }

    // 2. Limpiar selección y mensajes
    setSelectedTicket(null);
    setMessages([]);

    // 3. Eliminar visual
    setTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id));

    // 4. REFETCH para sincronizar médico y admin
    await fetchTickets();
  };



  /*─────────────────────────────────────────────
    Reasignar ticket a otro admin
  ──────────────────────────────────────────────*/
  const handleReassignTicket = async (adminId: string) => {
    if (!selectedTicket) return;

    setUpdatingAdmin(true);

    const { error } = await supabase
      .from('soporte_tickets')
      .update({
        admin_id: adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedTicket.id);

    if (error) {
      console.error(error);
      setErrorMsg('No se pudo reasignar el ticket.');
      setUpdatingAdmin(false);
      return;
    }

    const newAdmin = admins.find((a) => a.id === adminId) || null;

    setSelectedTicket((prev) =>
      prev
        ? {
          ...prev,
          admin_id: adminId,
          admin_nombre: newAdmin?.nombre ?? null,
        }
        : prev
    );

    setTickets((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? {
            ...t,
            admin_id: adminId,
            admin_nombre: newAdmin?.nombre ?? null,
          }
          : t
      )
    );

    setUpdatingAdmin(false);
    setShowReassignModal(false);
  };
  /*─────────────────────────────────────────────
    KPIs, métricas y filtros
  ──────────────────────────────────────────────*/

  const total = tickets.length;
  const abiertos = tickets.filter((t) => t.estado === 'abierto').length;
  const enProgreso = tickets.filter((t) => t.estado === 'en_progreso').length;
  const resueltos = tickets.filter((t) => t.estado === 'resuelto').length;
  const cerrados = tickets.filter((t) => t.estado === 'cerrado').length;

  const urgentes = tickets.filter(
    (t) => t.prioridad === 'urgente' && t.estado !== 'cerrado'
  ).length;

  const resueltosOCerrados = tickets.filter(
    (t) => t.estado === 'resuelto' || t.estado === 'cerrado'
  ).length;

  const tasaResolucion =
    total > 0 ? Math.round((resueltosOCerrados / total) * 100) : 0;

  const ticketsHoy = useMemo(() => {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = hoy.getMonth();
    const d = hoy.getDate();
    return tickets.filter((t) => {
      const fecha = new Date(t.created_at);
      return (
        fecha.getFullYear() === y &&
        fecha.getMonth() === m &&
        fecha.getDate() === d
      );
    }).length;
  }, [tickets]);

  const avgResolutionHours = useMemo(() => {
    const cerradosTickets = tickets.filter((t) => t.closed_at);
    if (!cerradosTickets.length) return 0;

    const sumMs = cerradosTickets.reduce((acc, t) => {
      const created = new Date(t.created_at).getTime();
      const closed = new Date(t.closed_at as string).getTime();
      return acc + Math.max(closed - created, 0);
    }, 0);

    const avgMs = sumMs / cerradosTickets.length;
    return avgMs / (1000 * 60 * 60); // horas
  }, [tickets]);

  const lastTicketTimeLabel = useMemo(() => {
    if (!tickets.length) return 'Sin registros';
    const fecha = new Date(tickets[0].created_at);
    return fecha.toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  }, [tickets]);

  const categoriasDisponibles = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach((t) => set.add(t.categoria));
    return Array.from(set);
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    let list = [...tickets];

    if (estadoFilter !== 'todos') {
      list = list.filter((t) => t.estado === estadoFilter);
    }

    if (prioridadFilter !== 'todas') {
      list = list.filter((t) => t.prioridad === prioridadFilter);
    }

    if (categoriaFilter !== 'todas') {
      list = list.filter((t) => t.categoria === categoriaFilter);
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.titulo.toLowerCase().includes(s) ||
          (t.descripcion ?? '').toLowerCase().includes(s) ||
          t.categoria.toLowerCase().includes(s) ||
          (t.usuario_nombre ?? '').toLowerCase().includes(s)
      );
    }

    return list;
  }, [tickets, estadoFilter, prioridadFilter, categoriaFilter, search]);

  /*─────────────────────────────────────────────
    RENDER
  ──────────────────────────────────────────────*/

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 px-6 py-6">

      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex flex-col gap-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full bg-sky-50/80 px-3 py-1 text-xs font-medium text-sky-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Centro de soporte
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-semibold text-slate-900">
              <LifeBuoy className="h-7 w-7 text-sky-500" />
              Soporte y tickets
            </h1>
            <p className="max-w-3xl text-sm text-slate-500">
              Gestiona las solicitudes de ayuda de médicos y usuarios, responde mensajes
              y mantén el sistema funcionando sin fricciones.
            </p>
          </div>

          <button
            onClick={() => setShowNewTicketModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 hover:from-sky-600 hover:to-violet-600"
          >
            <Plus size={16} />
            Nuevo ticket
          </button>
        </div>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 grid gap-4 md:grid-cols-4"
      >
        <KpiCard
          label="Tickets totales"
          value={total}
          icon={<MessageCircle className="text-sky-500" />}
        />
        <KpiCard
          label="Abiertos"
          value={abiertos}
          icon={<AlertCircle className="text-amber-500" />}
        />
        <KpiCard
          label="En progreso"
          value={enProgreso}
          icon={<Shield className="text-violet-500" />}
        />
        <KpiCard
          label="Urgentes activos"
          value={urgentes}
          icon={<LifeBuoy className="text-rose-500" />}
        />
      </motion.div>

      {/* Métricas extra */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-violet-50/80 px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.05)]"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Métricas de soporte
            </p>
            <p className="text-[11px] text-slate-500">
              Panorama rápido del rendimiento del centro de ayuda.
            </p>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Clock3 size={12} />
            <span>Último ticket: {lastTicketTimeLabel}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <MetricPill
            label="Tasa de resolución"
            value={`${tasaResolucion}%`}
            helper={`${resueltosOCerrados} de ${total}`}
          />
          <MetricPill
            label="Tiempo medio de cierre"
            value={avgResolutionHours ? `${avgResolutionHours.toFixed(1)} h` : 'Sin datos'}
            helper="Tickets cerrados"
          />
          <MetricPill
            label="Tickets creados hoy"
            value={ticketsHoy}
            helper={ticketsHoy === 1 ? 'Ticket de hoy' : 'Tickets de hoy'}
          />
        </div>
      </motion.div>

      {/* GRID principal */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">

        {/* PANEL IZQUIERDO — Lista de tickets */}
        <motion.div
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col rounded-3xl bg-white/80 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur"
        >

          {/* Buscador + filtros */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, usuario o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-slate-50/70 px-9 py-2 text-sm text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
              />
            </div>

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value as any)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="todos">Todos los estados</option>
              <option value="abierto">Abiertos</option>
              <option value="en_progreso">En progreso</option>
              <option value="resuelto">Resueltos</option>
              <option value="cerrado">Cerrados</option>
            </select>

            <select
              value={prioridadFilter}
              onChange={(e) => setPrioridadFilter(e.target.value as any)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="todas">Todas las prioridades</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>

            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none"
            >
              <option value="todas">Todas las categorías</option>
              {categoriasDisponibles.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Lista tickets */}
          <div className="mt-1 flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-2">
            {loadingTickets ? (
              <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                Cargando tickets...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-1 text-center text-sm text-slate-400">
                <LifeBuoy className="h-6 w-6 text-slate-300" />
                <p>No hay tickets con los filtros seleccionados.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTickets.map((t) => {
                  const selected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className={`flex w-full items-stretch gap-3 rounded-2xl px-3 py-2 text-sm transition ${selected
                        ? 'bg-gradient-to-r from-sky-500/90 to-violet-500/90 text-sky-50 shadow-lg'
                        : 'bg-white/90 text-slate-800 hover:bg-sky-50'
                        }`}
                    >
                      <div
                        className={`mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl ${selected ? 'bg-sky-50/20' : 'bg-sky-50 text-sky-600'
                          }`}
                      >
                        <MessageCircle size={16} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-[13px] font-semibold ${selected ? 'text-sky-50' : 'text-slate-900'
                              }`}
                          >
                            {t.titulo}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORIDAD_COLORS[t.prioridad]
                              } ${selected ? 'bg-sky-50/10 text-sky-50' : ''}`}
                          >
                            {PRIORIDAD_LABEL[t.prioridad]}
                          </span>
                        </div>

                        <p
                          className={`mt-0.5 text-[11px] ${selected ? 'text-sky-100' : 'text-slate-500'
                            }`}
                        >
                          Usuario: {t.usuario_nombre ?? 'Desconocido'}
                        </p>

                        {t.admin_nombre && (
                          <p
                            className={`text-[11px] ${selected ? 'text-sky-100/90' : 'text-slate-400'
                              }`}
                          >
                            Admin: {t.admin_nombre}
                          </p>
                        )}

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px]">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 ${ESTADO_COLORS[t.estado]
                              } ${selected ? 'bg-sky-50/10 text-sky-50' : ''}`}
                          >
                            {ESTADO_LABEL[t.estado]}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2 py-0.5 ${selected ? 'bg-sky-50/10 text-sky-100' : ''
                              }`}
                          >
                            <Tag size={10} />
                            {t.categoria}
                          </span>

                          <span
                            className={`text-[10px] ${selected ? 'text-sky-100/70' : 'text-slate-400'
                              }`}
                          >
                            {new Date(t.created_at).toLocaleString('es-MX', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {errorMsg && (
            <p className="mt-2 flex items-center gap-1 text-xs text-rose-600">
              <AlertCircle size={12} />
              {errorMsg}
            </p>
          )}
        </motion.div>

        {/* PANEL DERECHO — Detalle y chat */}
        <motion.div
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col rounded-3xl bg-white/80 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.07)] backdrop-blur"
        >
          {!selectedTicket ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-400">
              <LifeBuoy className="h-8 w-8 text-slate-300" />
              <p>Selecciona un ticket para ver los detalles y chatear con el usuario.</p>
            </div>
          ) : (
            <>
              {/* Header ticket */}
              <div className="mb-3 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">
                    Ticket seleccionado
                  </p>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {selectedTicket.titulo}
                  </h2>

                  <div className="mt-1 text-[11px] text-slate-500">
                    <p>
                      <span className="font-semibold">Usuario:</span>{' '}
                      {selectedTicket.usuario_nombre ?? 'Desconocido'}
                    </p>
                    <p>
                      <span className="font-semibold">Admin asignado:</span>{' '}
                      {selectedTicket.admin_nombre ?? (
                        <span className="italic text-slate-400">Sin asignar</span>
                      )}
                    </p>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 ${ESTADO_COLORS[selectedTicket.estado]
                        }`}
                    >
                      {ESTADO_LABEL[selectedTicket.estado]}
                    </span>

                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 ${PRIORIDAD_COLORS[selectedTicket.prioridad]
                        }`}
                    >
                      {PRIORIDAD_LABEL[selectedTicket.prioridad]}
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5">
                      <Tag size={10} />
                      {selectedTicket.categoria}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 text-[11px] text-slate-400">
                  <span>
                    Creado:{' '}
                    {new Date(selectedTicket.created_at).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>

                  {selectedTicket.closed_at && (
                    <span>
                      Cerrado:{' '}
                      {new Date(selectedTicket.closed_at).toLocaleString('es-MX', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  )}
                </div>
              </div>

              {/* Botones acción */}
              <div className="mb-3 flex flex-wrap gap-3">
                {currentUser?.role === 'admin' && admins.length > 1 && (
                  <button
                    onClick={() => setShowReassignModal(true)}
                    disabled={updatingAdmin}
                    className="flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-200 disabled:opacity-60"
                  >
                    <ArrowLeftRight size={12} />
                    Reasignar admin
                  </button>
                )}

                {currentUser?.role === 'admin' &&
                  selectedTicket.estado !== 'cerrado' && (
                    <button
                      onClick={handleCloseTicket}
                      className="flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
                    >
                      <XCircle size={12} />
                      Cerrar ticket
                    </button>
                  )}
                {currentUser?.role === 'admin' && (
                  <button
                    onClick={handleDeleteTicket}
                    className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <XCircle size={12} />
                    Eliminar ticket
                  </button>
                )}

              </div>

              {selectedTicket.descripcion && (
                <div className="mb-3 rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-semibold text-slate-700">Descripción:</span>{' '}
                  {selectedTicket.descripcion}
                </div>
              )}
              {/* Chat */}
              <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-3">
                {loadingMessages ? (
                  <div className="flex h-40 items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-sky-400" />
                    Cargando conversación...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-40 flex-col items-center justify-center gap-1 text-center text-sm text-slate-400">
                    <MessageCircle className="h-6 w-6 text-slate-300" />
                    <p>No hay mensajes todavía. Envía el primero 😊</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2 text-sm">
                    {messages.map((m: TicketMessage) => {
                      const isSentByCurrentUser = m.sender_id === currentUser?.id;
                      const isAdminSender = m.sender_type === 'admin';

                      return (
                        <div
                          key={m.id}
                          className={`flex w-full ${isSentByCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-md ${isSentByCurrentUser
                              ? 'bg-gradient-to-r from-violet-600 to-sky-500 text-white rounded-br-none'
                              : 'bg-gray-200 text-slate-800 rounded-bl-none'
                              }`}
                          >
                            <div className="mb-0.5 flex items-center gap-1 text-[10px] opacity-80">
                              {isAdminSender ? (
                                <>
                                  <Shield size={10} />
                                  <span>{m.sender_nombre || 'Admin'}</span>
                                </>
                              ) : (
                                <>
                                  <User size={10} />
                                  <span>{m.sender_nombre || 'Usuario'}</span>
                                </>
                              )}

                              <span>
                                ·{' '}
                                {new Date(m.created_at).toLocaleTimeString('es-MX', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {m.mensaje && <p className="leading-snug">{m.mensaje}</p>}

                            {m.archivo_url && (
                              <a
                                href={m.archivo_url}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-[10px] underline"
                              >
                                <Paperclip size={10} />
                                Ver archivo adjunto
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}



                {newMessage.trim().length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                    <span>Estás escribiendo…</span>
                  </div>
                )}
              </div>

              {/* Caja de texto */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-200 cursor-pointer">
                      <Paperclip size={12} />
                      <span>Adjuntar archivo</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setAttachedFile(file);
                        }}
                      />
                    </label>

                    {attachedFile && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[11px] text-sky-700">
                        <Paperclip size={11} />
                        <span className="max-w-[160px] truncate">
                          {attachedFile.name}
                        </span>
                      </span>
                    )}
                  </div>

                  {uploadingFile && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Loader2 className="h-3 w-3 animate-spin text-sky-400" />
                      Subiendo...
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
                  <input
                    type="text"
                    placeholder={
                      selectedTicket.estado === 'cerrado'
                        ? 'Este ticket está cerrado'
                        : 'Escribe un mensaje...'
                    }
                    disabled={selectedTicket.estado === 'cerrado'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none disabled:opacity-60"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      sending ||
                      uploadingFile ||
                      selectedTicket.estado === 'cerrado' ||
                      (!newMessage.trim() && !attachedFile)
                    }
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-violet-500 text-white shadow-sm disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* MODAL NUEVO TICKET */}
      <AnimatePresence>
        {showNewTicketModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 210, damping: 18 }}
              className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.45)]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-500">
                    Nuevo ticket
                  </p>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Registrar incidencia o solicitud de soporte
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Crea un ticket en nombre de un usuario o para registrar un problema
                    interno.
                  </p>
                </div>

                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-700">Título</label>
                  <input
                    type="text"
                    value={nuevoTicket.titulo}
                    onChange={(e) =>
                      setNuevoTicket((prev) => ({ ...prev, titulo: e.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                    placeholder="Ej. Error al cargar radiografías"
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Categoría</label>
                    <input
                      type="text"
                      value={nuevoTicket.categoria}
                      onChange={(e) =>
                        setNuevoTicket((prev) => ({ ...prev, categoria: e.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                      placeholder="Ej. Problema técnico, Feedback..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Prioridad</label>
                    <select
                      value={nuevoTicket.prioridad}
                      onChange={(e) =>
                        setNuevoTicket((prev) => ({
                          ...prev,
                          prioridad: e.target.value as TicketPrioridad,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                    >
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="urgente">Urgente</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={nuevoTicket.descripcion}
                    onChange={(e) =>
                      setNuevoTicket((prev) => ({
                        ...prev,
                        descripcion: e.target.value,
                      }))
                    }
                    className="mt-1 h-28 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none ring-sky-100 focus:bg-white focus:ring-2"
                    placeholder="Describe brevemente el problema o la solicitud..."
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowNewTicketModal(false)}
                  className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateTicket}
                  disabled={creatingTicket || !nuevoTicket.titulo.trim()}
                  className="rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-1.5 text-xs font-semibold text-white shadow-md disabled:opacity-60"
                >
                  {creatingTicket ? 'Creando...' : 'Crear ticket'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL REASIGNAR ADMIN */}
      <AnimatePresence>
        {showReassignModal && selectedTicket && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 210, damping: 18 }}
              className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.45)]"
            >
              <div className="mb-3 flex items-start justify-between">
                <h2 className="text-sm font-semibold text-slate-900">
                  Reasignar ticket
                </h2>
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-3">
                Selecciona el nuevo administrador para este ticket.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {admins
                  .filter((a) => a.id !== selectedTicket.admin_id)
                  .map((admin) => (
                    <button
                      key={admin.id}
                      onClick={() => handleReassignTicket(admin.id)}
                      disabled={updatingAdmin}
                      className="w-full text-left rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-sky-50 disabled:opacity-60"
                    >
                      {admin.nombre}
                    </button>
                  ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/*─────────────────────────────────────────────
  COMPONENTES AUXILIARES
──────────────────────────────────────────────*/

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white/80 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-50">
        {icon}
      </div>
    </div>
  );
}

function MetricPill({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-sky-100 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[10px] text-slate-400">{helper}</p>
    </div>
  );
}
