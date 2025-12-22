'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { LogOut, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Props {
  onLogout: () => void;
}

export default function Header({ onLogout }: Props) {
  const [admin, setAdmin] = useState<any>(null);

  const frases = [
    "Gracias por cuidar desde la tecnología y el corazón 💙",
    "Tu trabajo hace la diferencia cada día ✨",
    "Pequeños avances crean grandes resultados 🌿",
    "Hoy también estás haciendo un gran trabajo 🤍",
    "Construimos salud paso a paso, contigo 🌟",
  ];

  const [fraseIndex, setFraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFraseIndex((i) => (i + 1) % frases.length);
    }, 4200);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadAdmin();
  }, []);

  const loadAdmin = async () => {
    const { data: session } = await supabase.auth.getUser();
    const user = session?.user;

    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) setAdmin(profile);
  };

  return (
    <div className="relative z-20 mb-6">

      {/* HALO DIFUMINADO DE FONDO (como perfil) */}
      <div className="pointer-events-none absolute inset-0 flex justify-center -z-10">
        <div className="h-32 w-[700px] rounded-full bg-gradient-to-r from-sky-300/40 via-sky-400/40 to-teal-300/40 blur-3xl opacity-80" />
      </div>

      {/* HEADER COLORIDO — MISMO ESTILO DEL "HERO" DEL PERFIL */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="
          w-full
          rounded-3xl
          px-8 py-5
          shadow-[0_25px_65px_rgba(15,23,42,0.35)]
          bg-gradient-to-r from-sky-600 via-sky-500 to-teal-500
          text-white
          flex items-center justify-between
        "
      >
        {/* IZQUIERDA */}
        <div className="flex flex-col">
          {/* Nombre */}
          <motion.h1
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-semibold"
          >
            {admin?.titulo
              ? `${admin.titulo} ${admin.nombre}`
              : `Hola, ${admin?.nombre || 'Administrador'}`}
          </motion.h1>

          {/* Frase motivacional */}
          <motion.p
            key={fraseIndex}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="text-sm text-sky-50/90 mt-1"
          >
            {frases[fraseIndex]}
          </motion.p>
        </div>

        {/* DERECHA */}
        <div className="flex items-center gap-5">

          {/* Email y rol */}
          <div className="hidden sm:flex flex-col items-end">
            <p className="font-semibold text-white/90">{admin?.email}</p>
            <p className="text-xs text-white/70 capitalize">{admin?.role}</p>
          </div>

          {/* Avatar (click a perfil) */}
          <Link href="/admin/perfil">
            <div
              className="
                h-12 w-12 rounded-full overflow-hidden cursor-pointer
                shadow-md hover:shadow-lg hover:scale-105 transition
                bg-white/20 backdrop-blur-sm flex items-center justify-center
                border border-white/40
              "
              title="Ver perfil"
            >
              {admin?.foto_url ? (
                <img
                  src={admin.foto_url}
                  alt="avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-6 w-6 text-white/80" />
              )}
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="
              p-3 rounded-full 
              bg-rose-500 hover:bg-rose-600 
              text-white shadow-md transition
            "
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
