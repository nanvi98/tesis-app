"use client";

import {
  useEffect,
  useState,
  useMemo,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Mail,
  Calendar,
  Camera,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  HeartPulse,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface Profile {
  id: string;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  role: string | null;
  status: string | null;
  foto_url?: string | null;
  created_at?: string;
}

export default function PerfilAdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<"success" | "error" | null>(null);

  // Formularios
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* ──────────────────────────────────────────
     Cargar usuario actual + profile
  ─────────────────────────────────────────── */
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
        console.error("Error obteniendo user:", userError);
        setLoadingProfile(false);
        setMsg("No se pudo obtener el usuario autenticado.");
        setMsgType("error");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, nombre, apellido, role, status, foto_url, created_at"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        console.error("Error obteniendo profile:", error);
        setMsg("No se encontró el perfil del administrador.");
        setMsgType("error");
        setLoadingProfile(false);
        return;
      }

      const p = data as Profile;
      setProfile(p);
      setNombre(p.nombre || "");
      setApellido(p.apellido || "");
      setEmail(p.email || user.email || "");

      setLoadingProfile(false);
    };

    loadProfile();
  }, []);

  /* ──────────────────────────────────────────
     Helpers de UI
  ─────────────────────────────────────────── */

  const displayName = useMemo(() => {
    if (nombre || apellido) {
      return `${nombre} ${apellido}`.trim();
    }
    if (profile?.email) return profile.email.split("@")[0];
    return "Administrador";
  }, [nombre, apellido, profile?.email]);

  const memberSinceLabel = useMemo(() => {
    if (!profile?.created_at) return "Fecha no disponible";
    try {
      const d = new Date(profile.created_at);
      return d.toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Fecha no disponible";
    }
  }, [profile?.created_at]);

  const statusLabel = useMemo(() => {
    if (!profile?.status) return "sin estado";
    return profile.status;
  }, [profile?.status]);

  const roleLabel = useMemo(() => {
    if (!profile?.role) return "Administrador";
    if (profile.role.toLowerCase() === "admin") return "Administrador";
    return profile.role;
  }, [profile?.role]);

  const showMessage = (text: string, type: "success" | "error") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => {
      setMsg(null);
      setMsgType(null);
    }, 4200);
  };

  /* ──────────────────────────────────────────
     Actualizar datos personales
  ─────────────────────────────────────────── */
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        nombre: nombre.trim() || null,
        apellido: apellido.trim() || null,
      })
      .eq("id", profile.id);

    if (error) {
      console.error("Error actualizando datos:", error);
      showMessage("No se pudieron guardar los cambios.", "error");
      setSavingProfile(false);
      return;
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            nombre: nombre.trim() || null,
            apellido: apellido.trim() || null,
          }
        : prev
    );

    showMessage("Datos personales actualizados.", "success");
    setSavingProfile(false);
  };

  /* ──────────────────────────────────────────
     Subir / cambiar avatar
  ─────────────────────────────────────────── */
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);

    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `admin-${profile.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error subiendo avatar:", uploadError);
        showMessage("No se pudo subir la imagen de perfil.", "error");
        setUploadingAvatar(false);
        return;
      }

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl || null;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ foto_url: publicUrl })
        .eq("id", profile.id);

      if (updateError) {
        console.error("Error guardando foto_url:", updateError);
        showMessage(
          "Se subió la imagen pero no se guardó en el perfil.",
          "error"
        );
      } else {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                foto_url: publicUrl,
              }
            : prev
        );
        showMessage("Foto de perfil actualizada.", "success");
      }
    } catch (err) {
      console.error(err);
      showMessage("Error inesperado subiendo la imagen.", "error");
    }

    setUploadingAvatar(false);
  };

  /* ──────────────────────────────────────────
     Actualizar email / contraseña
  ─────────────────────────────────────────── */
  const handleSaveSecurity = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    if (newPassword && newPassword !== confirmPassword) {
      showMessage("Las contraseñas no coinciden.", "error");
      return;
    }

    setSavingSecurity(true);

    try {
      // Actualizar email en Auth
      if (email && email !== profile.email) {
        const { error: authEmailError } = await supabase.auth.updateUser({
          email,
        });

        if (authEmailError) {
          console.error("Error actualizando email en Auth:", authEmailError);
          showMessage(
            "No se pudo actualizar el correo. Puede requerir volver a iniciar sesión.",
            "error"
          );
          setSavingSecurity(false);
          return;
        }

        const { error: profileEmailError } = await supabase
          .from("profiles")
          .update({ email })
          .eq("id", profile.id);

        if (profileEmailError) {
          console.error(
            "Error actualizando email en profile:",
            profileEmailError
          );
          showMessage(
            "Correo actualizado en autenticación, pero no en el perfil.",
            "error"
          );
          setSavingSecurity(false);
          return;
        }

        setProfile((prev) =>
          prev
            ? {
                ...prev,
                email,
              }
            : prev
        );
      }

      // Actualizar contraseña
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passwordError) {
          console.error("Error actualizando password:", passwordError);
          showMessage(
            "No se pudo actualizar la contraseña. Inténtalo de nuevo.",
            "error"
          );
          setSavingSecurity(false);
          return;
        }
      }

      setNewPassword("");
      setConfirmPassword("");
      showMessage("Seguridad de la cuenta actualizada.", "success");
    } catch (err) {
      console.error(err);
      showMessage("Error inesperado al actualizar la seguridad.", "error");
    }

    setSavingSecurity(false);
  };

  /* ──────────────────────────────────────────
     RENDER
  ─────────────────────────────────────────── */

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-100 px-6 py-6 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-teal-700">
          <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
          <p className="text-sm">Cargando tu perfil de administrador…</p>
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
            No se encontró tu perfil
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Verifica que tengas un registro en la tabla{" "}
            <code className="px-1 py-0.5 rounded bg-slate-100 text-xs">
              profiles
            </code>{" "}
            con tu mismo{" "}
            <code className="px-1 py-0.5 rounded bg-slate-100 text-xs">id</code>{" "}
            de autenticación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-cyan-50 to-teal-100">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-5 sm:px-6 lg:px-4 space-y-6">
        {/* HEADER HERO estilo mock médico */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-teal-500 via-cyan-500 to-sky-500 px-6 py-5 sm:px-8 sm:py-7 shadow-[0_26px_70px_rgba(15,23,42,0.45)] text-white"
        >
          {/* brillos laterales */}
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
                {profile.foto_url ? (
                  <img
                    src={profile.foto_url}
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
                <ShieldCheck className="h-4 w-4" />
                Perfil de administrador
              </div>

              <h1 className="mt-1 text-2xl sm:text-3xl font-semibold">
                {displayName}
              </h1>

              <p className="mt-1 text-sm text-teal-50/95">
                {profile.email}
              </p>

              <p className="mt-2 text-xs sm:text-sm text-teal-50/90 max-w-2xl">
                Gestiona tu identidad, seguridad y presencia como administradora
                del sistema.
              </p>

              {/* Pills inferiores */}
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] sm:text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-medium backdrop-blur">
                  <UserIcon className="h-3.5 w-3.5" />
                  {roleLabel}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 backdrop-blur">
                  <Calendar className="h-3.5 w-3.5" />
                  Miembro desde {memberSinceLabel}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 backdrop-blur ${
                    statusLabel === "activo"
                      ? "bg-emerald-400/30 text-emerald-50"
                      : "bg-slate-900/25 text-slate-50"
                  }`}
                >
                  <HeartPulse className="h-3.5 w-3.5" />
                  Estado: {statusLabel}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mensaje global */}
        {msg && msgType && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm shadow-md border ${
              msgType === "success"
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-rose-50 text-rose-700 border-rose-100"
            }`}
          >
            {msgType === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            <span>{msg}</span>
          </motion.div>
        )}

        {/* GRID principal: 2 tarjetas como en el mock */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* DATOS PERSONALES */}
          <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="relative rounded-[28px] bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur border border-teal-100/70"
          >
            {/* silueta suave al fondo (simulada) */}
            <div className="pointer-events-none absolute -bottom-6 right-4 h-40 w-20 bg-gradient-to-t from-teal-50 via-teal-50/70 to-transparent opacity-70 rounded-full" />

            <h2 className="text-sm font-semibold text-teal-800">
              DATOS PERSONALES
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-md">
              Gestiona tu identidad, seguridad y presencia como administradora
              dentro del sistema.
            </p>

            <form
              onSubmit={handleSaveProfile}
              className="relative space-y-4 mt-4"
            >
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
                    onChange={(e) => setApellido(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="Ej. Ramírez"
                  />
                </div>
              </div>

              {/* Estado + botón */}
              <div className="pt-2">
                <p className="text-xs text-slate-500 mb-3">
                  Estado de la cuenta:{" "}
                  <span
                    className={`font-semibold ${
                      statusLabel === "activo"
                        ? "text-emerald-600"
                        : "text-slate-600"
                    }`}
                  >
                    {statusLabel}
                  </span>
                </p>

                <button
                  type="submit"
                  disabled={savingProfile}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* SEGURIDAD Y ACCESO */}
          <motion.div
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.14 }}
            className="relative rounded-[28px] bg-white/95 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur border border-teal-100/70"
          >
            {/* icono cardiograma al fondo */}
            <div className="pointer-events-none absolute -top-4 right-5 opacity-10">
              <HeartPulse className="h-16 w-16 text-teal-400" />
            </div>

            <h2 className="text-sm font-semibold text-teal-800">
              SEGURIDAD Y ACCESO
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-md">
              Actualiza tu correo y contraseña. Algunos cambios pueden requerir
              volver a iniciar sesión.
            </p>

            <form
              onSubmit={handleSaveSecurity}
              className="relative space-y-4 mt-4"
            >
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
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="text-xs font-medium text-slate-700 flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  Nueva contraseña
                </label>
                <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-600">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="Déjala vacía si no quieres cambiarla"
                  />
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="text-xs font-medium text-slate-700">
                  Confirmar nueva contraseña
                </label>
                <div className="mt-1 flex items-center rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-2">
                  <span className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-50 text-teal-600">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
                    placeholder="Vuelve a escribir la nueva contraseña"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Consejo: usa contraseñas fuertes con letras, números y
                  símbolos. Evita reutilizar contraseñas de otros sitios.
                </p>

                <button
                  type="submit"
                  disabled={savingSecurity}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-cyan-50 shadow-md disabled:opacity-60"
                >
                  {savingSecurity ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Actualizando…
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Guardar seguridad
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
