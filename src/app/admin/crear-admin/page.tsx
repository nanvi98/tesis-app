'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import {
  UserPlus,
  KeyRound,
  Mail,
  Trash2,
  CheckCircle,
} from 'lucide-react';

export default function CrearAdmin() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [idGenerado, setIdGenerado] = useState(uuidv4());
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const generarID = () => {
    setIdGenerado(uuidv4());
  };

  // ─────────────────────────────────────
  // Cargar administradores ya creados
  // ─────────────────────────────────────
  const loadAdmins = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');

    setAdmins(data ?? []);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // ─────────────────────────────────────
  // Crear Admin
  // ─────────────────────────────────────
  const handleCrearAdmin = async () => {
    setLoading(true);

    // 1. Crear usuario en Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    // 2. Crear registro en profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authUser.user?.id,
      nombre,
      apellido,
      email,
      role: 'admin',
      status: 'activo',
      approved: true
    });

    if (profileError) {
      toast.error(
        `Usuario creado en Auth, pero error al crear profile: ${profileError.message}`
      );
    } else {
      toast.success('Administrador creado correctamente 🙌');
      setNombre('');
      setApellido('');
      setPassword('');
      setEmail('');
      generarID();
      loadAdmins();
    }

    setLoading(false);
  };

  // ─────────────────────────────────────
  // Eliminar administrador
  // ─────────────────────────────────────
  const handleDeleteAdmin = async (id: string) => {
    await supabase.from('profiles').delete().eq('id', id);
    loadAdmins();
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-extrabold text-slate-900 mb-6">
        Crear nuevo administrador
      </h1>

      {/*  FORMULARIO  */}
      <div className="bg-white shadow-xl border border-slate-100 rounded-3xl p-6 mb-10">

        <div className="mb-3 text-xs font-semibold text-slate-500">
          ID generado:
        </div>

        <div className="p-3 border rounded-xl text-sm font-mono bg-slate-50 text-slate-700 mb-4">
          {idGenerado}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            className="input"
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <input
            className="input"
            placeholder="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
          />
        </div>

        <input
          className="input mb-4"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="input mb-4"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          onClick={handleCrearAdmin}
          className="w-full py-3 rounded-xl text-white font-bold
          bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90"
        >
          <UserPlus size={18} className="inline-block mr-2" />
          {loading ? 'Creando...' : 'Crear Admin'}
        </button>
      </div>

      {/*  LISTA DE ADMINS  */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          Administradores registrados
        </h2>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">{a.nombre} {a.apellido}</td>
                  <td className="p-3">{a.email}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-1 rounded-full text-xs
                      bg-emerald-50 text-emerald-700">
                      activo
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <Trash2
                      onClick={() => handleDeleteAdmin(a.id)}
                      className="cursor-pointer text-red-500 hover:text-red-700"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
