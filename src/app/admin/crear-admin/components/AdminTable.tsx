"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

export default function AdminsTable({ refresh, onRefresh }: any) {

  const [admins, setAdmins] = useState<any[]>([]);

  const load = async () => {
    const { data } = await fetch("/api/get-admins").then(r=>r.json());
    setAdmins(data || []);
  };

  useEffect(()=>{ load(); }, [refresh]);

  const del = async(id:string)=>{
    if(!confirm("Eliminar admin?"))return;

    await fetch("/api/delete-admin",{
      method:"POST",
      body: JSON.stringify({id})
    });

    onRefresh();
  }

  return (
    <div className="rounded-3xl bg-white/70 shadow p-5">

      <div className="flex justify-between mb-3">
        <h2 className="font-semibold">Administradores registrados</h2>
        <button onClick={onRefresh} className="btn-primary">
          Actualizar
        </button>
      </div>

      <table className="w-full text-left">
        <thead>
          <tr className="text-sm text-slate-500 border-b">
            <th>Email</th>
            <th>Permisos</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
        {admins.map(a=>(
          <tr key={a.id}>
            <td>{a.email}</td>
            <td>{Object.values(a.permissions||{}).filter(Boolean).length} / 5</td>
            <td>
              <button onClick={()=>del(a.id)}>
                <Trash2 className="text-rose-600"/>
              </button>
            </td>
          </tr>
        ))}
        </tbody>

      </table>
    </div>
  );
}
