"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Edit,
  MoreVertical,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRoundCog,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Position = {
  id: string;
  name: string;
  status: "active" | "inactive";
};

type PositionForm = {
  name: string;
  status: "active" | "inactive";
};

const defaultPositions: Position[] = [
  { id: "position-admin-sosmed", name: "ADMIN SOSMED", status: "active" },
  { id: "position-administrasi", name: "ADMINISTRASI", status: "active" },
  { id: "position-customer-service", name: "CUSTOMER SERVICE", status: "active" },
  { id: "position-konten-kreator", name: "KONTEN KREATOR", status: "active" },
  { id: "position-live-host", name: "LIVE HOST", status: "active" },
  { id: "position-manajer", name: "MANAJER", status: "active" },
  { id: "position-marketplace", name: "MARKETPLACE", status: "active" },
  { id: "position-pic-project", name: "PIC PROJECT", status: "active" },
  { id: "position-web-developer", name: "WEB DEVELOPER", status: "active" },
];

const initialForm: PositionForm = {
  name: "",
  status: "active",
};

export default function AdminPositionsPage() {
  const [positions, setPositions] = useState<Position[]>(defaultPositions);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<PositionForm>(initialForm);

  useEffect(() => {
    const savedPositions = localStorage.getItem("faceattend_positions");

    if (savedPositions) {
      try {
        const parsedPositions = JSON.parse(savedPositions) as Position[];
        setPositions(
          parsedPositions.length > 0 ? parsedPositions : defaultPositions,
        );
      } catch {
        setPositions(defaultPositions);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("faceattend_positions", JSON.stringify(positions));
  }, [positions]);

  const filteredPositions = useMemo(() => {
    return positions.filter((position) =>
      position.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [positions, search]);

  function resetFilter() {
    setSearch("");
  }

  function openAddModal() {
    setEditingPositionId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(position: Position) {
    setEditingPositionId(position.id);
    setForm({
      name: position.name,
      status: position.status,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingPositionId(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim().toUpperCase();

    if (!name) {
      alert("Nama jabatan wajib diisi.");
      return;
    }

    const isDuplicate = positions.some(
      (position) =>
        position.name.toLowerCase() === name.toLowerCase() &&
        position.id !== editingPositionId,
    );

    if (isDuplicate) {
      alert("Nama jabatan sudah ada.");
      return;
    }

    if (editingPositionId) {
      setPositions((prev) =>
        prev.map((position) =>
          position.id === editingPositionId
            ? {
                ...position,
                name,
                status: form.status,
              }
            : position,
        ),
      );
    } else {
      setPositions((prev) => [
        ...prev,
        {
          id: `position-${Date.now()}`,
          name,
          status: form.status,
        },
      ]);
    }

    closeModal();
  }

  function toggleStatus(id: string) {
    setPositions((prev) =>
      prev.map((position) =>
        position.id === id
          ? {
              ...position,
              status: position.status === "active" ? "inactive" : "active",
            }
          : position,
      ),
    );
  }

  function deletePosition(id: string) {
    const confirmed = confirm("Yakin ingin menghapus jabatan ini?");

    if (!confirmed) return;

    setPositions((prev) => prev.filter((position) => position.id !== id));
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Daftar Jabatan"
        subtitle="Kelola master data jabatan karyawan"
        variant="admin"
      />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="rounded-[2rem] border border-blue-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Presensi Admin Panel
              </p>

              <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-950">
                Daftar Jabatan
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Beranda / Manajemen Jabatan / Daftar Jabatan
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={3} />
              Tambah Jabatan
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:max-w-md">
              <label className="mb-2 block text-xs font-black text-slate-500">
                Nama Jabatan
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nama Jabatan..."
                  className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-blue-100 bg-white text-[#123c8c] shadow-sm transition active:scale-[0.96]"
              title="Reset Filter"
            >
              <RefreshCw size={20} strokeWidth={2.6} />
            </button>
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.25fr_1.8fr_0.8fr_0.7fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>#</p>
              <p>Nama Jabatan</p>
              <p>Status</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50 bg-white">
              {filteredPositions.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Data jabatan tidak ditemukan.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba ubah kata kunci pencarian.
                  </p>
                </div>
              ) : (
                filteredPositions.map((position, index) => (
                  <div
                    key={position.id}
                    className="grid gap-4 px-5 py-5 text-sm transition hover:bg-[#f8fbff] md:grid-cols-[0.25fr_1.8fr_0.8fr_0.7fr] md:items-center"
                  >
                    <p className="font-black text-slate-500">{index + 1}</p>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] md:hidden">
                        <UserRoundCog size={18} strokeWidth={2.7} />
                      </div>

                      <p className="font-black text-slate-800">
                        {position.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStatus(position.id)}
                      className={`flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition ${
                        position.status === "active"
                          ? "bg-blue-50 text-[#123c8c]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-4 w-7 rounded-full p-0.5 transition ${
                          position.status === "active"
                            ? "bg-[#123c8c]"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`block h-3 w-3 rounded-full bg-white transition ${
                            position.status === "active"
                              ? "translate-x-3"
                              : "translate-x-0"
                          }`}
                        />
                      </span>
                      {position.status === "active" ? "Aktif" : "Nonaktif"}
                    </button>

                    <div className="flex gap-2 md:justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(position)}
                        className="hidden items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-xs font-black text-[#123c8c] transition hover:bg-[#eaf1ff] md:inline-flex"
                      >
                        <Edit size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePosition(position.id)}
                        className="hidden items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100 md:inline-flex"
                      >
                        <Trash2 size={14} />
                        Hapus
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(position)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 md:hidden"
                      >
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  {editingPositionId ? "Edit Jabatan" : "Tambah Jabatan"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {editingPositionId
                    ? "Edit Data Jabatan"
                    : "Tambah Jabatan Baru"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Isi nama jabatan dan status jabatan.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition active:scale-[0.96]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Nama Jabatan
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Contoh: WEB DEVELOPER"
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as "active" | "inactive",
                    }))
                  }
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
                >
                  {editingPositionId ? "Update Jabatan" : "Simpan Jabatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav variant="admin" />
    </MobileShell>
  );
}