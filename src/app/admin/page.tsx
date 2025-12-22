'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  Clock,
  Activity,
  Loader2,
  UserX,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface Profile {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  role: string;
  approved: boolean | null;
  status: string | null;
  created_at: string;
  especialidad?: string | null;
  cedula?: string | null;
}

export default function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  const fetchProfiles = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/getAllUsers");

      console.log("STATUS:", res.status);

      const text = await res.text();
      console.log("RESPONSE RAW:", text);

      try {
        const data = JSON.parse(text);
        setProfiles(data);
      } catch (err) {
        console.error("NO ES JSON:", err);
      }
    } catch (e) {
      console.error("ERROR CARGANDO PROFILES:", e);
      setProfiles([]);
    }

    setLoading(false);
  };

  fetchProfiles();
}, []);


  // ─────────────────────────────
  // MÉTRICAS BÁSICAS
  // ─────────────────────────────
  const totalUsuarios = profiles.length;
  const totalPacientes = profiles.filter((p) => p.role === 'paciente').length;
  const totalMedicos = profiles.filter((p) => p.role === 'medico').length;
  const totalAdmins = profiles.filter((p) => p.role === 'admin').length;

  // approved === true -> cédula válida, cualquier otro valor -> pendiente
  const medicosPendientes = profiles.filter(
    (p) => p.role === 'medico' && !p.approved
  ).length;

  // Si status está en NULL, lo contamos como activo por defecto
  const activos = profiles.filter(
    (p) => p.status === 'activo' || p.status === null || p.status === ''
  ).length;

  const inactivos = profiles.filter(
    (p) => p.status !== null && p.status !== '' && p.status !== 'activo'
  ).length;

  const todayStr = new Date().toDateString();

  const nuevosHoy = profiles.filter(
    (p) => new Date(p.created_at).toDateString() === todayStr
  ).length;

  const nuevosMedicosHoy = profiles.filter(
    (p) =>
      p.role === 'medico' &&
      new Date(p.created_at).toDateString() === todayStr
  ).length;

  const ultimosUsuarios = profiles
    .slice()
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  // ─────────────────────────────
  // DATOS PARA GRÁFICAS
  // ─────────────────────────────
  const monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  const monthMap: Record<
    string,
    { label: string; usuarios: number; medicos: number }
  > = {};

  profiles.forEach((p) => {
    const d = new Date(p.created_at);
    if (isNaN(d.getTime())) return;

    const key = `${d.getFullYear()}-${d.getMonth()}`;

    if (!monthMap[key]) {
      monthMap[key] = {
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        usuarios: 0,
        medicos: 0,
      };
    }

    monthMap[key].usuarios += 1;
    if (p.role === 'medico') monthMap[key].medicos += 1;
  });

  const lineData = Object.entries(monthMap)
    .sort(([a], [b]) => {
      const [ay, am] = a.split('-').map(Number);
      const [by, bm] = b.split('-').map(Number);
      return ay === by ? am - bm : ay - by;
    })
    .map(([, v]) => v);

  // Dona: distribución por rol
  const pieData = [
    { name: 'Pacientes', value: totalPacientes },
    { name: 'Médicos', value: totalMedicos },
    { name: 'Admins', value: totalAdmins },
  ].filter((d) => d.value > 0);

  const pieColors = ['#0ea5e9', '#22c55e', '#6366f1'];

  // Barras: estado de usuarios
  const barData = [
    { name: 'Activos', value: activos },
    { name: 'Inactivos', value: inactivos },
  ];

  // ─────────────────────────────
  // LOADING
  // ─────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
          <p className="text-sm">Cargando resumen del panel…</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────
  // RENDER
  // ─────────────────────────────
  return (
    <div className="relative min-h-full px-2 sm:px-4 lg:px-6 py-4">
      {/* Halo suave, mismo mood que Perfil/Admin */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 flex justify-center opacity-80">
        <div className="h-40 w-[620px] rounded-full bg-gradient-to-r from-sky-400/35 via-sky-500/35 to-emerald-400/40 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* TÍTULO / INTRO */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">
            Dashboard del administrador
          </h1>
          <p className="text-sm text-sky-700">
            Visualiza de un vistazo el estado de usuarios, médicos y actividad
            reciente.
          </p>
        </motion.div>

        {/* BARRA “HOY TIENES…” */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 sm:grid-cols-3"
        >
          <div className="rounded-2xl bg-white/95 backdrop-blur border border-sky-100/70 px-4 py-3 flex items-center justify-between shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">
                Nuevos registros hoy
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {nuevosHoy}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/95 backdrop-blur border border-emerald-100/70 px-4 py-3 flex items-center justify-between shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                Médicos pendientes
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {medicosPendientes}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/95 backdrop-blur border border-slate-100 px-4 py-3 flex items-center justify-between shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Usuarios activos
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {activos}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* TARJETAS RESUMEN GRANDES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <Card
            title="Usuarios totales"
            value={totalUsuarios}
            icon={<Users size={22} />}
            color="from-sky-500 to-emerald-500"
          />
          <Card
            title="Pacientes registrados"
            value={totalPacientes}
            icon={<UserCheck size={22} />}
            color="from-teal-500 to-emerald-500"
          />
          <Card
            title="Médicos registrados"
            value={totalMedicos}
            icon={<Activity size={22} />}
            color="from-cyan-500 to-sky-500"
          />
          <Card
            title="Médicos pendientes"
            value={medicosPendientes}
            icon={<Clock size={22} />}
            color="from-amber-400 to-orange-500"
          />
        </div>

        {/* GRID: GRÁFICAS + TABLAS */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
          {/* Columna izquierda: gráficas */}
          <div className="space-y-5">
            {/* Línea: evolución usuarios/médicos */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Evolución de registros
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Usuarios y médicos registrados por mes.
                  </p>
                </div>
              </div>

              {lineData.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Aún no hay suficientes datos para mostrar la gráfica.
                </p>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="usuarios"
                        name="Usuarios"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="medicos"
                        name="Médicos"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            {/* Barras: estado de usuarios */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Estado de las cuentas
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Comparación entre usuarios activos e inactivos.
                  </p>
                </div>
              </div>

              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill="#22c55e" />
                      <Cell fill="#64748b" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

          {/* Columna derecha: pie + últimos usuarios */}
          <div className="space-y-5">
            {/* Dona: distribución de roles */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Distribución por rol
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Pacientes, médicos y administradores en el sistema.
                  </p>
                </div>
              </div>

              {pieData.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Aún no hay datos para mostrar la gráfica.
                </p>
              ) : (
                <div className="h-56 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={pieColors[index % pieColors.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            {/* Últimos usuarios */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Últimos usuarios registrados
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Vista rápida de quienes se han unido recientemente.
                  </p>
                </div>
              </div>

              <ul className="space-y-3">
                {ultimosUsuarios.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-sky-50/60 px-4 py-3 hover:bg-sky-100/70 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">
                        {u.nombre} {u.apellido}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">
                        {u.email}
                      </p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                        u.role === 'medico'
                          ? 'bg-cyan-100 text-cyan-800'
                          : u.role === 'admin'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-sky-800'
                      }`}
                    >
                      {u.role === 'medico' && (
                        <Activity className="h-3.5 w-3.5" />
                      )}
                      {u.role === 'admin' && <Users className="h-3.5 w-3.5" />}
                      {u.role === 'paciente' && <UserX className="h-3.5 w-3.5" />}
                      <span className="capitalize">{u.role}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* MÉDICOS PENDIENTES – SECCIÓN FINAL */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Médicos pendientes de aprobación
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Revisa y aprueba a los médicos que aún no tienen acceso
                completo.
              </p>
            </div>

            <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1">
              Pendientes: {medicosPendientes}
            </span>
          </div>

          {medicosPendientes === 0 ? (
            <p className="text-slate-500 text-sm italic">
              No hay médicos pendientes. Todo está al día. ✨
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-2">Nombre</th>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2 pr-2">Especialidad</th>
                    <th className="py-2 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {profiles
                    .filter((p) => p.role === 'medico' && !p.approved)
                    .map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-slate-50 hover:bg-sky-50/40 transition-colors"
                      >
                        <td className="py-2 pr-2">
                          <span className="font-medium text-slate-800">
                            {m.nombre} {m.apellido}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-slate-600">
                          {m.email}
                        </td>
                        <td className="py-2 pr-2 text-slate-600">
                          {m.especialidad || '—'}
                        </td>
                        <td className="py-2 text-right">
                          <button
                            onClick={() => approveDoctor(m.id)}
                            className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:brightness-105 transition"
                          >
                            Aprobar
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

async function approveDoctor(id: string) {
  await supabase.from('profiles').update({ approved: true }).eq('id', id);
  window.location.reload();
}

/* TARJETA REUTILIZABLE con estilo tipo perfil */
function Card({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: any;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 flex items-center justify-between"
    >
      {/* franja de color abajo, usando el gradiente recibido */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r ${color}`}
      />

      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {title}
        </p>
        <p className="text-3xl font-semibold text-slate-900">{value}</p>
      </div>

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-md`}
      >
        {icon}
      </div>
    </motion.div>
  );
}
