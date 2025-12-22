'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Clipboard } from 'lucide-react';

export default function CrearAdminForm() {
  const [id] = useState(uuidv4());
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const createAdmin = async () => {
    setLoading(true);

    const { data: auth, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      toast.error(authError.message);
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: auth.user?.id,
      nombre,
      apellido,
      email,
      role: 'admin',
      approved: true,
      status: 'activo',
    });

    if (profileError) {
      toast.error(
        `Usuario creado en Auth, pero error al crear profile: ${profileError.message}`
      );
    } else {
      toast.success('Administrador creado correctamente 🎉');
      setNombre('');
      setApellido('');
      setEmail('');
      setPassword('');
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 w-full">

      <h2 className="text-lg font-bold text-slate-700 mb-4">
        CREAR NUEVO ADMINISTRADOR
      </h2>

      <div className="font-mono text-sm p-3 bg-slate-50 border rounded-xl flex justify-between items-center">
        {id}
        <Clipboard
          className="cursor-pointer hover:text-blue-600"
          onClick={() => navigator.clipboard.writeText(id)}
        />
      </div>

      <input className="input mb-3" placeholder="Nombre" value={nombre}
             onChange={(e) => setNombre(e.target.value)} />

      <input className="input mb-3" placeholder="Apellido" value={apellido}
             onChange={(e) => setApellido(e.target.value)} />

      <input className="input mb-3" placeholder="Correo" value={email}
             onChange={(e) => setEmail(e.target.value)} />

      <input className="input mb-5" type="password" placeholder="Contraseña"
             value={password} onChange={(e) => setPassword(e.target.value)} />

      <button
        onClick={createAdmin}
        disabled={loading}
        className="w-full py-3 rounded-xl text-white font-bold
          bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90"
      >
        {loading ? 'Creando...' : 'Crear Admin'}
      </button>
    </div>
  );
}
