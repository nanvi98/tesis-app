'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ImageUploader({
  pacienteId,
  consultaId,
  onUpload,
}: {
  pacienteId: string;
  consultaId: string;
  onUpload?: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) return alert('Selecciona un archivo');

    setLoading(true);

    const fileName = `${pacienteId}/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from('radiografias')
      .upload(fileName, file);

    if (error) {
      alert('Error subiendo imagen');
      setLoading(false);
      return;
    }

    const url =
      supabase.storage
        .from('radiografias')
        .getPublicUrl(fileName).data.publicUrl;

    await supabase.from('imagenes').insert({
      paciente_id: pacienteId,
      consulta_id: consultaId,
      url,
    });

    alert('Imagen subida ✔');
    setFile(null);
    setLoading(false);
    onUpload?.();
  }

  return (
    <div className="space-y-3 border rounded-xl bg-white shadow p-4">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        disabled={loading}
        onClick={upload}
        className="bg-gradient-to-r from-cyan-600 to-emerald-600 
        text-white px-4 py-2 rounded-xl text-sm"
      >
        {loading ? 'Subiendo...' : 'Subir radiografía'}
      </button>
    </div>
  );
}
