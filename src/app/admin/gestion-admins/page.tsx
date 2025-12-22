'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Shield, User, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Profile {
  id: string;
  email: string;
  nombre: string | null;
  role: string | null;
}

export default function GestionAdminsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, nombre, role')
      .order('nombre', { ascending: true });

    if (error) {
      console.error(error);
      setError('No se pudieron cargar los usuarios.');
      setLoading(false);
      return;
    }

    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const promoteToAdmin = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', id);

    if (error) {
      console.error(error);
      setError('No se pudo cambiar el rol.');
    }

    setUpdatingId(null);
    fetchProfiles();
  };

  const demoteAdmin = async (id: string) => {
    setUpdatingId(id);
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'user' })
      .eq('id', id);

    if (error) {
      console.error(error);
      setError('No se pudo cambiar el rol.');
    }

    setUpdatingId(null);
    fetchProfiles();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-semibold text-slate-900 flex items-center gap-3">
          <Shield className="text-violet-600" />
          Administración de Administradores
        </h1>
        <p className="text-sm text-slate-500">
          Promueve o remueve permisos de administrador sin necesidad de SQL.
        </p>
      </motion.div>

      <div className="rounded-3xl bg-white/70 p-5 shadow-[0_20px_40px_rgba(15,23,42,0.07)] backdrop-blur">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-slate-500 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
            Cargando usuarios...
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((u) => {
              const isAdmin = u.role === 'admin';
              const isUpdating = updatingId === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between bg-slate-50 rounded-2xl p-3 border border-slate-200"
                >
                  {/* IZQUIERDA */}
                  <div className="flex items-center gap-3">
                    <User className="text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-800">{u.nombre || 'Sin nombre'}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  {/* DERECHA */}
                  <div className="flex items-center gap-3">
                    {isAdmin ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-violet-100 text-violet-700 font-semibold">
                        ADMIN
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-slate-200 text-slate-600">
                        Usuario
                      </span>
                    )}

                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                    ) : isAdmin ? (
                      <button
                        onClick={() => demoteAdmin(u.id)}
                        className="flex items-center gap-1 bg-rose-100 text-rose-700 text-xs px-3 py-1 rounded-full hover:bg-rose-200"
                      >
                        <XCircle className="h-3 w-3" />
                        Quitar admin
                      </button>
                    ) : (
                      <button
                        onClick={() => promoteToAdmin(u.id)}
                        className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full hover:bg-emerald-200"
                      >
                        <CheckCircle className="h-3 w-3" />
                        Hacer admin
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-rose-600 flex items-center gap-1">
            <XCircle className="h-4 w-4" />
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
