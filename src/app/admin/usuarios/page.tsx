"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Table from "../components/Table";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import { UserCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface Profile {
  id: string;
  nombre: string;
  apellido: string | null;
  email: string;
  role: "paciente" | "medico" | "admin";
  status: "activo" | "inactivo" | "pendiente" | "rechazado" | "bloqueado" | null;
  avatar_url?: string | null;
  notas?: string | null;
  created_at?: string;
  cedula_status?: "pendiente" | "valida" | "rechazada" | null;
  approved?: boolean | null;
}

type ModalType = "aprobar" | "rechazar" | "bloquear" | "deshacer" | "nota" | "eliminar";

export default function UsuariosPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<"todos" | "paciente" | "medico" | "admin">("todos");
  const [statusFilter, setStatusFilter] =
    useState<"todos" | "activo" | "inactivo" | "pendiente" | "rechazado" | "bloqueado">("todos");

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [notaTemp, setNotaTemp] = useState("");

  const [lastAction, setLastAction] = useState<{
    userId: string;
    prevStatus: Profile["status"];
  } | null>(null);

  // 🚀 cargar usuarios siempre
  const loadUsers = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/getAllUsers",{ cache: "no-store" });
      const text = await res.text();
      const users = JSON.parse(text);
      setUsers(users);
    } catch (e) {
      console.error("ERROR FETCH:", e);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter]);

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (roleFilter !== "todos") list = list.filter((u) => u.role === roleFilter);
    if (statusFilter !== "todos") list = list.filter((u) => u.status === statusFilter);

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.nombre.toLowerCase().includes(s) ||
          (u.apellido ?? "").toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }

    return list;
  }, [users, roleFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const pageUsers = filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);

  const statusBadge = (status: Profile["status"]) => {
    const realStatus = status ?? "activo"; // 👈 evita null o undefined

    const base = "px-3 py-1 rounded-full text-xs font-semibold shadow-sm border";
    switch (realStatus) {
      case "activo":
        return (
          <span className={`${base} bg-emerald-50 text-emerald-700 border-emerald-100`}>
            activo
          </span>
        );
      case "pendiente":
        return (
          <span className={`${base} bg-amber-50 text-amber-700 border-amber-100`}>
            pendiente
          </span>
        );
      case "rechazado":
        return (
          <span className={`${base} bg-rose-50 text-rose-700 border-rose-100`}>
            rechazado
          </span>
        );
      case "bloqueado":
        return (
          <span className={`${base} bg-slate-100 text-slate-700 border-slate-200`}>
            bloqueado
          </span>
        );
      case "inactivo":
        return (
          <span className={`${base} bg-slate-50 text-slate-500 border-slate-100`}>
            inactivo
          </span>
        );
      default:
        return <span className={base}>{realStatus}</span>;
    }
  };

  const openAction = (user: Profile, type: ModalType) => {
    setSelectedUser(user);
    setModalType(type);
    if (type === "nota") setNotaTemp(user.notas ?? "");
    setShowModal(true);
  };

  // ✔ handler con fixes importantes
  const handleConfirm = async () => {
    if (!selectedUser || !modalType) return;

    if (modalType === "nota") {
      const { error } = await supabase
        .from("profiles")
        .update({ notas: notaTemp })
        .eq("id", selectedUser.id);

      if (!error) {
        setSelectedUser(null);
        await loadUsers();
      }
      setShowModal(false);
      return;
    }

  if (modalType === "eliminar") {
  const id = selectedUser.id;
  setSelectedUser(null);

  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  await loadUsers();
  setShowModal(false);
  return;
}



    let newStatus: Profile["status"] | null = null;

    if (modalType === "aprobar") newStatus = "activo";
    if (modalType === "rechazar") newStatus = "rechazado";
    if (modalType === "bloquear") newStatus = "bloqueado";

    if (modalType === "deshacer") {
      newStatus =
        lastAction && lastAction.userId === selectedUser.id
          ? lastAction.prevStatus
          : "pendiente";
    }

    const updatePayload: any = { status: newStatus };

    if (modalType === "aprobar" && selectedUser.role === "medico") {
      updatePayload.cedula_status = "valida";
      updatePayload.approved = true;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", selectedUser.id);

    if (!error) {
      setSelectedUser(null);
      await loadUsers();
    }

    setShowModal(false);
  };

  const confirmTitle = () => {
    if (!modalType) return "";
    if (modalType === "nota") return "Agregar / editar nota";
    if (modalType === "aprobar") return "Aprobar usuario";
    if (modalType === "rechazar") return "Rechazar usuario";
    if (modalType === "bloquear") return "Bloquear usuario";
    if (modalType === "deshacer") return "Deshacer última acción";
    if (modalType === "eliminar") return "Eliminar usuario";
    return "";
  };

  const confirmColor = () => {
    if (!modalType) return "green" as const;
    if (modalType === "rechazar" || modalType === "bloquear" || modalType === "eliminar")
      return "red" as const;
    if (modalType === "deshacer") return "gray" as const;
    return "green" as const;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#dff7ff] via-[#e8fbff] to-[#f5ffff]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-10 bg-gradient-to-b from-[#dff7ff] via-[#e8fbff] to-[#f5ffff]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold text-[#0a2e4d] drop-shadow-sm">
          Gestión de usuarios
        </h1>
        <p className="text-[#4d7c92] mt-1">
          Administra roles, estados y notas internas de pacientes, médicos y administradores.
        </p>
      </motion.div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="backdrop-blur-xl bg-white/30 border border-white/40 shadow-lg rounded-full px-5 py-2 flex items-center w-full sm:w-80">
          <span className="text-[#0aa2c0] mr-2">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre, apellido o correo..."
            className="bg-transparent w-full placeholder:text-[#6ba9be] focus:outline-none text-[#083b54]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="backdrop-blur-xl bg-white/30 border border-white/40 shadow-lg rounded-full px-5 py-2 text-[#0a516d]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
        >
          <option value="todos">Todos los roles</option>
          <option value="paciente">Pacientes</option>
          <option value="medico">Médicos</option>
          <option value="admin">Administradores</option>
        </select>

        <select
          className="backdrop-blur-xl bg-white/30 border border-white/40 shadow-lg rounded-full px-5 py-2 text-[#0a516d]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="pendiente">Pendiente</option>
          <option value="rechazado">Rechazado</option>
          <option value="bloqueado">Bloqueado</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      {/* TABLA + CONTENEDOR GLASS */}
      <div className="p-6 rounded-3xl backdrop-blur-2xl bg-white/20 border border-white/40 shadow-2xl">
        <Table
          headers={["Nombre", "Email", "Rol", "Estado", "Notas", "Acciones"]}
        >
          {pageUsers.map((u) => (
            <tr key={u.id} className="hover:bg-white/40 transition">
              <td className="px-4 py-3 flex items-center gap-3 text-[#083b54]">
                {u.avatar_url ? (
                  <img
                    src={u.avatar_url}
                    alt="avatar"
                    className="w-10 h-10 rounded-full shadow"
                  />
                ) : (
                  <UserCircle2 size={34} className="text-[#0aa2c0]" />
                )}
                <span className="font-medium">
                  {u.nombre} {u.apellido ?? ""}
                </span>
              </td>

              <td className="px-4 py-3 text-[#0b5678]">{u.email}</td>
              <td className="px-4 py-3 text-[#0b5678] capitalize">
                {u.role}
              </td>
              <td className="px-4 py-3">{statusBadge(u.status)}</td>

              <td className="px-4 py-3 text-sm">
                {u.notas ? (
                  <span className="text-[#446876] line-clamp-2">
                    {u.notas}
                  </span>
                ) : (
                  <span className="text-[#94a9b0] italic">Sin notas</span>
                )}
              </td>
              <td className="px-4 py-3 flex gap-2 flex-wrap">

                {/* SI ES MÉDICO Y LA CÉDULA ES VÁLIDA → mostrar aprobar */}
                {u.role === "medico" && u.cedula_status === "valida" && u.approved !== true && (
                  <button
                    onClick={() => openAction(u, "aprobar")}
                    className="px-3 py-1 rounded-full bg-emerald-500 text-white shadow hover:bg-emerald-600 text-xs"
                  >
                    Aprobar médico
                  </button>
                )}

                {/* SI LA CÉDULA ESTA RECHAZADA → botón rechazar */}
                {u.role === "medico" && u.cedula_status === "rechazada" && (
                  <button
                    onClick={() => openAction(u, "rechazar")}
                    className="px-3 py-1 rounded-full bg-rose-500 text-white shadow hover:bg-rose-600 text-xs"
                  >
                    Rechazar
                  </button>
                )}

                {/* Tus botones existentes se quedan igual */}
                {u.status === "pendiente" && (
                  <>
                    <button
                      onClick={() => openAction(u, "aprobar")}
                      className="px-3 py-1 rounded-full bg-emerald-500 text-white shadow hover:bg-emerald-600 text-xs"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => openAction(u, "rechazar")}
                      className="px-3 py-1 rounded-full bg-rose-500 text-white shadow hover:bg-rose-600 text-xs"
                    >
                      Rechazar
                    </button>
                  </>
                )}

                {u.status === "activo" && (
                  <button
                    onClick={() => openAction(u, "bloquear")}
                    className="px-3 py-1 rounded-full bg-slate-600 text-white shadow hover:bg-slate-700 text-xs"
                  >
                    Bloquear
                  </button>
                )}

                {(u.status === "rechazado" || u.status === "bloqueado") && (
                  <button
                    onClick={() => openAction(u, "deshacer")}
                    className="px-3 py-1 rounded-full bg-slate-400 text-white shadow hover:bg-slate-500 text-xs"
                  >
                    Deshacer
                  </button>
                )}

                <button
                  onClick={() => openAction(u, "nota")}
                  className="px-3 py-1 rounded-full bg-[#0aa2c0] text-white shadow hover:bg-[#0989a6] text-xs"
                >
                  Nota
                </button>
                <button
                  onClick={() => openAction(u, "eliminar")}
                  className="px-3 py-1 rounded-full bg-red-500 text-white shadow hover:bg-red-600 text-xs"
                >
                  Eliminar
                </button>

              </td>
            </tr>
          ))}
        </Table>

        {/* Paginación */}
        {filteredUsers.length > 0 && (
          <div className="flex items-center justify-between text-sm text-[#0e4a63] mt-4 px-2">
            <span>
              Mostrando{" "}
              <strong>
                {startIndex + 1}–
                {Math.min(startIndex + PAGE_SIZE, filteredUsers.length)}
              </strong>{" "}
              de <strong>{filteredUsers.length}</strong> usuarios
            </span>
            <div className="flex gap-2">
              <button
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-1 rounded-full bg-white/40 border border-white/60 backdrop-blur-md disabled:opacity-40"
              >
                Anterior
              </button>
              <span>
                Página <strong>{safePage}</strong> de{" "}
                <strong>{totalPages}</strong>
              </span>
              <button
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-1 rounded-full bg-white/40 border border-white/60 backdrop-blur-md disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showModal && selectedUser && modalType && (
        <Modal
          title={confirmTitle()}
          onClose={() => setShowModal(false)}
          onConfirm={handleConfirm}
          confirmText="Confirmar"
          confirmColor={confirmColor()}
        >
          {modalType === "nota" ? (
            <div className="space-y-3">
              <p className="text-sm text-[#0c4a63]">
                Nota interna para{" "}
                <strong>
                  {selectedUser.nombre} {selectedUser.apellido}
                </strong>
                .
              </p>
              <textarea
                className="w-full border rounded-xl px-3 py-2 text-sm bg-white/40 backdrop-blur-md border-white/60 outline-none"
                rows={4}
                value={notaTemp}
                onChange={(e) => setNotaTemp(e.target.value)}
                placeholder="Escribe aquí la nota interna..."
              />
            </div>
          ) : (
            <p className="text-sm text-[#0c4a63]">
              ¿Estás segura de{" "}
              <strong>
                {modalType === "aprobar"
                  ? "aprobar"
                  : modalType === "rechazar"
                    ? "rechazar"
                    : modalType === "bloquear"
                      ? "bloquear"
                      : "deshacer la última acción de"}
              </strong>{" "}
              al usuario{" "}
              <strong>
                {selectedUser.nombre} {selectedUser.apellido}
              </strong>
              ?
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
