'use client';

import { useState } from 'react';

export default function AdminPermisos() {
  const [adminId, setAdminId] = useState('');

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">

      <h2 className="text-lg font-bold text-sky-600 mb-4">
        ASIGNAR PERMISOS AVANZADOS
      </h2>

      <input
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
        placeholder="ID del administrador..."
        className="input mb-4"
      />

      <button className="btn-primary w-full">Cargar permisos</button>

      <div className="mt-6 space-y-3">
        {[
          'Editar registros y configuraciones',
          'Eliminar información sensible',
          'Bloquear usuarios o accesos',
          'Visualizar reportes avanzados',
          'Cambiar roles de otros usuarios',
        ].map((permiso) => (
          <label key={permiso} className="flex gap-3 items-center">
            <input type="checkbox" />
            {permiso}
          </label>
        ))}
      </div>

      <div className="flex mt-6 gap-3">
        <button className="btn-primary flex-1">Guardar cambios</button>
        <button className="btn-danger flex-1">Cancelar</button>
      </div>
    </div>
  );
}
