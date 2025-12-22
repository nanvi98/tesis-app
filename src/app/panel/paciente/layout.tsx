'use client';

import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SidebarPaciente from './components/SidebarPaciente';
import HeaderPaciente from './components/HeaderPaciente';

export default function PacienteLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validarUsuario() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return router.push('/');

      const { data: perfil } = await supabase
        .from('profiles')
        .select('id, role, nombre')
        .eq('id', user.id)
        .single();

      if (!perfil || perfil.role !== 'paciente')
        return router.push('/');

      setLoading(false);
    }

    validarUsuario();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center text-xl">
        Cargando...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-teal-100 overflow-hidden">
      <SidebarPaciente />

      <div className="flex flex-col flex-1 h-full">
        <HeaderPaciente />

        <main className="flex-1 px-4 py-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
