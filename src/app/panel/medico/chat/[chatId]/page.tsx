"use client";

export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Paperclip, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  message: string;
  file_url?: string | null;
  created_at: string;
}

export default function ChatDetailPage() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherPhoto, setOtherPhoto] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // =====================
  // Obtener usuario actual
  // =====================
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) setUserId(data.user.id);
    });
  }, []);

  // =====================
  // Header del chat
  // =====================
  async function loadChatHeader() {
    const { data } = await supabase
      .from("chats")
      .select(`
        paciente:paciente_id (
          nombre,
          apellido,
          foto_url
        )
      `)
      .eq("id", chatId)
      .single();

    const p = Array.isArray(data?.paciente)
      ? data.paciente[0]
      : data?.paciente;

    setOtherName(`${p?.nombre ?? ""} ${p?.apellido ?? ""}`.trim());
    setOtherPhoto(p?.foto_url ?? "");
  }

  // =====================
  // Cargar mensajes
  // =====================
  async function loadMessages() {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  }

  // =====================
  // Realtime mensajes
  // =====================
  useEffect(() => {
    if (!chatId) return;
    loadChatHeader();
    loadMessages();

    const channel = supabase
      .channel(`room-${chatId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  // Scroll auto
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =====================
  // ENVIAR MENSAJE
  // =====================
  async function sendMessage() {
    if (!input.trim()) return;

    await supabase.from("chat_messages").insert({
      chat_id: chatId,
      sender_id: userId,
      message: input,
    });

    setInput("");
  }

  return (
    <div className="flex flex-col items-center py-10 px-6">

      {/* HEADER */}
      <div className="w-[600px] flex items-center gap-4 bg-white shadow rounded-xl p-3 mb-4 border border-slate-200">
        <img
          src={
            otherPhoto ||
            "https://api.dicebear.com/7.x/initials/svg?seed=" + otherName
          }
          className="w-11 h-11 rounded-full border"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-slate-700">{otherName}</span>
          <span className="text-green-500 text-sm font-medium">🟢 En línea</span>
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className="border border-slate-200 bg-white rounded-xl w-[600px] h-[65vh] p-4 overflow-y-auto shadow-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 my-1 rounded-xl max-w-[80%] text-sm ${
              m.sender_id === userId
                ? "bg-cyan-500 text-white ml-auto"
                : "bg-gray-100 text-slate-800"
            }`}
          >
            {m.message}
            {m.file_url && (
              <a
                href={m.file_url}
                target="_blank"
                className="underline block mt-1"
              >
                📎 Archivo adjunto
              </a>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="mt-4 flex gap-2 w-[600px] relative">
        <label className="absolute left-3 top-[18px] cursor-pointer">
          <Paperclip size={20} />
          <input type="file" className="hidden" />
        </label>

        <input
          className="border border-slate-300 p-2 pl-10 rounded-xl flex-1 focus:outline-cyan-500"
          placeholder="Escribe un mensaje..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="bg-cyan-600 text-white px-5 rounded-xl flex items-center gap-1 font-semibold shadow hover:bg-cyan-700"
        >
          <Send size={18} /> Enviar
        </button>
      </div>
    </div>
  );
}
