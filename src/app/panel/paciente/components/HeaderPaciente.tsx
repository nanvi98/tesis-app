
'use client';

import { LogOut, User, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Profile {
  nombre: string | null;
  apellido: string | null;
  foto_url?: string | null;
}

export default function HeaderPaciente() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchPerfil() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('nombre, apellido, foto_url')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(data);
    }

    fetchPerfil();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <header
      className="
      sticky top-0 z-[999] backdrop-blur-xl
      px-6 py-4 border-b border-white/20
      bg-white/5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]
      bg-gradient-to-r from-teal-600/90 via-cyan-500/90 to-blue-600/90
      flex items-center justify-between
      "
    >
      {/* panel title */}
      <div className="flex flex-col leading-tight select-none">
        <h1
          className="text-xl sm:text-2xl font-bold text-white
          tracking-tight drop-shadow-sm"
        >
          Panel del Paciente
        </h1>

        {profile?.nombre && (
          <p
            className="text-xs sm:text-sm mt-1 text-white/90
            font-light tracking-wide flex items-center gap-1"
          >
            Bienvenido(a),
            <span className="font-semibold">
              {profile.nombre} {profile.apellido}
            </span>
            👋
          </p>
        )}
      </div>

      {/* right actions */}
      <div className="flex items-center gap-4">

        {/* notifications future */}
        <button
          className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors shadow
          hidden sm:block"
        >
          <Bell className="h-5 w-5 text-white" />
        </button>

        {/* avatar */}
        <div
          className="relative h-11 w-11 rounded-full overflow-hidden
          bg-white/20 border border-white/40 shadow-lg"
        >
          {profile?.foto_url ? (
            <img
              src={profile.foto_url}
              className="object-cover w-full h-full"
            />
          ) : (
            <User className="absolute inset-0 m-auto h-6 w-6 text-white" />
          )}

          {/* glow ring */}
          <div className="absolute inset-0 rounded-full border border-white/40 animate-pulse" />
        </div>

        {/* logout */}
        <button
          onClick={logout}
          className="
          px-4 py-2 text-sm font-semibold
          rounded-xl shadow-lg bg-white/15 hover:bg-white/25
          text-white flex items-center gap-2 tracking-wide
          "
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </div>
    </header>
  );
}
