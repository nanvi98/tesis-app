'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stethoscope, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export default function RequestResetPage() {
  const router = useRouter();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false, // solo usuarios ya registrados
      },
    });

    if (error) {
      setError(error.message || 'No se pudo enviar el código.');
      return;
    }

    setSuccess('📩 Te enviamos un código a tu correo.');
    // Pasar el correo a la siguiente pantalla
    setTimeout(() => {
      router.push(`/reset-password/code?email=${encodeURIComponent(normalizedEmail)}`);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Fondo animado */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(120deg, #DFF7F3 0%, #E7F9FD 40%, #CBF6EE 70%, #EFFFFA 100%)',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* Partículas */}
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
          animate={{ y: ['0px', '-25px', '0px'] }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      ))}

      {/* Logos */}
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

      {/* Estetoscopio */}
      <motion.div
        className="absolute right-10 bottom-10 text-[#2EC8B8]/15"
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 6, repeat: Infinity }}
      >
        <Stethoscope size={220} />
      </motion.div>

      {/* CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.9 }}
        className="
          relative w-[460px] p-10 rounded-3xl 
          backdrop-blur-2xl bg-white/55 
          shadow-[0_10px_60px_rgba(0,0,0,0.18)]
          border border-white/70
        "
      >
        {/* Halo */}
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

        <h1 className="text-3xl font-bold text-center text-[#0F3D3E] mb-2">
          Restablecer contraseña
        </h1>
        <p className="text-center text-gray-600 text-sm mb-6">
          Ingresa tu correo para enviarte un código de verificación.
        </p>

        <form onSubmit={handleSendCode} className="space-y-5">
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
              required
            />
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className="
              w-full py-3 text-white text-lg font-semibold rounded-xl
              shadow-xl bg-gradient-to-r from-[#2EC8B8] to-[#1E9BC8]
            "
          >
            Enviar código
          </motion.button>
        </form>

        {error && <p className="text-center text-red-500 mt-3 text-sm">{error}</p>}
        {success && <p className="text-center text-green-600 mt-3 text-sm">{success}</p>}

        <div className="mt-6 text-center text-sm text-gray-700">
          <button
            onClick={() => router.push('/login')}
            className="text-[#1E9BC8] font-semibold hover:underline"
          >
            Regresar al login
          </button>
        </div>
      </motion.div>
    </div>
  );
}
