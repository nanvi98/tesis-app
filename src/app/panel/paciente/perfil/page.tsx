"use client";

import {
  useEffect,
  useState,
  useRef,
  useMemo,
  ChangeEvent,
  FormEvent,
} from "react";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Mail,
  Camera,
  Loader2,
  Calendar,
  Phone,
  Lock,
  User,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  telefono?: string | null;
  sexo?: string | null;
  foto_url?: string | null;
  created_at?: string;
}

export default function PerfilPaciente() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] =
    useState<"success" | "error" | null>(null);

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [sexo, setSexo] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ------------------------------------------------------------
  // Cargar perfil desde Supabase
  // ------------------------------------------------------------
  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return setLoadingProfile(false);

      const { data } = await supabase
        .from("profiles")
        .select(
          "id, email, nombre, apellido, telefono, sexo, foto_url, created_at"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setNombre(data.nombre || "");
        setApellido(data.apellido || "");
        setTelefono(data.telefono || "");
        setSexo(data.sexo || "");
        setEmail(data.email || user.email || "");
      }

      setLoadingProfile(false);
    };

    loadProfile();
  }, []);

  const displayName = useMemo(
    () => `${nombre} ${apellido}`.trim() || "Paciente",
    [nombre, apellido]
  );

  const memberSinceLabel = useMemo(() => {
    if (!profile?.created_at) return "Fecha no disponible";
    const d = new Date(profile.created_at);
    return d.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [profile?.created_at]);

  const showMessage = (text: string, type: "success" | "error") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => {
      setMsg(null);
      setMsgType(null);
    }, 3200);
  };

  // ------------------------------------------------------------
  // Guardar datos personales en Supabase
  // ------------------------------------------------------------
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nombre,
        apellido,
        telefono,
        sexo,
      })
      .eq("id", profile.id);

    if (error) {
      console.log(error);
      showMessage("Error guardando datos.", "error");
      return;
    }

    // Refrescar localmente
    setProfile({
      ...profile,
      nombre,
      apellido,
      telefono,
      sexo,
    });

    showMessage("Datos personales actualizados.", "success");
    setSavingProfile(false);
  };

  // ------------------------------------------------------------
  // Avatar
  // ------------------------------------------------------------
  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `paciente-${profile.id}.${ext}`;

    await supabase.storage.from("avatars").upload(filePath, file, {
      upsert: true,
    });

    const { data: urlObj } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const publicUrl = urlObj?.publicUrl;

    await supabase
      .from("profiles")
      .update({ foto_url: publicUrl })
      .eq("id", profile.id);

    setProfile((p) =>
      p ? { ...p, foto_url: publicUrl } : p
    );

    setUploadingAvatar(false);
    showMessage("Foto de perfil actualizada.", "success");
  };

  // ------------------------------------------------------------
  // Seguridad
  // ------------------------------------------------------------
  const handleSaveSecurity = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (newPassword && newPassword !== confirmPassword) {
      showMessage("Las contraseñas no coinciden.", "error");
      return;
    }

    setSavingSecurity(true);

    if (email && email !== profile.email) {
      await supabase.auth.updateUser({ email });
      await supabase.from("profiles").update({ email }).eq("id", profile.id);
    }

    if (newPassword) {
      await supabase.auth.updateUser({ password: newPassword });
    }

    showMessage("Datos actualizados.", "success");
    setSavingSecurity(false);
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin text-teal-600 h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-100">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* HEADER PERFIL */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 text-white shadow-xl px-8 py-6"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Avatar + datos */}
            <div className="flex items-center gap-6">
              <button
                onClick={handleAvatarClick}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/90 overflow-hidden shadow-xl bg-white/10"
              >
                {profile?.foto_url ? (
                  <img
                    src={profile.foto_url}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <UserIcon className="h-12 w-12 text-white m-auto mt-6" />
                )}

                <div className="absolute inset-0 bg-black/45 opacity-0 hover:opacity-100 flex items-center justify-center transition">
                  {uploadingAvatar ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleAvatarChange}
                className="hidden"
              />

              <div className="space-y-1">
                <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide bg-white/15 px-3 py-1 rounded-full">
                  <User className="h-3.5 w-3.5" />
                  Paciente
                </p>
                <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">
                  {displayName}
                </h1>
                <p className="text-xs opacity-90">
                  ID paciente:&nbsp;
                  <span className="font-mono text-[11px] bg-black/20 px-2 py-[2px] rounded-full">
                    {profile?.id}
                  </span>
                </p>
                <p className="text-sm flex items-center gap-1 opacity-90">
                  <Mail className="h-4 w-4" />
                  {email}
                </p>
              </div>
            </div>

            {/* Info lateral */}
            <div className="flex flex-col items-start md:items-end gap-1 text-xs sm:text-sm">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15">
                <Calendar className="h-4 w-4" />
                Miembro desde {memberSinceLabel}
              </p>
              {sexo && (
                <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 mt-1">
                  <User className="h-4 w-4" />
                  Sexo: {sexo}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* MENSAJE */}
        {msg && (
          <div
            className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${msgType === "success"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
              }`}
          >
            {msg}
          </div>
        )}

        {/* TARJETAS PRINCIPALES */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* DATOS PERSONALES */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-teal-700 flex items-center gap-2">
                <User className="h-4 w-4 text-teal-600" />
                Datos personales
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Nombre
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre"
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Apellido
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Apellido"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Teléfono
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono"
                />
              </div>

              {/* Sexo */}
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Sexo
                </label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="Hombre">Hombre</option>
                  <option value="Mujer">Mujer</option>
                  <option value="Otro">Otro / Prefiero no decirlo</option>
                </select>
              </div>

              {/* ID SOLO LECTURA */}
              <div>
                <label className="text-xs font-medium text-slate-600">
                  ID de paciente (solo lectura)
                </label>
                <input
                  disabled
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-mono text-slate-500"
                  value={profile?.id || ""}
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="mt-2 w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl py-2.5 text-sm font-semibold shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {savingProfile ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </motion.div>

          {/* SEGURIDAD */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-6 shadow-md border border-slate-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-700" />
                Seguridad y acceso
              </h2>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-4">
              {/* Correo */}
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Correo electrónico
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent py-2 text-sm focus:outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo"
                  />
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Nueva contraseña
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                />
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Confirmar contraseña
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-800 focus:border-slate-800"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                />
              </div>

              <button
                type="submit"
                disabled={savingSecurity}
                className="mt-2 w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 text-sm font-semibold shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {savingSecurity ? "Guardando..." : "Guardar seguridad"}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
