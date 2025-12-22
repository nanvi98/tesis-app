'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import {
  Calendar,
  FileText,
  LifeBuoy,
  Stethoscope,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

export default function PanelPacientePage() {
  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState<any>(null);
  const [paciente, setPaciente] = useState<any>(null);
  const [consulta, setConsulta] = useState<any>(null);
  const [cita, setCita] = useState<any>(null);

  useEffect(() => {
    async function loadAll() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      // 1️⃣ Obtener perfil del usuario
      const { data: perfilData } = await supabase
        .from('profiles')
        .select('nombre, apellido, email')
        .eq('id', user.id)
        .single();
      setPerfil(perfilData);

      // 2️⃣ Buscar si el usuario ya está ligado a un paciente
      let { data: pacienteData } = await supabase
        .from('pacientes')
        .select('*')
        .eq('usuario_id', user.id)
        .maybeSingle();

      // 3️⃣ Si no está ligado, intentar empatar por correo
      if (!pacienteData && perfilData?.email) {
        const { data: match } = await supabase
          .from('pacientes')
          .select('*')
          .eq('correo', perfilData.email)
          .maybeSingle();

        if (match) {
          // Enlazar automáticamente
          await supabase
            .from('pacientes')
            .update({ usuario_id: user.id })
            .eq('id', match.id);

          pacienteData = match;
        }
      }

      setPaciente(pacienteData);

      // 4️⃣ Si existe paciente, cargar su última consulta
      if (pacienteData) {
        const { data: consultaData } = await supabase
          .from('consultas')
          .select('*')
          .eq('paciente_id', pacienteData.id)
          .order('fecha', { ascending: false })
          .limit(1)
          .maybeSingle();

        setConsulta(consultaData);

        // 5️⃣ Cargar la próxima cita
        const now = new Date().toISOString();

        const { data: citaData } = await supabase
          .from('citas')
          .select('*')
          .eq('paciente_id', pacienteData.id)
          .gt('fecha', now)
          .order('fecha', { ascending: true })
          .limit(1)
          .maybeSingle();

        setCita(citaData);
      }

      setLoading(false);
    }

    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
      </div>
    );
  }

  const nombreCompleto =
    (perfil?.nombre || '') + ' ' + (perfil?.apellido || '');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* Título */}
      <div className="text-center mt-6">
        <h1 className="text-3xl font-bold text-slate-900">
          Bienvenido(a), {nombreCompleto} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Accede fácilmente a tu información médica.
        </p>
      </div>

      {/* Grid tarjetas principales */}
      <div className="grid md:grid-cols-2 gap-5 px-4">

        <MainCard title="Próxima cita" icon={<Calendar size={22} />}>
          {cita ? (
            <>
              <p className="font-medium">
                {new Date(cita.fecha).toLocaleString('es-MX')}
              </p>
              <p className="text-sm text-slate-500">
                Estado: {cita.estado}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              No tienes citas programadas.
            </p>
          )}
        </MainCard>

        <MainCard title="Última consulta" icon={<Stethoscope size={22} />}>
          {consulta ? (
            <>
              <p className="font-medium">
                {new Date(consulta.fecha).toLocaleString('es-MX')}
              </p>
              {consulta.diagnostico && (
                <p className="text-sm text-slate-500">
                  Diagnóstico: {consulta.diagnostico}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Aún no tienes historial clínico.
            </p>
          )}
        </MainCard>
      </div>

      {/* Accesos rápidos */}
      <div className="grid sm:grid-cols-3 gap-4 px-4">
        <QuickLink href="/panel/paciente/expediente" icon={<FileText size={20} />}>
          Mi expediente
        </QuickLink>

        <QuickLink href="/panel/paciente/citas" icon={<Calendar size={20} />}>
          Mis citas
        </QuickLink>

        <QuickLink href="/panel/paciente/soporte" icon={<LifeBuoy size={20} />}>
          Soporte
        </QuickLink>
      </div>
    </div>
  );
}

function MainCard({ title, icon, children }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        rounded-3xl bg-white/95 backdrop-blur border border-slate-100/70
        shadow-[0_8px_20px_rgba(15,23,42,0.06)]
        p-5 space-y-2 flex flex-col gap-1
      "
    >
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
          {icon}
        </div>
      </div>
      {children}
    </motion.div>
  );
}

function QuickLink({ href, icon, children }: any) {
  return (
    <Link
      href={href}
      className="
        flex items-center gap-3 bg-white/95 rounded-2xl px-4 py-3
        shadow-md border border-slate-100 hover:bg-white transition
      "
    >
      <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
        {icon}
      </div>
      <span className="font-medium text-slate-800">{children}</span>
    </Link>
  );
}
