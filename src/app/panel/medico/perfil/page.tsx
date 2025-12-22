'use client';

import {
  useEffect,
  useState,
  useMemo,
  useRef,
  ChangeEvent,
  FormEvent,
} from 'react';
import { motion } from 'framer-motion';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Stethoscope,
  ShieldCheck,
  HeartPulse,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface MedicoProfile {
  id: string;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  telefono: string | null;
  especialidad: string | null;
  titulo: string | null;
  cedula: string | null;
  cedula_status: string | null;
  notas: string | null;
  avatar_url?: string | null;
  role?: string | null;
  status?: string | null;
  created_at?: string | null;
}

type MessageType = 'success' | 'error' | null;

export default function PerfilMedicoPage() {
  const [profile, setProfile] = useState<MedicoProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<MessageType>(null);

  // formulario
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [email, setEmail] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─────────────────────────────────────
  // Cargar perfil
  // ─────────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      setLoadingProfile(true);
      setMsg(null);
      setMsgType(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error('Error obteniendo usuario:', userError);
        setMsg('No se pudo obtener el usuario autenticado.');
        setMsgType('error');
        setLoadingProfile(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, email, nombre, apellido, telefono, especialidad, titulo, cedula, cedula_status, notas, avatar_url, role, status, created_at'
        )
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data) {
        console.error('Error obteniendo perfil de médico:', error);
        setMsg('No se encontró tu perfil de médico en la tabla profiles.');
        setMsgType('error');
        setLoadingProfile(false);
        return;
      }

      const p = data as MedicoProfile;
      setProfile(p);
      setNombre(p.nombre ?? '');
      setApellido(p.apellido ?? '');
      setTelefono(p.telefono ?? '');
      setEspecialidad(p.especialidad ?? '');
      setTitulo(p.titulo ?? '');
      setDescripcion(p.notas ?? '');
      setEmail(p.email ?? user.email ?? '');

      setLoadingProfile(false);
    };

    void loadProfile();
  }, []);

  // ─────────────────────────────────────
  // Helpers de UI
  // ─────────────────────────────────────
  const displayName = useMemo(() => {
    if (nombre || apellido) {
      return `Dr(a). ${nombre} ${apellido}`.trim();
    }
    if (profile?.email) return `Dr(a). ${profile.email.split('@')[0]}`;
    return 'Dr(a). Médico';
  }, [nombre, apellido, profile?.email]);

  const memberSinceLabel = useMemo(() => {
    if (!profile?.created_at) return 'Fecha no disponible';
    try {
      const d = new Date(profile.created_at);
      return d.toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Fecha no disponible';
    }
  }, [profile?.created_at]);

  const roleLabel = useMemo(() => {
    if (!profile?.role) return 'Médico';
    if (profile.role.toLowerCase() === 'medico') return 'Médico';
    return profile.role;
  }, [profile?.role]);

  const statusLabel = useMemo(() => {
    if (!profile?.status) return 'sin estado';
    return profile.status;
  }, [profile?.status]);

  const cedulaStatusLabel = useMemo(() => {
    const raw = profile?.cedula_status ?? 'pendiente';
    return raw.toLowerCase();
  }, [profile?.cedula_status]);

  const cedulaStatusColor = useMemo(() => {
    const s = cedulaStatusLabel;
    if (s === 'valida' || s === 'válida') {
      return 'bg-emerald-500/90 text-emerald-50';
    }
    if (s === 'rechazada') {
      return 'bg-rose-500/90 text-rose-50';
    }
    return 'bg-amber-400/90 text-amber-50';
  }, [cedulaStatusLabel]);

  const showMessage = (text: string, type: Exclude<MessageType, null>) => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => {
      setMsg(null);
      setMsgType(null);
    }, 4200);
  };

  // ─────────────────────────────────────
  // Avatar
  // ─────────────────────────────────────
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `medico-${profile.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Error subiendo avatar:', uploadError);
        showMessage('No se pudo subir la imagen de perfil.', 'error');
        setUploadingAvatar(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl ?? null;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error guardando avatar_url:', updateError);
        showMessage(
          'Se subió la imagen pero no se guardó en el perfil.',
          'error'
        );
      } else {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                avatar_url: publicUrl,
              }
            : prev
        );
        showMessage('Foto de perfil actualizada.', 'success');
      }
    } catch (err) {
      console.error(err);
      showMessage('Error inesperado subiendo la imagen.', 'error');
    }

    setUploadingAvatar(false);
  };

  // ─────────────────────────────────────
  // Guardar cambios
  // ─────────────────────────────────────
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSavingProfile(true);

    try {
      // 1) Actualizar datos generales en profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nombre: nombre.trim() || null,
          apellido: apellido.trim() || null,
          telefono: telefono.trim() || null,
          especialidad: especialidad.trim() || null,
          titulo: titulo.trim() || null,
          notas: descripcion.trim() || null,
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error actualizando datos del médico:', updateError);
        showMessage('No se pudieron guardar los cambios.', 'error');
        setSavingProfile(false);
        return;
      }

      // 2) Actualizar correo (auth + profiles) si cambió
      if (email && email !== profile.email) {
        const { error: authEmailError } = await supabase.auth.updateUser({
          email,
        });

        if (authEmailError) {
          console.error('Error actualizando email en Auth:', authEmailError);
          showMessage(
            'No se pudo actualizar el correo. Puede requerir volver a iniciar sesión.',
            'error'
          );
          setSavingProfile(false);
          return;
        }

        const { error: profileEmailError } = await supabase
          .from('profiles')
          .update({ email })
          .eq('id', profile.id);

        if (profileEmailError) {
          console.error(
            'Error actualizando email en profile:',
            profileEmailError
          );
          showMessage(
            'Correo actualizado en autenticación, pero no en el perfil.',
            'error'
          );
          setSavingProfile(false);
          return;
        }
      }

      // Actualizar estado local
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              nombre: nombre.trim() || null,
              apellido: apellido.trim() || null,
              telefono: telefono.trim() || null,
              especialidad: especialidad.trim() || null,
              titulo: titulo.trim() || null,
              notas: descripcion.trim() || null,
              email,
            }
          : prev
      );

      setIsEditing(false);
      showMessage('Perfil actualizado correctamente.', 'success');
    } catch (err) {
      console.error(err);
      showMessage('Error inesperado al guardar el perfil.', 'error');
    }

    setSavingProfile(false);
  };

  // ─────────────────────────────────────
  // Eliminar cuenta (por ahora solo alerta)
  // ─────────────────────────────────────
  const handleDeleteAccount = () => {
    // Aquí luego puedes implementar la lógica real:
    //  - llamar a un edge function / API route que borre al usuario
    //  - limpiar registros relacionados, etc.
    alert(
      'Aquí podrás eliminar tu cuenta de forma segura. Por ahora esta opción aún no está habilitada.'
    );
  };

  // ─────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-100 px-6 py-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-teal-700">
          <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
          <p className="text-sm">Cargando tu perfil de médico…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-100 px-6 py-6 flex items-center justify-center">
        <div className="rounded-3xl bg-white/95 px-6 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.18)] max-w-md w-full text-center border border-teal-100">
          <AlertTriangle className="mx-auto h-9 w-9 text-amber-500 mb-2" />
          <h1 className="text-lg font-semibold text-slate-900">
            No se encontró tu perfil de médico
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Verifica que tengas un registro en la tabla{' '}
            <code className="px-1 py-0.5 rounded bg-slate-100 text-xs">
              profiles
            </code>{' '}
            con tu mismo{' '}
            <code className="px-1 py-0.5 rounded bg-slate-100 text-xs">id</code>{' '}
            de autenticación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-100">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-5 sm:px-6 lg:px-4 space-y-6">
        {/* HEADER HERO */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 px-6 py-5 sm:px-8 sm:py-7 shadow-[0_26px_70px_rgba(15,23,42,0.45)] text-white"
        >
          <div className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-teal-300/35 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-6 h-48 w-48 rounded-full bg-cyan-300/35 blur-3xl" />

          <div className="relative flex flex-wrap items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <button
                type="button"
                onClick={handleAvatarClick}
                className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[4px] border-white/75 bg-teal-100/10 shadow-xl backdrop-blur-sm"
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-teal-50/90" />
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition group-hover:opacity-100">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </button>

              {uploadingAvatar && (
                <div className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-teal-500 p-1.5 shadow-lg">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Texto principal */}
            <div className="flex-1 min-w-[230px]">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-100/90">
                <Stethoscope className="h-4 w-4" />
                Perfil del médico
              </div>

              <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">
                {displayName}
              </h1>

              <p className="mt-1 text-sm text-teal-50/95">{email}</p>

              <p className="mt-2 text-xs sm:text-sm text-teal-50/90 max-w-2xl">
                Gestiona tu identidad profesional, datos de contacto y cédula
                verificada dentro de la plataforma.
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-[11px] sm:text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-medium backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                  <Calendar className="h-3.5 w-3.5" />
                  Miembro desde {memberSinceLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 backdrop-blur ${
                    statusLabel === 'activo'
                      ? 'bg-emerald-400/30 text-emerald-50'
                      : 'bg-slate-900/25 text-slate-50'
                  }`}
                >
                  <HeartPulse className="h-3.5 w-3.5" />
                  Estado: {statusLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 backdrop-blur ${cedulaStatusColor}`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Cédula {cedulaStatusLabel}
                </span>
              </div>
            </div>

            {/* Botón editar */}
            <div className="ml-auto flex items-start">
              <button
                type="button"
                onClick={() => setIsEditing((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs sm:text-sm font-semibold text-teal-700 shadow-md hover:bg-white"
              >
                {isEditing ? (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Cancelar edición
                  </>
                ) : (
                  <>
                    <UserIcon className="h-4 w-4" />
                    Editar perfil
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Mensaje global */}
        {msg && msgType && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm shadow-md border ${
              msgType === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-rose-50 text-rose-700 border-rose-100'
            }`}
          >
            {msgType === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{msg}</span>
          </motion.div>
        )}

        {/* Tarjeta principal de datos */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="relative rounded-[28px] bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur border border-teal-100/70"
        >
          <h2 className="text-sm font-semibold text-teal-800 flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-teal-600" />
            Datos profesionales
          </h2>
          <p className="mt-1 text-xs text-slate-500 max-w-md">
            Actualiza tu información de contacto y descripción profesional.
          </p>

          <form
            onSubmit={handleSaveProfile}
            className="relative space-y-4 mt-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Nombre
                </label>
                <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={nombre}
                    disabled={!isEditing}
                    onChange={(e) => setNombre(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="Ej. Nancy"
                  />
                </div>
              </div>

              {/* Apellido */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Apellido
                </label>
                <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={apellido}
                    disabled={!isEditing}
                    onChange={(e) => setApellido(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="Ej. Ramírez"
                  />
                </div>
              </div>

              {/* Correo */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Correo electrónico
                </label>
                <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-600">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    disabled={!isEditing}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Teléfono
                </label>
                <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-600">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={telefono}
                    disabled={!isEditing}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="Ej. 5522334455"
                  />
                </div>
              </div>

              {/* Especialidad */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Especialidad
                </label>
                <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <Stethoscope className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={especialidad}
                    disabled={!isEditing}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="Ej. Ortopedia, Geriatría…"
                  />
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Título profesional
                </label>
                <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                    <UserIcon className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={titulo}
                    disabled={!isEditing}
                    onChange={(e) => setTitulo(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="Ej. Dra., Dr., Especialista en…"
                  />
                </div>
              </div>

              {/* Cédula (solo lectura) */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Cédula profesional
                </label>
                <div className="mt-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700">
                  {profile.cedula || 'No registrada'}
                </div>
              </div>

              {/* Estatus cédula (solo lectura) */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Estatus de validación
                </label>
                <div className="mt-1 inline-flex items-center rounded-2xl bg-slate-50/80 border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <span
                    className={`mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${cedulaStatusColor}`}
                  >
                    {cedulaStatusLabel}
                  </span>
                  <span className="text-xs text-slate-500">
                    (Administración es quien puede modificar este estado)
                  </span>
                </div>
              </div>
            </div>

            {/* Descripción profesional */}
            <div className="mt-3">
              <label className="text-xs font-medium text-slate-700">
                Descripción profesional
              </label>
              <textarea
                value={descripcion}
                disabled={!isEditing}
                onChange={(e) => setDescripcion(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-800 outline-none min-h-[90px] resize-y"
                placeholder="Describe brevemente tu experiencia, enfoque clínico o información relevante para tus pacientes."
              />
            </div>

            {/* Botón guardar */}
            {isEditing && (
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando cambios…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </motion.div>

        {/* Tarjeta eliminar cuenta */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="rounded-[24px] bg-white/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.10)] border border-rose-100 flex items-center justify-between gap-3"
        >
          <div>
            <h3 className="text-sm font-semibold text-rose-700 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Eliminar cuenta permanentemente
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xl">
              Esta acción no se puede deshacer. En el futuro podrás solicitar
              la eliminación completa de tu cuenta y datos clínicos asociados.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar cuenta
          </button>
        </motion.div>
      </div>
    </div>
  );
}
