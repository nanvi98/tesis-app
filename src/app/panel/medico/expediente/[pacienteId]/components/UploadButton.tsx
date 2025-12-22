'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function UploadButton({
  pacienteId,
  consultaId,
  onUploaded,
}: {
  pacienteId: string;
  consultaId?: string;
  onUploaded: () => void;
}) {
  const [loading, setLoading] = useState(false);

  async function subir(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    const nombre = `${pacienteId}/${Date.now()}-${file.name}`;

    const { data: storage, error: err1 } = await supabase.storage
      .from('radiografias')
      .upload(nombre, file, { upsert: true });

    if (err1) return alert('Error subiendo imagen');

    const { data: urlData } = supabase.storage
      .from('radiografias')
      .getPublicUrl(nombre);

    await supabase.from('imagenes').insert({
      paciente_id: pacienteId,
      consulta_id: consultaId ?? null,
      url: urlData.publicUrl,
    });

    setLoading(false);
    onUploaded();
    alert('Imagen subida');
  }

  return (
    <label className="inline-flex items-center px-3 py-2 text-sm text-white rounded-lg bg-cyan-600 cursor-pointer hover:bg-cyan-700">
      {loading ? 'Subiendo...' : 'Subir radiografía'}
      <input type="file" hidden onChange={subir} />
    </label>
  );
}
