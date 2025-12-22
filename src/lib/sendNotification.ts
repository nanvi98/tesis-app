import { supabase } from "@/lib/supabaseClient";

export async function sendNotification({
  userId,
  titulo,
  mensaje,
}: {
  userId: string;
  titulo: string;
  mensaje?: string;
}) {
  await supabase.from("notificaciones").insert({
    user_id: userId,
    titulo,
    mensaje,
  });
}
