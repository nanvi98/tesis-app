"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  Stethoscope,
  Mail,
  Lock,
  User,
  Phone,
  Eye,
  EyeOff,
  FileText,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [telefono, setTelefono] = useState("");
  const [sexo, setSexo] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"paciente" | "medico">("paciente");
  const [cedula, setCedula] = useState("");
  const [especialidad, setEspecialidad] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEmailValid = useMemo(
    () =>
      email.length === 0
        ? null
        : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );

  const isPhoneValid = useMemo(
    () => (telefono.length === 0 ? null : /^\d{10}$/.test(telefono)),
    [telefono]
  );

  const passwordsMatch = useMemo(
    () =>
      password.length === 0 && confirmPassword.length === 0
        ? null
        : password === confirmPassword,
    [password, confirmPassword]
  );

  const passwordStrength = useMemo(() => {
    const pwd = password;
    let score = 0;

    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*()_\-+=<>?{}[\]~]/.test(pwd)) score++;

    let level = 0;
    if (score === 0) level = 0;
    else if (score <= 2) level = 1;
    else if (score === 3) level = 2;
    else level = 3;

    const label =
      level === 0
        ? "Muy débil"
        : level === 1
        ? "Débil"
        : level === 2
        ? "Buena"
        : "Muy segura";

    const barClass =
      level === 0
        ? "w-1/4 bg-red-400"
        : level === 1
        ? "w-2/4 bg-orange-400"
        : level === 2
        ? "w-3/4 bg-yellow-400"
        : "w-full bg-green-500";

    return { level, label, barClass };
  }, [password]);

  const validatePasswordHard = (pwd: string) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=<>?{}[\]~]).{8,}$/.test(pwd);

  const handleTelefonoChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    setTelefono(digitsOnly.slice(0, 10));
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSuccess("");

    if (!validatePasswordHard(password)) {
      setError(
        "⚠️ La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un símbolo."
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("⚠️ Las contraseñas no coinciden.");
      return;
    }
    if (!/^\d{10}$/.test(telefono)) {
      setError("⚠️ El teléfono debe tener 10 dígitos.");
      return;
    }
    if (!sexo) {
      setError("⚠️ Selecciona el sexo.");
      return;
    }
    if (role === "medico" && !especialidad.trim()) {
      setError("⚠️ Ingresa la especialidad.");
      return;
    }

    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });

    if (signUpError) {
      setError("⚠️ " + signUpError.message);
      setSubmitting(false);
      return;
    }

    const authUser = data?.user;
    if (!authUser) {
      setError("⚠️ Error inesperado creando el usuario.");
      setSubmitting(false);
      return;
    }

    const titulo =
      role === "medico"
        ? sexo === "mujer"
          ? "Dra."
          : "Dr."
        : null;

    // 👌 Aquí actualizamos el perfil en lugar de insertarlo
const { error: updateError } = await supabase
  .from("profiles")
  .update({
    nombre,
    apellido: apellidos,
    telefono,
    sexo,
    email: email.trim().toLowerCase(),
    role,
    cedula: role === "medico" ? cedula : null,
    especialidad: role === "medico" ? especialidad : null,
    titulo,
    approved: role === "medico" ? false : true,
  })
  .eq("id", authUser.id);

if (updateError) {
  setError("⚠️ " + updateError.message);
  setSubmitting(false);
  return;
}


    if (role === "medico") {
      setSuccess(
        "✅ Cuenta creada correctamente. Tu registro está en espera de aprobación por un administrador."
      );
    } else {
      setSuccess("✅ Cuenta creada. Redirigiendo al login...");
      setTimeout(() => router.push("/login"), 1800);
    }

    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center
bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.9)_0%,_rgba(210,251,244,1)_100%)]
overflow-hidden">

      <motion.img
        src="/ipn.png"
        alt="IPN"
        className="absolute top-4 left-6 w-24 h-auto opacity-90 z-20"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: [0, -4, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.img
        src="/upiita.png"
        alt="UPIITA"
        className="absolute top-5 right-6 w-20 h-auto opacity-90 z-20"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: [0, -4, 0] }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          repeatType: "reverse",
          delay: 0.3,
        }}
      />
      {/* PUNTOS DEL FONDO */}
<motion.div
  className="absolute inset-0 pointer-events-none z-0"
  initial={{ opacity: 0 }}
  animate={{ opacity: 0.9 }}
  transition={{ duration: 1.2 }}
>
  <div className="absolute w-3 h-3 bg-cyan-300/30 rounded-full blur-[1px] top-24 left-40" />
  <div className="absolute w-2 h-2 bg-cyan-400/30 rounded-full top-1/3 left-1/4" />
  <div className="absolute w-2 h-2 bg-teal-400/30 rounded-full top-1/2 left-1/2" />
  <div className="absolute w-3 h-3 bg-teal-300/30 rounded-full blur-[1px] bottom-32 left-1/3" />
  <div className="absolute w-2 h-2 bg-cyan-400/30 rounded-full bottom-20 left-1/5" />
  <div className="absolute w-3 h-3 bg-teal-300/25 rounded-full blur-[1px] top-28 right-72" />
  <div className="absolute w-2 h-2 bg-cyan-300/25 rounded-full top-1/2 right-1/3" />
  <div className="absolute w-2 h-2 bg-teal-400/30 rounded-full bottom-28 right-1/4" />
</motion.div>

{/* ESTETOSCOPIO */}
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 0.13 }}
  transition={{ duration: 1.4 }}
  className="absolute bottom-4 right-8 text-cyan-300 z-0"
>
  <Stethoscope size={230} />
