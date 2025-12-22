'use client';

import { createContext, useContext, useState } from 'react';

interface PacienteContextType {
  pacienteId: string | null;
  setPacienteId: (id: string | null) => void;
}

const PacienteContext = createContext<PacienteContextType>({
  pacienteId: null,
  setPacienteId: () => {},
});

export function PacienteProvider({ children }: { children: React.ReactNode }) {
  const [pacienteId, setPacienteId] = useState<string | null>(null);

  return (
    <PacienteContext.Provider value={{ pacienteId, setPacienteId }}>
      {children}
    </PacienteContext.Provider>
  );
}

export function usePaciente() {
  return useContext(PacienteContext);
}
