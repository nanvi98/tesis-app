'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface Medico {
  id: string;
  nombre: string;
  cedulaProfesional: string;
  correo: string;
  telefono: string;
  especialidad?: string;
  foto?: string;
}

interface MedicoContextType {
  medico: Medico;
  setMedico: (medico: Medico) => void;
}

export const MedicoContext = createContext<MedicoContextType | undefined>(
  undefined
);

export const MedicoProvider = ({ children }: { children: ReactNode }) => {
  const [medico, setMedico] = useState<Medico | null>(null);

  useEffect(() => {
    async function cargarDatos() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setMedico({
          id: data.id,
          nombre: data.nombre,
          cedulaProfesional: data.cedula,
          correo: data.email,
          telefono: data.telefono,
          especialidad: data.especialidad,
        });
      }
    }

    cargarDatos();
  }, []);

  if (!medico) {
    return (
      <div className="h-screen flex justify-center items-center text-lg">
        Cargando datos del médico...
      </div>
    );
  }

  return (
    <MedicoContext.Provider value={{ medico, setMedico }}>
      {children}
    </MedicoContext.Provider>
  );
};

export const useMedico = () => {
  const context = useContext(MedicoContext);
  if (!context)
    throw new Error('useMedico debe usarse dentro de un MedicoProvider');
  return context;
};
