"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import Modal from "../components/Modal";
import toast, { Toaster } from "react-hot-toast";

interface CrearUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
  userToEdit?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    role: "paciente" | "medico" | "admin";
  };
}

export default function CrearUsuario({
  isOpen,
  onClose,
  onSuccess,
  userToEdit,
}: CrearUsuarioProps) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"paciente" | "medico" | "admin">("paciente");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userToEdit) {
      setNombre(userToEdit.nombre);
      setApellido(userToEdit.apellido);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
    } else {
      setNombre("");
      setApellido("");
      setEmail("");
      setRole("paciente");
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = async () => {
    if (!nombre || !apellido || !email || !role) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    setLoading(true);

    try {
      if (userToEdit) {
        // Editar usuario
        const { error } = await supabase
          .from("profiles")
          .update({ nombre, apellido, email, role })
          .eq("id", userToEdit.id);

        if (error) throw error;

        toast.success("Usuario actualizado correctamente.");
      } else {
        // Crear usuario (queda en pendiente para que luego lo apruebes)
        const { error } = await supabase.from("profiles").insert([
          {
            nombre,
            apellido,
            email,
            role,
            status: role=="medico"? "pendiente" : "activo",
          },
        ]);

        if (error) throw error;

        toast.success("Usuario creado correctamente.");
      }

      await onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />

      {isOpen && (
        <Modal
          title={userToEdit ? "Editar usuario" : "Crear nuevo usuario"}
          onClose={onClose}
          onConfirm={handleSubmit}
          confirmColor="green"
          confirmText={
            loading
              ? "Guardando..."
              : userToEdit
              ? "Guardar cambios"
              : "Crear usuario"
          }
        >
          <div className="flex flex-col gap-4 mt-2">
            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0a2e4d]">
                Nombre
              </label>
              <input
                type="text"
                placeholder="Nombre"
                className="px-4 py-2 rounded-xl border border-white/60 bg-white/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            {/* Apellido */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0a2e4d]">
                Apellido
              </label>
              <input
                type="text"
                placeholder="Apellido"
                className="px-4 py-2 rounded-xl border border-white/60 bg-white/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0a2e4d]">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="correo@ejemplo.com"
                className="px-4 py-2 rounded-xl border border-white/60 bg-white/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Rol */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#0a2e4d]">
                Rol
              </label>
              <select
                className="px-4 py-2 rounded-xl border border-white/60 bg-white/40 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-emerald-300 text-sm"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value as "paciente" | "medico" | "admin")
                }
              >
                <option value="paciente">Paciente</option>
                <option value="medico">Médico</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
