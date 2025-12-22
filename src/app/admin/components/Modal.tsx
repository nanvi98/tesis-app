'use client';

import { motion } from "framer-motion";

interface ModalProps {
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  confirmColor?: "green" | "red" | "gray";
  children: React.ReactNode;
}

export default function Modal({
  title,
  onClose,
  onConfirm,
  confirmText,
  confirmColor,
  children
}: ModalProps) {
  const colorClass =
    confirmColor === "green"
      ? "bg-emerald-500 hover:bg-emerald-600"
      : confirmColor === "red"
      ? "bg-rose-500 hover:bg-rose-600"
      : "bg-gray-500 hover:bg-gray-600";

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[999]">

      {/* BACKDROP ANIMATION */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* MODAL */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="
          relative z-[1000]
          w-[90%] max-w-md
          backdrop-blur-2xl bg-white/20 
          rounded-3xl shadow-2xl border border-white/40
          p-8
        "
      >
        {/* Title */}
        <h2 className="text-2xl font-bold text-[#0a324c] mb-4 drop-shadow">
          {title}
        </h2>

        <div className="mb-6 text-[#0b4a63]">{children}</div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 rounded-full bg-white/40 backdrop-blur-md hover:bg-white/60 border border-white/40"
            onClick={onClose}
          >
            Cancelar
          </button>

          {onConfirm && confirmText && (
            <button
              className={`px-4 py-2 rounded-full text-white shadow ${colorClass}`}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
