'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  UserCheck,
  Settings,
  MessageSquare,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

const menu = [
  { name: 'Dashboard', icon: Home, path: '/admin' },
  { name: 'Usuarios', icon: Users, path: '/admin/usuarios' },
  { name: 'Médicos', icon: UserCheck, path: '/admin/medicos' },
  //{ name: 'Catálogos', icon: Settings, path: '/admin/catalogos' },//
  { name: 'Soporte', icon: MessageSquare, path: '/admin/soporte' },
  { name: 'Crear Admin', icon: ShieldCheck, path: '/admin/crear-admin' },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setAdmin(data);
      }
    };
    fetchAdmin();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside
      className="
        w-64 h-full flex flex-col relative px-5 py-6
        backdrop-blur-2xl 
        bg-white/20 
        border-r border-white/30
        shadow-[10px_0_35px_-5px_rgba(0,0,0,0.07)]
      "
    >
      {/* Halo detrás del sidebar */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300/20 via-cyan-300/10 to-teal-300/20 opacity-70 blur-2xl -z-10" />

      {/* LOGO */}
      <h2 className="text-2xl font-bold text-sky-700 text-center tracking-tight drop-shadow-sm">
        Admin Panel
      </h2>

      {/* FOTO DE PERFIL */}
      <div className="flex flex-col items-center mt-6 mb-3">
        <div className="
          h-20 w-20 rounded-full overflow-hidden 
          shadow-lg border border-white/40
          bg-white/40 backdrop-blur
        ">
          <img
            src={admin?.foto_url || '/avatar.png'}
            alt="avatar"
            className="h-full w-full object-cover"
          />
        </div>

        <p className="mt-2 text-slate-800 font-semibold">
          {admin?.nombre || 'Admin'}
        </p>
        <p className="text-xs text-sky-700 font-medium -mt-1">
          {admin?.role || 'Administrador'}
        </p>
      </div>

      {/* Menú */}
      <nav className="flex flex-col gap-1 mt-4">
        {menu.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.path;

          return (
            <button
              key={item.name}
              onClick={() => router.push(item.path)}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all
                ${active
                  ? 'bg-gradient-to-r from-sky-300/40 to-teal-300/40 text-sky-900 font-semibold shadow-md'
                  : 'text-slate-700 hover:bg-white/30 hover:shadow-sm'
                }
              `}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <p className="text-xs text-slate-500 mt-4 text-center">
        © 2025 — Panel Administrativo
      </p>
    </aside>
  );
}
