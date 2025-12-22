'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import LoadingSpinner from './LoadingSpinner';

interface PerfilModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminId: string;
}

export default function PerfilModal({ isOpen, onClose, adminId }: PerfilModalProps) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) fetchAdminData();
  }, [isOpen]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', adminId)
        .single();

      if (error) throw error;

      setNombre(data.nombre);
      setEmail(data.email);
      setAvatarUrl(data.avatar_url || '');
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await supabase
        .from('admins')
        .update({ nombre, email, avatar_url: avatarUrl })
        .eq('id', adminId);

      onClose();
    } catch (error) {
      console.error('Error updating admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${adminId}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatarUrl(data.publicUrl);
    setUploading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl w-full max-w-md relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-50">
            <LoadingSpinner />
          </div>
        )}
        <h2 className="text-2xl font-bold text-pink-700 mb-4">Editar perfil</h2>

        <div className="flex flex-col items-center mb-4">
          <img
            src={avatarUrl || '/default-avatar.png'}
            alt="Avatar"
            className="w-24 h-24 rounded-full mb-2 object-cover"
          />
          <input type="file" onChange={handleUpload} disabled={uploading} />
          {uploading && <p className="text-sm text-gray-500 mt-1">Subiendo imagen...</p>}
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="p-2 border rounded-lg w-full"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            className="p-2 border rounded-lg w-full"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700 transition"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
