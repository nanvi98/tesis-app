'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Search,
  FileText,
  BarChart3,
  UserCog,
  LifeBuoy,
  Calendar,
  MessageCircle,
} from 'lucide-react';

const menu = [
  {
    label: 'Inicio',
    href: '/panel/medico',
    icon: <LayoutDashboard size={18} />,
  },
  {
    label: 'Citas',
    href: '/panel/medico/citas',
    icon: <Calendar size={18} />,
  },
  {
    label: 'Pacientes',
    icon: <Users size={18} />,
    children: [
      {
        label: 'Ver pacientes',
        href: '/panel/medico/pacientes',
        icon: <Users size={16} />,
      },
      {
        label: 'Agregar paciente',
        href: '/panel/medico/pacientes/agregar',
        icon: <UserCog size={16} />,
      },
    ],
  },
 /* {
    label: 'Chat',
    href: '/panel/medico/chat',
    icon: <MessageCircle size={18} />,
  },*/
  {
    label: 'Buscar paciente',
    href: '/panel/medico/buscar',
    icon: <Search size={18} />,
  },

  {
    label: 'Soporte',
    href: '/panel/medico/soporte',
    icon: <LifeBuoy size={18} />,
  },
  {
    label: 'Reportes',
    href: '/panel/medico/reportes',
    icon: <BarChart3 size={18} />,
  },
  {
    label: 'Mi Perfil',
    href: '/panel/medico/perfil',
    icon: <UserCog size={18} />,
  },
];

export default function SidebarMedico() {
  const path = usePathname();

  return (
    <aside
      className="w-[240px] hidden sm:flex flex-col bg-gradient-to-b 
      from-teal-600 via-cyan-500 to-blue-600 text-white py-6 shadow-2xl"
    >
      {/* HEADER */}
      <div className="px-6 mb-8 text-center">
        <div className="flex justify-center mb-2">
          <Users size={36} className="text-white drop-shadow-md" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          Panel Médico
        </h2>
      </div>

      {/* NAV MENU */}
      <nav className="flex flex-col gap-1 px-3">
        {menu.map(item => {

          // Parent or single item
          if (!item.children) {
            const active = path.startsWith(item.href ?? '');

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
          }

          // Submenu
          return (
            <div key={item.label} className="flex flex-col gap-1">
              <div
                className={`flex items-center gap-3 px-4 py-2 text-white/90 ${
                  path.startsWith('/panel/medico/pacientes')
                    ? 'font-semibold'
                    : ''
                }`}
              >
                {item.icon}
                {item.label}
              </div>

              {item.children.map(child => {
                const active = path.startsWith(child.href);

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={`ml-6 flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                      ${
                        active
                          ? 'bg-white/90 text-slate-900 font-semibold shadow-md'
                          : 'text-white/90 hover:bg-white/20'
                      }`}
                  >
                    {child.icon}
                    {child.label}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="flex-1" />

      {/* FOOTER */}
      <p className="px-6 text-xs text-white/70">
        © 2025 Médico
      </p>
    </aside>
  );
}
