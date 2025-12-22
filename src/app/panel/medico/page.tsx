'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import {
  Users,
  ClipboardList,
  HeartPulse,
  Activity,
  Calendar,
  Loader2,
  AlertTriangle,
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

interface MedicoPaciente {
  id: string;
  medico_id: string;
  paciente_id: string | null;
  nombre: string | null;
  sexo: string | null;
  requiere_estudio: boolean | null;
  fecha_registro: string;
}

export default function PanelMedicoPage() {
  const [medicoPacientes, setMedicoPacientes] = useState<MedicoPaciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [medicoNombre, setMedicoNombre] = useState<string>('');

  useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);

    // 1) Usuario actual
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setErrorMsg('No se pudo obtener el usuario autenticado.');
      setLoading(false);
      return;
    }

    // 2) Nombre del médico desde profiles
    const { data: perfil } = await supabase
      .from('profiles')
      .select('nombre, apellido')
      .eq('id', user.id)
      .maybeSingle();

    if (perfil) {
      const nombreCompleto = `${perfil.nombre || ''} ${
        perfil.apellido || ''
      }`.trim();
      setMedicoNombre(nombreCompleto || 'Médico');
    }

    // 3) Pacientes asignados a este médico
    //    👉 aquí simplificamos a select('*') para evitar errores de columnas
    const {
      data: pacientesData,
      error: pacientesError,
    } = await supabase
      .from('pacientes')
      .select('id, nombre, sexo, requiere_estudio, fecha_registro')
      .eq('medico_id', user.id);

    if (pacientesError) {
      // Solo avisamos en consola, sin romper el panel
      console.warn(
        'No se pudieron cargar medico_pacientes:',
        JSON.stringify(pacientesError, null, 2)
      );
      setMedicoPacientes([]);
      setLoading(false);
      return;
    }

    setMedicoPacientes((pacientesData || []) as MedicoPaciente[]);
    setLoading(false);
  };

  fetchData();
  }, []);


  // ─────────────────────────────
  // MÉTRICAS
  // ─────────────────────────────
  const totalPacientes = medicoPacientes.length;

  const hoy = new Date().toISOString().slice(0,10);
  const nuevosHoy = medicoPacientes.filter((p) => {
    const fechaPaciente = p.fecha_registro?.slice(0, 10);
    return fechaPaciente === hoy;
  }
  ).length;

  const requierenEstudio = medicoPacientes.filter(
    (p) => p.requiere_estudio === true
  ).length;

  const sinEstudio = totalPacientes - requierenEstudio;

  // Pacientes por sexo
  const totalHombres = medicoPacientes.filter(
    (p) => (p.sexo || '').toLowerCase().startsWith('m')
  ).length;

  const totalMujeres = medicoPacientes.filter(
    (p) => (p.sexo || '').toLowerCase().startsWith('f')
  ).length;

  const totalOtro = totalPacientes - totalHombres - totalMujeres;

  // Últimos pacientes
  const ultimosPacientes = medicoPacientes
    .slice()
    .sort(
      (a, b) =>
        new Date(b.fecha_registro).getTime() -
        new Date(a.fecha_registro).getTime()
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
    { label: string; pacientes: number; conEstudio: number }
  > = {};

  medicoPacientes.forEach((p) => {
    const d = new Date(p.fecha_registro);
    if (isNaN(d.getTime())) return;

    const key = `${d.getFullYear()}-${d.getMonth()}`;

    if (!monthMap[key]) {
      monthMap[key] = {
        label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
        pacientes: 0,
        conEstudio: 0,
      };
    }

    monthMap[key].pacientes += 1;
    if (p.requiere_estudio) monthMap[key].conEstudio += 1;
  });

  const lineData = Object.entries(monthMap)
    .sort(([a], [b]) => {
      const [ay, am] = a.split('-').map(Number);
      const [by, bm] = b.split('-').map(Number);
      return ay === by ? am - bm : ay - by;
    })
    .map(([, v]) => v);

  // Dona: distribución por sexo
  const pieData = [
    { name: 'Hombres', value: totalHombres },
    { name: 'Mujeres', value: totalMujeres },
    { name: 'Otro / No especificado', value: totalOtro },
  ].filter((d) => d.value > 0);

  const pieColors = ['#0ea5e9', '#ec4899', '#64748b'];

  // Barras: estudio vs no
  const barData = [
    { name: 'Requieren estudio', value: requierenEstudio },
    { name: 'Sin estudio pendiente', value: sinEstudio },
  ];

  // ─────────────────────────────
  // LOADING / ERROR
  // ─────────────────────────────
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-sky-500" />
          <p className="text-sm">Cargando tu panel médico…</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/90 px-6 py-5 shadow-lg border border-rose-100 max-w-md text-center">
          <AlertTriangle className="h-7 w-7 text-rose-500" />
          <p className="text-sm text-slate-700">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────
  // RENDER PRINCIPAL (MISMO FORMATO QUE ADMIN)
  // ─────────────────────────────
  return (
    <div className="relative min-h-full px-2 sm:px-4 lg:px-6 py-4">
      {/* Halo suave igual que dashboard admin */}
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
            Panel del médico
          </h1>
          <p className="text-sm text-sky-700">
            Bienvenido, {medicoNombre || 'Médico'}. Aquí puedes ver un resumen
            de tus pacientes y su estado clínico.
          </p>
        </motion.div>

        {/* BARRA “HOY TIENES…” (3 TARJETAS) */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid gap-3 sm:grid-cols-3"
        >
          <div className="rounded-2xl bg-white/95 backdrop-blur border border-sky-100/70 px-4 py-3 flex items-center justify-between shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-600">
                Pacientes nuevos hoy
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
                Pacientes que requieren estudio
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {requierenEstudio}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-2xl bg-white/95 backdrop-blur border border-slate-100 px-4 py-3 flex items-center justify-between shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                Pacientes asignados
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {totalPacientes}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <HeartPulse className="h-5 w-5" />
            </div>
          </div>
        </motion.div>

        {/* TARJETAS GRANDES (4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          <Card
            title="Pacientes totales"
            value={totalPacientes}
            icon={<Users size={22} />}
            color="from-sky-500 to-emerald-500"
          />
          <Card
            title="Requieren estudio"
            value={requierenEstudio}
            icon={<ClipboardList size={22} />}
            color="from-teal-500 to-emerald-500"
          />
          <Card
            title="Pacientes nuevos hoy"
            value={nuevosHoy}
            icon={<Calendar size={22} />}
            color="from-cyan-500 to-sky-500"
          />
          <Card
            title="Sin estudio pendiente"
            value={sinEstudio}
            icon={<Activity size={22} />}
            color="from-amber-400 to-orange-500"
          />
        </div>

        {/* GRID: GRÁFICAS + LISTAS */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
          {/* Columna izquierda: gráficas */}
          <div className="space-y-5">
            {/* Línea: evolución pacientes */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Evolución de pacientes
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Pacientes asignados y con estudios pendientes por mes.
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
                        dataKey="pacientes"
                        name="Pacientes"
                        stroke="#0ea5e9"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="conEstudio"
                        name="Con estudio pendiente"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.div>

            {/* Barras: estudio vs no */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Estatus de estudios
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Comparación entre pacientes con estudios pendientes y sin
                    estudios.
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

          {/* Columna derecha: dona + últimos pacientes */}
          <div className="space-y-5">
            {/* Dona: sexo */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Distribución por sexo
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Composición de tus pacientes por sexo registrado.
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

            {/* Últimos pacientes */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-4 sm:p-5"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-slate-900">
                    Últimos pacientes registrados
                  </h2>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Vista rápida de los pacientes que se han añadido
                    recientemente a tu lista.
                  </p>
                </div>
              </div>

              {ultimosPacientes.length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Aún no tienes pacientes registrados.
                </p>
              ) : (
                <ul className="space-y-3">
                  {ultimosPacientes.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-sky-50/60 px-4 py-3 hover:bg-sky-100/70 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {p.nombre || 'Paciente sin nombre'}
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500">
                          Sexo:{' '}
                          {p.sexo
                            ? p.sexo
                            : 'No especificado'}{' '}
                          · Registrado el{' '}
                          {new Date(
                            p.fecha_registro
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                          p.requiere_estudio
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.requiere_estudio
                          ? 'Estudio pendiente'
                          : 'Sin estudio'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </div>
        </div>

        {/* SECCIÓN FINAL: PACIENTES PENDIENTES DE REVISIÓN */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] p-5"
        >
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900">
                Pacientes pendientes de revisión
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Pacientes con estudios o seguimiento clínico pendiente.
              </p>
            </div>

            <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1">
              Pendientes: {requierenEstudio}
            </span>
          </div>

          {requierenEstudio === 0 ? (
            <p className="text-slate-500 text-sm italic">
              No hay pacientes pendientes de revisión. Todo está al día. ✨
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-2">Paciente</th>
                    <th className="py-2 pr-2">Sexo</th>
                    <th className="py-2 pr-2">Fecha registro</th>
                    <th className="py-2 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {medicoPacientes
                    .filter((p) => p.requiere_estudio)
                    .sort(
                      (a, b) =>
                        new Date(b.fecha_registro).getTime() -
                        new Date(a.fecha_registro).getTime()
                    )
                    .map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-slate-50 hover:bg-sky-50/40 transition-colors"
                      >
                        <td className="py-2 pr-2">
                          <span className="font-medium text-slate-800">
                            {p.nombre || 'Paciente sin nombre'}
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-slate-600">
                          {p.sexo || '—'}
                        </td>
                        <td className="py-2 pr-2 text-slate-600">
                          {new Date(
                            p.fecha_registro
                          ).toLocaleDateString()}
                        </td>
                        <td className="py-2 text-right">
                          <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-xs font-semibold">
                            En revisión
                          </span>
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

/* TARJETA REUTILIZABLE, MISMO ESTILO QUE EN ADMIN */
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
