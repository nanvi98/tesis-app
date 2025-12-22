'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Stethoscope } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
}

function VerifyCodeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [particles, setParticles] = useState<Particle[]>([]);
  const [digits, setDigits] = useState<string[]>(Array(8).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleChangeDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...digits];
    updated[index] = value;
    setDigits(updated);

    if (value && index < digits.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const token = digits.join('').trim();

    if (token.length < 6) {
      setError('Ingresa el código completo.');
      return;
    }

    if (!email) {
      setError('Falta el correo asociado al código.');
      return;
    }

    const { error } = await supabase.auth.verifyOtp({
      token,
      type: 'email',
      email,
    });

    if (error) {
      setError(error.message || 'Código incorrecto o expirado.');
      return;
    }

    setSuccess('Código verificado ✔️');
    setTimeout(() => {
      router.push('/reset-password/new-password');
    }, 1200);
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* Fondo */}
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

      {/* Card */}
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
        <h1 className="text-3xl font-bold text-center text-[#0F3D3E] mb-2">
          Verificar código
        </h1>
        <p className="text-center text-gray-600 text-sm mb-6">
          Ingresa el código que enviamos a tu correo.
        </p>

        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div className="flex justify-center gap-2 mb-2">
            {digits.map((d, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                maxLength={1}
                value={d}
                onChange={(e) => handleChangeDigit(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="
                  w-10 h-12 text-center text-xl font-semibold 
                  rounded-xl bg-white/90 border border-[#CDEAE7]
                  focus:ring-2 focus:ring-[#2EC8B8]
                "
              />
            ))}
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.95 }}
            className="
              w-full py-3 text-white text-lg font-semibold rounded-xl
              shadow-xl bg-gradient-to-r from-[#2EC8B8] to-[#1E9BC8]
            "
          >
            Verificar código
          </motion.button>
        </form>

        {error && <p className="text-center text-red-500 mt-3 text-sm">{error}</p>}
        {success && <p className="text-center text-green-600 mt-3 text-sm">{success}</p>}

        <div className="mt-6 text-center text-sm text-gray-700">
          <button
            onClick={() => router.push('/reset-password/request')}
            className="text-[#1E9BC8] font-semibold hover:underline"
          >
            Volver a enviar código
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <VerifyCodeContent />
    </Suspense>
  );
}
