'use client';

import { Bell, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Profile {
  nombre: string | null;
  apellido: string | null;
  avatar_url?: string | null;
}

export default function HeaderMedico() {
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
        .select('nombre, apellido, avatar_url')
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
      className="sticky top-0 z-50 bg-gradient-to-r
      from-teal-500 via-cyan-500 to-blue-600
      text-white px-6 py-3 border-b border-white/20
      shadow-[0_3px_12px_rgba(0,0,0,0.22)]
      flex items-center justify-between"
    >
      {/* Título dinámico */}
      <div className="flex flex-col leading-tight">
        <h1 className="text-lg font-semibold tracking-tight">
          Panel del médico
        </h1>

        {profile?.nombre && (
          <p className="text-xs text-white/90 mt-0.5">
            Bienvenido, Dr. {profile.nombre} {profile.apellido}
          </p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-3">


        {/* Avatar */}
        <div
          className="h-9 w-9 overflow-hidden rounded-full bg-white
          border border-white/30 flex items-center justify-center"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="text-white/90" />
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm px-3 py-1.5
          bg-white/15 hover:bg-white/25 transition rounded-lg font-medium"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </div>
    </header>
  );
}
