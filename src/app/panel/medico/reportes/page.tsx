'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import {
  Activity,
  BarChart3,
  Clock3,
  Download,
  PieChart as PieIcon,
  Users,
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
  Legend,
  Bar,
  BarChart
} from 'recharts';

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

interface Paciente {
  id: string;
  paciente: {
    id: string;
    sexo: string | null;
    requiere_estudio: boolean | null;
    fecha_registro: string;
  };

}

interface Consulta {
  id: string;
  paciente_id: string;
  fecha: string;
}

interface MonthlyPoint {
  mes: string; // ej. "Nov 24"
  pacientes: number;
  consultas: number;
}

type PieItem = {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
};

interface ActividadItem {
  tipo: 'paciente' | 'consulta';
  fecha: string;
  descripcion: string;
}

// Colores clínicos coherentes con tu panel
const COLORS = {
  cyan: '#08B6D8',
  cyanSoft: '#22C4E3',
  emerald: '#10B981',
  orange: '#FDBA74',
  purple: '#A855F7',
  slate: '#64748B',
};

// ─────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────

export default function ReportesMedicoPage() {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);

  // Filtro de rango en meses (3, 6, 12)
  const [rangoMeses, setRangoMeses] = useState<3 | 6 | 12>(6);

  // ─────────────────────────────────────
  // Carga de datos desde Supabase
  // ─────────────────────────────────────

  useEffect(() => {
    async function cargarDatos() {
      try {
        setLoading(true);
        setErrorMsg(null);

        const { data: authData, error: authError } = await supabase.auth.getUser();

        if (authError) {
          console.error('Error obteniendo usuario:', authError);
          setErrorMsg('No se pudo obtener el usuario autenticado.');
          return;
        }

        const user = authData?.user;
        if (!user) {
          setErrorMsg('No se encontró usuario autenticado.');
          return;
        }

        // IMPORTANTE: revisa qué guardas en medico_id
        // - Si en medico_id guardas el UUID del usuario -> usa user.id
        // - Si en medico_id guardas el correo del médico -> usa user.email
        const medicoIdentificador = user.id; // cámbialo a user.email si fuera necesario

        // 1) Pacientes del médico
        const {
          data: pacientesData,
          error: errorPacientes,
        } = await supabase
          .from('pacientes')
          .select('id, sexo, requiere_estudio, fecha_registro')
          .eq('medico_id', user.id);

        if (errorPacientes && errorPacientes.message) {
          console.error('Error cargando pacientes del médico:', errorPacientes);
          setErrorMsg('Ocurrió un error al cargar los pacientes.');
          setPacientes([]);
          setConsultas([]);
          return; // salimos sin lanzar throw para no romper la página
        }
const pacientesIds = (pacientesData ?? []).map((p) => p.id);
        // 2) Consultas de esos pacientes
        let consultasData: Consulta[] = [];
        if (pacientesIds.length > 0) {
          const {
            data: consData,
            error: errorConsultas,
          } = await supabase
            .from('consultas')
            .select('id, paciente_id, fecha')
            .in('paciente_id', pacientesIds);


          if (errorConsultas) {
            console.error('Error cargando consultas del médico:', errorConsultas);
            setErrorMsg('Ocurrió un error al cargar las consultas.');
            setPacientes([]);
            setConsultas([]);
            return;
          }

          consultasData = (consData ?? []) as Consulta[];
        }

        setPacientes(
          (pacientesData ?? []).map((p: any) => ({
            id: p.id,
            paciente: {
              id: p.id,
              sexo: p.sexo,
              requiere_estudio: p.requiere_estudio,
              fecha_registro: p.fecha_registro,
            },
          }))
        )
        setConsultas(consultasData);
      } catch (err) {
        console.error('Error cargando reportes del médico (catch):', err);
        setErrorMsg('Ocurrió un error al cargar los reportes.');
      } finally {
        setLoading(false);
      }
    }

    void cargarDatos();
  }, []);

  // ─────────────────────────────────────
  // Cálculos básicos
  // ─────────────────────────────────────

  const hoy = useMemo(() => new Date(), []);
  const hace30dias = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const totalPacientes = pacientes.length;
  const requierenEstudio = pacientes.filter((p) => p.paciente.requiere_estudio).length;
  const totalConsultas = consultas.length;

  const pacientesUltimos30 = pacientes.filter((p) => {
    const f = new Date(p.paciente.fecha_registro);
    return f >= hace30dias;
  }).length;

  const consultasUltimos30 = consultas.filter((c) => {
    const f = new Date(c.fecha);
    return f >= hace30dias;
  }).length;

  // ─────────────────────────────────────
  // Series mensuales (últimos N meses)
  // ─────────────────────────────────────

  const monthlyData: MonthlyPoint[] = useMemo(() => {
    const buckets: Record<string, { pacientes: number; consultas: number }> = {};

    const addToBucket = (date: Date, key: 'pacientes' | 'consultas') => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const bucketKey = `${year}-${month}`;
      if (!buckets[bucketKey]) {
        buckets[bucketKey] = { pacientes: 0, consultas: 0 };
      }
      buckets[bucketKey][key]++;
    };

    pacientes.forEach((p) => {
      const d = new Date(p.paciente.fecha_registro);
      addToBucket(d, 'pacientes');
    });

    consultas.forEach((c) => {
      const d = new Date(c.fecha);
      addToBucket(d, 'consultas');
    });

    const meses: MonthlyPoint[] = [];
    const mesesLabels = [
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

    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = buckets[key] || { pacientes: 0, consultas: 0 };

      meses.push({
        mes: `${mesesLabels[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`,
        pacientes: bucket.pacientes,
        consultas: bucket.consultas,
      });
    }

    const sliced =
      rangoMeses === 3
        ? meses.slice(-3)
        : rangoMeses === 6
          ? meses.slice(-6)
          : meses;

    return sliced;
  }, [pacientes, consultas, rangoMeses]);

  // ─────────────────────────────────────
  // Distribución por sexo
  // ─────────────────────────────────────

  const sexoData: PieItem[] = useMemo(() => {
    let masc = 0;
    let fem = 0;
    let otro = 0;

    pacientes.forEach((p) => {
      const s = (p.paciente.sexo || '').toLowerCase();
      if (s.startsWith('m')) masc++;
      else if (s.startsWith('f')) fem++;
      else otro++;
    });

    const data: PieItem[] = [];
    if (masc > 0) data.push({ name: 'Masculino', value: masc, color: COLORS.cyan });
    if (fem > 0) data.push({ name: 'Femenino', value: fem, color: COLORS.purple });
    if (otro > 0)
      data.push({
        name: 'Otro / No especificado',
        value: otro,
        color: COLORS.slate,
      });

    return data;
  }, [pacientes]);

  // ─────────────────────────────────────
  // Pacientes con estudios pendientes
  // ─────────────────────────────────────

  const estudiosData: PieItem[] = useMemo(() => {
    const pendientes = pacientes.filter((p) => p.paciente.requiere_estudio).length;
    const sinPendiente = pacientes.length - pendientes;

    return [
      {
        name: 'Con estudios pendientes',
        value: pendientes,
        color: COLORS.orange,
      },
      {
        name: 'Sin estudios pendientes',
        value: Math.max(sinPendiente, 0),
        color: COLORS.emerald,
      },
    ];
  }, [pacientes]);

  // ─────────────────────────────────────
  // Línea de actividad reciente
  // ─────────────────────────────────────

  const actividadReciente: ActividadItem[] = useMemo(() => {
    const eventos: ActividadItem[] = [];

    pacientes.forEach((p) => {
      eventos.push({
        tipo: 'paciente',
        fecha: p.paciente.fecha_registro,
        descripcion: 'Paciente registrado',
      });
    });

    consultas.forEach((c) => {
      eventos.push({
        tipo: 'consulta',
        fecha: c.fecha,
        descripcion: 'Consulta registrada',
      });
    });

    return eventos
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 6);
  }, [pacientes, consultas]);

  // ─────────────────────────────────────
  // Exportar PDF
  // ─────────────────────────────────────

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Reportes y analítica clínica', 14, 18);

    doc.setFontSize(11);
    doc.text(`Fecha de generación: ${hoy.toLocaleString('es-MX')}`, 14, 26);

    doc.setFontSize(13);
    doc.text('Resumen general', 14, 40);

    doc.setFontSize(11);
    doc.text(`Pacientes asignados: ${totalPacientes}`, 14, 48);
    doc.text(`Pacientes últimos 30 días: ${pacientesUltimos30}`, 14, 54);
    doc.text(
      `Pacientes que requieren estudio: ${requierenEstudio}`,
      14,
      60,
    );
    doc.text(`Consultas totales: ${totalConsultas}`, 14, 66);
    doc.text(
      `Consultas últimos 30 días: ${consultasUltimos30}`,
      14,
      72,
    );

    let y = 86;
    doc.setFontSize(13);
    doc.text('Actividad reciente', 14, 80);
    doc.setFontSize(11);

    if (actividadReciente.length === 0) {
      doc.text('No hay actividad registrada todavía.', 14, y);
    } else {
      actividadReciente.forEach((ev) => {
        const fechaStr = new Date(ev.fecha).toLocaleString('es-MX');
        doc.text(
          `• [${ev.tipo === 'paciente' ? 'Paciente' : 'Consulta'}] ${fechaStr} - ${ev.descripcion}`,
          14,
          y,
        );
        y += 6;
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
      });
    }

    doc.save('reportes-clinicos.pdf');
  };

  // ─────────────────────────────────────
  // Render
  // ─────────────────────────────────────

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-cyan-600" />
            Reportes y analítica clínica
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Resumen visual de la actividad de tus pacientes, consultas y
            estudios.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de rango */}
          <div className="flex items-center gap-1 rounded-2xl bg-white/80 shadow border border-slate-100 px-1 py-1">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setRangoMeses(m as 3 | 6 | 12)}
                className={`px-3 py-1 text-xs rounded-2xl font-medium transition ${rangoMeses === m
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                Últimos {m} meses
              </button>
            ))}
          </div>

          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-2xl shadow-md transition"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Mensaje error */}
      {errorMsg && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Resumen tarjetas */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <ResumenCard
          title="Pacientes asignados"
          icon={<Users className="w-5 h-5 text-cyan-600" />}
          value={totalPacientes}
          subtitle="Pacientes vinculados a tu panel."
          pill={
            pacientesUltimos30 > 0
              ? `+${pacientesUltimos30} en últimos 30 días`
              : 'Sin nuevos pacientes recientes'
          }
          pillColor={
            pacientesUltimos30 > 0
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-50 text-slate-500'
          }
        />
        <ResumenCard
          title="Requieren estudio"
          icon={<Activity className="w-5 h-5 text-orange-500" />}
          value={requierenEstudio}
          subtitle="Pacientes con estudios pendientes."
          pill={
            totalPacientes > 0
              ? `${((requierenEstudio / totalPacientes) * 100).toFixed(
                0,
              )}% de tus pacientes`
              : 'Sin pacientes registrados'
          }
          pillColor="bg-orange-50 text-orange-700"
        />
        <ResumenCard
          title="Consultas totales"
          icon={<BarChart3 className="w-5 h-5 text-emerald-600" />}
          value={totalConsultas}
          subtitle="Consultas registradas en el sistema."
          pill={
            consultasUltimos30 > 0
              ? `${consultasUltimos30} en últimos 30 días`
              : 'Sin consultas recientes aún'
          }
          pillColor={
            consultasUltimos30 > 0
              ? 'bg-cyan-50 text-cyan-700'
              : 'bg-slate-50 text-slate-500'
          }
        />
        <ResumenCard
          title="Consultas últimos 30 días"
          icon={<Clock3 className="w-5 h-5 text-purple-500" />}
          value={consultasUltimos30}
          subtitle="Actividad clínica reciente."
          pill={new Intl.DateTimeFormat('es-MX').format(hoy)}
          pillColor="bg-purple-50 text-purple-700"
        />
      </motion.div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Evolución mensual */}
        <motion.div
          className="bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-slate-100 p-4 md:p-5 flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-600" />
                Evolución mensual de pacientes y consultas
              </h2>
              <p className="text-xs text-slate-500">
                Nuevos pacientes y consultas registradas en el periodo
                seleccionado.
              </p>
            </div>
          </div>

          <div className="h-64">
            {monthlyData.length === 0 ? (
              <EstadoVacio mensaje="Aún no hay suficientes datos para mostrar esta gráfica." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="mes" stroke="#94A3B8" />
                  <YAxis allowDecimals={false} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{ fontSize: 11 }}
                    formatter={(value) => [value as number, '']}
                  />
                  <Legend
                    formatter={(v) =>
                      v.charAt(0).toUpperCase() + v.slice(1)
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="pacientes"
                    name="Pacientes"
                    stroke={COLORS.cyan}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="consultas"
                    stroke={COLORS.emerald}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Consultas"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Pacientes pendientes estudios */}
        <motion.div
          className="bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-slate-100 p-4 md:p-5 flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500" />
                Pacientes con estudios pendientes
              </h2>
              <p className="text-xs text-slate-500">
                Comparación entre pacientes con estudios pendientes y sin
                estudios.
              </p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            {totalPacientes === 0 ? (
              <EstadoVacio mensaje="Aún no tienes pacientes registrados." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estudiosData}
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {estudiosData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, '']} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-slate-600">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>

      {/* Distribución + Actividad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Distribución por sexo */}
        <motion.div
          className="bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-slate-100 p-4 md:p-5 flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-500" />
                Distribución por sexo
              </h2>
              <p className="text-xs text-slate-500">
                Composición de tus pacientes por sexo registrado.
              </p>
            </div>
          </div>

          <div className="h-52 flex items-center justify-center">
            {sexoData.length === 0 ? (
              <EstadoVacio mensaje="Aún no hay datos suficientes para mostrar la distribución." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sexoData}
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sexoData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}`, '']} />
                  <Legend
                    verticalAlign="bottom"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Consultas últimas 30 días (stats simple) */}
        <motion.div
          className="bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-slate-100 p-4 md:p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-600" />
                Consultas últimos 30 días
              </h2>
              <p className="text-xs text-slate-500">
                Actividad clínica reciente por día.
              </p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consultas.map(c => ({
                fecha: new Date(c.fecha).toLocaleDateString('es-MX'),
                value: 1
              }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>


        {/* Línea de tiempo */}
        <motion.div
          className="bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-slate-100 p-4 md:p-5 flex flex-col"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-emerald-600" />
                Línea de actividad reciente
              </h2>
              <p className="text-xs text-slate-500">
                Últimos eventos de registro de pacientes y consultas.
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-56 pr-1">
            {actividadReciente.length === 0 ? (
              <EstadoVacio mensaje="No hay actividad registrada todavía." />
            ) : (
              actividadReciente.map((ev, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-slate-700"
                >
                  <div
                    className={`mt-0.5 h-2 w-2 rounded-full ${ev.tipo === 'paciente'
                      ? 'bg-cyan-500'
                      : 'bg-emerald-500'
                      }`}
                  />
                  <div>
                    <p className="font-semibold text-slate-800">
                      {ev.tipo === 'paciente'
                        ? 'Nuevo paciente'
                        : 'Nueva consulta'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(ev.fecha).toLocaleString('es-MX')}
                    </p>
                    <p className="text-[11px]">{ev.descripcion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Si quieres, abajo luego podemos agregar exportaciones avanzadas, filtros por paciente, etc. */}
    </div>
  );
}

// ─────────────────────────────────────────────
// Componentes auxiliares
// ─────────────────────────────────────────────

interface ResumenCardProps {
  title: string;
  icon: React.ReactNode;
  value: number;
  subtitle: string;
  pill: string;
  pillColor: string;
}

function ResumenCard({
  title,
  icon,
  value,
  subtitle,
  pill,
  pillColor,
}: ResumenCardProps) {
  return (
    <motion.div
      className="bg-white/95 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.08)] border border-slate-100 px-4 py-4 flex flex-col gap-2"
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </div>
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-slate-50">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <span
        className={`inline-flex mt-1 items-center self-start rounded-2xl px-2.5 py-1 text-[11px] font-medium ${pillColor}`}
      >
        {pill}
      </span>
    </motion.div>
  );
}

function EstadoVacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <p className="text-xs text-slate-400 italic text-center px-4">
        {mensaje}
      </p>
    </div>
  );
}
