'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  LifeBuoy,
  UserCog,
} from 'lucide-react';

const menu = [
  {
    label: 'Inicio',
    href: '/panel/paciente',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Mi expediente',
    href: '/panel/paciente/expediente',
    icon: <FileText size={18} />,
  },
  {
    label: 'Mis citas',
    href: '/panel/paciente/citas',
    icon: <Calendar size={18} />,
  },
  {
    label: 'Soporte',
    href: '/panel/paciente/soporte',
    icon: <LifeBuoy size={18} />,
  },
  {
    label: 'Mi perfil',
    href: '/panel/paciente/perfil',
    icon: <UserCog size={18} />,
  },
];

export default function SidebarPaciente() {
  const path = usePathname();

  return (
    <aside
      className="w-[240px] hidden sm:flex flex-col bg-gradient-to-b 
      from-teal-600 via-cyan-500 to-blue-600 text-white py-6 shadow-2xl"
    >
      {/* HEADER */}
      <div className="px-6 mb-8 text-center">
        <div className="flex justify-center mb-2">
          <LayoutDashboard size={36} className="text-white drop-shadow-md" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          Panel Paciente
        </h2>
      </div>

      {/* NAV MENU */}
      <nav className="flex flex-col gap-1 px-3">
        {menu.map(item => {
          const active = path.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm
                ${
                  active
                    ? 'bg-white/90 text-slate-900 font-semibold shadow-md'
                    : 'text-white/90 hover:bg-white/20 hover:backdrop-blur'
                }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* FOOTER */}
      <p className="px-6 text-xs text-white/70">
        © 2025 Paciente
      </p>
    </aside>
  );
}
