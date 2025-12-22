'use client';

import { motion } from "framer-motion";

export default function LoadingSpinner() {
  return (
    <motion.div
      className="
        w-14 h-14 
        border-4 rounded-full 
        border-white/40 border-t-[#0aa2c0]
        backdrop-blur-xl
        shadow-xl
      "
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
    />
  );
}
