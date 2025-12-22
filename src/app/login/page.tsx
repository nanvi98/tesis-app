'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [userName, setUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // partículas flotantes
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; size: number; opacity: number }[]
  >([]);

  useEffect(() => {
    const arr = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      opacity: Math.random() * 0.35 + 0.15,
    }));
    setParticles(arr);
  }, []);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

    if (authError) {
      setError('⚠️ Usuario o contraseña incorrectos.');
      return;
    }

    const user = authData.user;
    if (!user) {
      setError('⚠️ Error inesperado.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile) {
      setError('⚠️ No se pudo obtener tu perfil.');
      return;
    }

    if (profile.role === 'medico' && profile.cedula_status !== 'valida') {
      await supabase.auth.signOut();
      setError('⚠️ Tu cuenta está pendiente de aprobación.');
      return;
    }

    setUserName(profile.nombre || 'Usuario');
    setShowWelcome(true);

    setTimeout(() => {
      if (profile.role === 'admin') router.push('/admin');
      else if (profile.role === 'medico') router.push('/panel/medico');
      else if(profile.role==='paciente')router.push('/panel/paciente');
      else router.push('/')
    }, 1500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">

      {/* ✨ Fondo animado */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, #DFF7F3 0%, #E7F9FD 40%, #CBF6EE 70%, #EFFFFA 100%)',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      />

      {/* ✨ Partículas flotantes */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#2EC8B8]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: ['0px', '-20px', '0px'],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}

      {/* Logos flotantes */}
      <motion.img
        src="/ipn.png"
        className="absolute top-7 left-7 w-25 opacity-90"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse' }}
      />

      <motion.img
        src="/upiita.png"
        className="absolute top-7 right-7 w-20 opacity-95"
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          repeatType: 'reverse',
          delay: 0.3,
        }}
      />

      {/* Stetoscopio gigante */}
      <motion.div
        className="absolute right-10 bottom-10 text-[#2EC8B8]/15"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <Stethoscope size={220} />
      </motion.div>

      {/* ✨ CARD HEAVY */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9 }}
        className="
          relative w-[460px] p-10 rounded-3xl 
          backdrop-blur-2xl 
          bg-white/55 
          shadow-[0_10px_60px_rgba(0,0,0,0.18)]
          border border-white/70
        "
      >
        {/* Halo turquesa */}
        <div className="absolute inset-0 rounded-3xl pointer-events-none border-[3px] border-transparent">
          <motion.div
            className="absolute inset-0 rounded-3xl"
            style={{
              border: '3px solid',
              borderImage:
                'linear-gradient(90deg, #2EC8B8, #1E9BC8, #2EC8B8) 1',
            }}
            animate={{
              opacity: [0.6, 1, 0.6],
              filter: ['blur(2px)', 'blur(5px)', 'blur(2px)'],
            }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        </div>

        {/* Contenido */}
        {!showWelcome ? (
          <>
            {/* Icono glow */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="flex justify-center mb-6"
            >
              <div className="p-5 bg-gradient-to-br from-[#2EC8B8] to-[#1E9BC8] rounded-2xl shadow-lg relative">
                <div className="absolute inset-0 rounded-2xl blur-xl bg-[#2EC8B8]/40" />
                <Stethoscope size={50} className="text-white relative" />
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-center text-[#0F3D3E] mb-2">
              Bienvenido
            </h1>
            <p className="text-center text-gray-600 text-sm mb-6">
              Accede a tu plataforma de apoyo al diagnóstoco 
            </p>

            <form onSubmit={handleLogin} className="space-y-5">

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-[#1E9BC8]" size={18} />
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="
                    w-full pl-10 pr-4 py-3 rounded-xl bg-white/80
                    border border-[#CDEAE7]
                    shadow-inner focus:ring-2 focus:ring-[#2EC8B8]
                  "
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-[#1E9BC8]" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  className="
                    w-full pl-10 pr-12 py-3 rounded-xl bg-white/80
                    border border-[#CDEAE7]
                    shadow-inner focus:ring-2 focus:ring-[#2EC8B8]
                  "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="text-right text-sm">
                <a href="/reset-password" className="text-[#1E9BC8] hover:underline">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Botón heavy */}
              <motion.button
                type="submit"
                whileTap={{ scale: 0.95 }}
                className="
                  w-full py-3 text-white text-lg font-semibold rounded-xl
                  shadow-xl bg-gradient-to-r from-[#2EC8B8] to-[#1E9BC8]
                "
              >
                Ingresar
              </motion.button>
            </form>

            {error && (
              <p className="text-center text-red-500 mt-3 text-sm">{error}</p>
            )}

            <div className="mt-6 text-center text-sm text-gray-700">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="text-[#1E9BC8] font-semibold">
                Crear cuenta
              </a>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-10"
          >
            <h2 className="text-3xl font-bold text-[#2EC8B8] mb-2">
              ¡Bienvenido!
            </h2>
            <p className="text-[#0F3D3E] font-semibold text-xl">{userName}</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
