'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Bell, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificacionesMedicoPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);

    // obtener usuario logueado
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setItems(data || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase
      .from("notificaciones")
      .update({ visto: true })
      .eq("id", id);

    fetchNotifs();
  };

  useEffect(() => {
    fetchNotifs();

    // REALTIME (automático)
    supabase
      .channel('notifs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificaciones' },
        () => fetchNotifs()
      )
      .subscribe();
  }, []);

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <h1 className="text-2xl font-semibold text-slate-800 flex items-center gap-2 mb-8">
        <Bell className="text-cyan-600" size={24} /> Notificaciones
      </h1>

      {loading && (
        <p className="text-center text-slate-500">Cargando...</p>
      )}

      {!loading && items.length === 0 && (
        <p className="text-center text-slate-400">No tienes notificaciones.</p>
      )}

      <div className="space-y-4">
        {items.map((n, i) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`
              rounded-xl p-4 border shadow-sm bg-white flex justify-between
              ${n.visto ? "border-slate-200 bg-slate-50" : "border-cyan-200"}
            `}
          >
            <div>
              <p className="font-semibold text-slate-800">
                {n.titulo}
              </p>
              {n.mensaje && (
                <p className="text-sm text-slate-600 mt-1">
                  {n.mensaje}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </div>

            {!n.visto && (
              <button onClick={() => markRead(n.id)}>
                <CheckCircle2 size={20} className="text-cyan-600" />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
