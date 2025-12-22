import { supabase } from "@/lib/supabaseClient";

export async function getOrCreateChat(medicoId: string, pacienteId: string) {

  // buscar si ya existe
  const { data: existingChat, error: selectError } = await supabase
    .from("chats")
    .select("id")
    .eq("medico_id", medicoId)
    .eq("paciente_id", pacienteId)
    .maybeSingle();

  if (existingChat) return existingChat.id;

  // crear si no existe
  const { data: newChat, error: insertError } = await supabase
    .from("chats")
    .insert({
      medico_id: medicoId,
      paciente_id: pacienteId,
      last_updated: new Date(),
      last_message: null,
      unread_count: 0
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error creando chat:", insertError);
    throw insertError;
  }

  return newChat.id;
}
