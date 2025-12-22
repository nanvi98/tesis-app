"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Search } from "lucide-react";

interface ChatRow {
  id: string;
  last_message: string | null;
  last_updated: string;
  paciente: {
    nombre: string;
    apellido: string;
    avatar_url: string | null;
  };
}

export default function ChatListPage() {
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [filtered, setFiltered] = useState<ChatRow[]>([]);

  async function loadChats() {
    const { data } = await supabase
      .from("chats")
      .select(`
        id,
        last_message,
        last_updated,
        paciente:paciente_id (
          nombre,
          apellido,
          avatar_url
        )
      `)
      .order("last_updated", { ascending: false });

    if (data) {
      const formatted = data.map((row: any) => ({
        ...row,
        paciente: Array.isArray(row.paciente)
          ? row.paciente[0]
          : row.paciente
      }));
      setChats(formatted);
      setFiltered(formatted);
    }
  }

  useEffect(() => {
    loadChats();
  }, []);

  function search(value: string) {
    const s = value.toLowerCase();
    const f = chats.filter((c) =>
      `${c.paciente.nombre} ${c.paciente.apellido}`
        .toLowerCase()
        .includes(s)
    );
    setFiltered(f);
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold text-slate-700 mb-4">
        Chats con pacientes
      </h2>

      {/* Search bar */}
      <div className="flex items-center bg-white border rounded-xl px-3 py-2 shadow w-[350px] mb-4">
        <Search className="text-gray-500 mr-2" />
        <input
          onChange={(e) => search(e.target.value)}
          placeholder="Buscar paciente..."
          className="outline-none w-full"
        />
      </div>

      {/* Chat list */}
      <div className="rounded-xl bg-white border shadow w-[450px]">
        {filtered.length === 0 && (
          <p className="text-gray-500 p-4">No tienes conversaciones ✨</p>
        )}

        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/panel/medico/chat/${c.id}`}
            className="flex items-center p-4 border-b hover:bg-gray-50 transition"
          >
            <img
              src={c.paciente.avatar_url || "/default-avatar.png"}
              className="w-12 h-12 rounded-full border shadow-sm"
            />

            <div className="ml-3 flex-1">
              <p className="font-medium">
                {c.paciente.nombre} {c.paciente.apellido}
              </p>
              <p className="text-sm text-gray-500 truncate w-[250px]">
                {c.last_message || "Nuevo chat"}
              </p>
            </div>

            <div className="text-xs text-gray-400">
              {new Date(c.last_updated).toLocaleTimeString("es-MX", {
                hour: "numeric",
                minute: "numeric",
              })}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