</motion.div>


      {/* CARD FINAL IGUAL AL LOGIN */}
      <div className="relative z-10 w-full max-w-5xl px-6 md:px-10">
        <div className="rounded-3xl bg-white/70 shadow-[0_8px_40px_rgba(0,0,0,0.08)] backdrop-blur-2xl border border-white/50 px-8 py-10 md:px-12 md:py-10">

          {/* HEADER */}
          <div className="flex items-center gap-4 mb-6">
            <div className="rounded-2xl bg-teal-500 p-3 shadow-md">
              <Stethoscope className="text-white" size={34} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                Crear cuenta
              </h1>
              <p className="text-gray-500 text-sm">
                Regístrate para usar el sistema de apoyo al diagnóstico médico.
              </p>
            </div>
          </div>

          {/* FORMULARIO — NO SE MODIFICÓ NADA */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Nombre / Apellidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <User className="absolute left-3 top-3 text-teal-600" size={20} />
                <input
                  type="text"
                  placeholder="Nombre"
                  className="w-full pl-10 pr-3 py-3 border rounded-xl bg-white/80 outline-none focus:ring-2 focus:ring-teal-400"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <User className="absolute left-3 top-3 text-teal-600" size={20} />
                <input
                  type="text"
                  placeholder="Apellidos"
                  className="w-full pl-10 pr-3 py-3 border rounded-xl bg-white/80 outline-none focus:ring-2 focus:ring-teal-400"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Teléfono / Sexo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Phone className="absolute left-3 top-3 text-teal-600" size={20} />
                <input
                  type="text"
                  placeholder="Teléfono (10 dígitos)"
                  className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-white/80 outline-none focus:ring-2 ${
                    isPhoneValid === false
                      ? "border-red-400 focus:ring-red-300"
                      : isPhoneValid === true
                      ? "border-green-500 focus:ring-green-300"
                      : "focus:ring-teal-400"
                  }`}
                  value={telefono}
                  onChange={(e) => handleTelefonoChange(e.target.value)}
                  required
                />
                {isPhoneValid !== null && (
                  <div className="absolute right-3 top-3">
                    {isPhoneValid ? (
                      <CheckCircle2 className="text-green-500" size={20} />
                    ) : (
                      <XCircle className="text-red-500" size={20} />
                    )}
                  </div>
                )}
              </div>

              <select
                className="w-full border rounded-xl py-3 px-3 bg-white/80 outline-none focus:ring-2 focus:ring-teal-400"
                value={sexo}
                onChange={(e) => setSexo(e.target.value)}
                required
              >
                <option value="">Selecciona el sexo</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
              </select>
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-teal-600" size={20} />
              <input
                type="email"
                placeholder="Correo electrónico"
                className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-white/80 outline-none focus:ring-2 ${
                  isEmailValid === false
                    ? "border-red-400 focus:ring-red-300"
                    : isEmailValid === true
                    ? "border-green-500 focus:ring-green-300"
                    : "focus:ring-teal-400"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {isEmailValid !== null && (
                <div className="absolute right-3 top-3">
                  {isEmailValid ? (
                    <CheckCircle2 className="text-green-500" size={20} />
                  ) : (
                    <XCircle className="text-red-500" size={20} />
                  )}
                </div>
              )}
            </div>

            {/* Contraseñas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3 text-teal-600"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    className="w-full pl-10 pr-10 py-3 border rounded-xl bg-white/80 outline-none focus:ring-2 focus:ring-teal-400"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-600"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {password && (
                  <div className="space-y-1">
                    <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${passwordStrength.barClass}`}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Seguridad:{" "}
                      <span className="font-semibold">
                        {passwordStrength.label}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3 text-teal-600"
                    size={20}
                  />
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirmar contraseña"
                    className={`w-full pl-10 pr-10 py-3 border rounded-xl bg-white/80 outline-none focus:ring-2 ${
                      passwordsMatch === false
                        ? "border-red-400 focus:ring-red-300"
                        : passwordsMatch === true
                        ? "border-green-500 focus:ring-green-300"
                        : "focus:ring-teal-400"
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-600"
                    onClick={() => setShowConfirm((v) => !v)}
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {passwordsMatch !== null && (
                  <p
                    className={`text-xs flex items-center gap-1 ${
                      passwordsMatch ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <CheckCircle2 size={14} /> Coinciden
                      </>
                    ) : (
                      <>
                        <XCircle size={14} /> No coinciden
                      </>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Rol / cédula */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                className="w-full border rounded-xl py-3 px-3 bg-white/80 outline-none focus:ring-2 focus:ring-teal-400"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "paciente" | "medico")
                }
              >
                <option value="paciente">Paciente</option>
                <option value="medico">Médico</option>
              </select>

              {role === "medico" && (
                <div className="relative">
                  <FileText
                    className="absolute left-3 top-3 text-teal-600"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Cédula profesional"
                    className="w-full pl-10 pr-3 py-3 border rounded-xl bg-white/80 outline-none focus:ring-2 focus:ring-teal-400"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Especialidad */}
            {role === "medico" && (
              <div className="relative">
                <FileText
                  className="absolute left-3 top-3 text-teal-600"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Especialidad"
                  className="w-full pl-10 pr-3 py-3 border rounded-xl bg-white/80 outline-none focus:ring-2 focus:ring-teal-400"
                  value={especialidad}
                  onChange={(e) => setEspecialidad(e.target.value)}
                  required={role === "medico"}
                />
              </div>
            )}

            {/* Botón */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-3 rounded-xl font-semibold shadow-lg hover:opacity-90 transition disabled:opacity-60"
            >
              {submitting ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-500 text-sm mt-4 text-center"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-green-600 text-sm mt-4 text-center font-medium"
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-6 flex justify-between text-sm text-gray-600">
            <button
              onClick={() => router.push("/login")}
              className="text-teal-600 hover:underline font-medium"
            >
              Regresar al login
            </button>

            <p>
              Sistema de apoyo al diagnóstico médico · <b>IPN</b> · <b>UPIITA</b>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
