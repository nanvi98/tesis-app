'use client';

import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import SidebarMedico from './components/Sidebar';
import HeaderMedico from './components/Header';
import { MedicoProvider } from '@/context/MedicoContext';

export default function MedicoLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validarUsuario() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return router.push('/');

      const { data: perfil } = await supabase
        .from('profiles')
        .select('id, role, nombre, apellido')
        .eq('id', user.id)
        .single();

      if (!perfil || perfil.role !== 'medico')
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
    <MedicoProvider>
      <div className="flex h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100 overflow-hidden">
        <SidebarMedico />

        <div className="flex flex-col flex-1 h-full">
          <HeaderMedico />

          <main className="flex-1 px-4 py-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </MedicoProvider> 
  );

}