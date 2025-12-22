'use client';

import SoportePage from '@/app/admin/soporte/page';
import { supabase } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';

export default function SoportePagePaciente() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!data?.role) return;

      if (data.role === 'paciente') {
        setAllowed(true);
      }
    }

    checkRole();
  }, []);

  if (!allowed) {
    return (
      <div className="p-10 text-center text-slate-500">
        Cargando soporte...
      </div>
    );
  }

  return <SoportePage roleOverride="paciente" />;
}
