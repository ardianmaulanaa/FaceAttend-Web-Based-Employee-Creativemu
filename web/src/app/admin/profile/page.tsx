"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import {
  Building2,
  Globe,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Trash2,
  User,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import BottomNav from "@/components/BottomNav";

type AdminProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  profile_photo: string | null;
  role: string;
};

type CompanyOffice = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

const DEFAULT_AVATAR = "/images/creativemu-logo/creativemu.png";

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<"user" | "company" | "password">("user");
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [office, setOffice] = useState<CompanyOffice | null>(null);
  
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [maxEmployeesLimit] = useState(50); // Demo limit

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState({ name: "", email: "", phone: "" });
  const [companyForm, setCompanyForm] = useState({ name: "", address: "", latitude: 0, longitude: 0, radius_meters: 100 });
  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false);

  async function loadData() {
    try {
      setIsLoading(true);
      // 1. Load Admin Data
      const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
      const meData = await meResponse.json();
      if (meData.success && meData.user) {
        setAdmin(meData.user);
        setUserForm({
          name: meData.user.name || "",
          email: meData.user.email || "",
          phone: meData.user.phone || "",
        });
      }

      // 2. Load Employees count
      const empResponse = await fetch("/api/employees", { cache: "no-store" });
      const empData = await empResponse.json();
      if (empData.success && empData.employees) {
        setTotalEmployees(empData.employees.length);
        
        // Find first office as company profile
        if (empData.officeLocations && empData.officeLocations.length > 0) {
          const mainOffice = empData.officeLocations[0];
          setOffice(mainOffice);
          setCompanyForm({
            name: mainOffice.name || "",
            address: mainOffice.address || "",
            latitude: Number(mainOffice.latitude) || 0,
            longitude: Number(mainOffice.longitude) || 0,
            radius_meters: Number(mainOffice.radius_meters) || 100,
          });
        }
      }
    } catch (error) {
      console.error("LOAD_PROFILE_ERROR:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  // Update Profile User
  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!userForm.name.trim() || !userForm.email.trim()) {
      alert("Nama dan email wajib diisi.");
      return;
    }

    if (userForm.name.trim().split(/\s+/).filter(Boolean).length < 2) {
      alert("Nama lengkap harus terdiri dari minimal 2 kata.");
      return;
    }

    if (userForm.phone && (userForm.phone.length < 10 || userForm.phone.length > 13 || !/^\d+$/.test(userForm.phone))) {
      alert("Nomor telepon harus berupa angka 10-13 digit tanpa spasi atau simbol.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Gagal memperbarui profil.");
        return;
      }

      setAdmin(result.user);
      setIsEditUserOpen(false);
      alert("Profil admin berhasil diperbarui.");
    } catch {
      alert("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  }

  // Update Profile Perusahaan
  async function handleUpdateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyForm.name.trim() || !companyForm.address.trim()) {
      alert("Nama perusahaan dan alamat wajib diisi.");
      return;
    }

    if (!office?.id) {
      alert("Gagal mengidentifikasi kantor perusahaan.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/admin/offices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: office.id,
          name: companyForm.name,
          address: companyForm.address,
          latitude: companyForm.latitude,
          longitude: companyForm.longitude,
          radius_meters: companyForm.radius_meters,
          status: "active",
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Gagal memperbarui profil perusahaan.");
        return;
      }

      setOffice(result.office || { ...office, ...companyForm });
      setIsEditCompanyOpen(false);
      alert("Profil perusahaan berhasil diperbarui.");
    } catch {
      alert("Terjadi kesalahan saat menyimpan profil perusahaan.");
    } finally {
      setIsSaving(false);
    }
  }

  // Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordForm.current || !passwordForm.new || !passwordForm.confirm) {
      alert("Semua field wajib diisi.");
      return;
    }

    if (passwordForm.new.length < 8) {
      alert("Kata sandi baru minimal harus 8 karakter.");
      return;
    }

    if (passwordForm.new !== passwordForm.confirm) {
      alert("Konfirmasi kata sandi baru tidak cocok.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/profile/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: passwordForm.current,
          new_password: passwordForm.new,
          confirm_password: passwordForm.confirm,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Gagal memperbarui kata sandi.");
        return;
      }

      setPasswordForm({ current: "", new: "", confirm: "" });
      alert("Kata sandi berhasil diperbarui.");
    } catch {
      alert("Terjadi kesalahan saat mengganti kata sandi.");
    } finally {
      setIsSaving(false);
    }
  }

  // Reset Data Perusahaan (Demo Simulation)
  async function handleResetCompanyData() {
    const confirm = window.customConfirm
      ? await window.customConfirm("Apakah Anda yakin ingin mereset seluruh data absensi dan aktivitas perusahaan? Tindakan ini tidak bisa dibatalkan.")
      : window.confirm("Apakah Anda yakin ingin mereset seluruh data absensi dan aktivitas perusahaan? Tindakan ini tidak bisa dibatalkan.");
    if (!confirm) return;

    try {
      setIsSaving(true);
      // Simulate clear logs
      alert("Proses pembersihan data perusahaan berhasil disimulasikan.");
    } finally {
      setIsSaving(false);
    }
  }

  const avatarSrc = admin?.profile_photo || DEFAULT_AVATAR;
  const percentage = Math.min(Math.round((totalEmployees / maxEmployeesLimit) * 100), 100);

  return (
    <MobileShell variant="admin">
      <main className="min-h-screen bg-[#f8fbff] dark:bg-[#0d1117] pb-24 transition-colors">
        <AppHeader
          title="Profil Admin / Owner"
          variant="admin"
        />

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="animate-spin text-[#123c8c] dark:text-blue-400" size={36} />
          </div>
        ) : (
          <section className="mx-auto mt-6 max-w-5xl px-5 md:px-10">
            <div className="flex flex-col gap-6">
              
              {/* TOP CARD: Avatar & Company Status Centered */}
              <div className="rounded-[2rem] border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex flex-col md:flex-row items-center text-center md:text-left gap-4">
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.8rem] border-4 border-blue-50 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-md">
                      <Image
                        src={avatarSrc}
                        alt="Foto profil admin"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    </div>

                    <div>
                      <h2 className="text-xl font-black text-slate-950 dark:text-white">{admin?.name}</h2>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{admin?.email}</p>
                      
                      <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3.5 py-1 text-xs font-bold text-[#123c8c] dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                        Role: {admin?.role || "Admin"}
                      </span>
                    </div>
                  </div>

                  <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Status Perusahaan
                    </h3>

                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>Karyawan Terdaftar</span>
                        <span>
                          {totalEmployees} / {maxEmployeesLimit} ({percentage}%)
                        </span>
                      </div>

                      <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 p-0.5">
                        <div
                          className="h-full rounded-full bg-[#123c8c] dark:bg-blue-500 transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM CARD: Tabs & Detail Forms */}
              <div className="rounded-[2rem] border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab("user")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      activeTab === "user"
                        ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20 dark:bg-blue-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <User size={15} />
                    Profil Pengguna
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("company")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      activeTab === "company"
                        ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20 dark:bg-blue-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <Building2 size={15} />
                    Profil Perusahaan
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("password")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      activeTab === "password"
                        ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20 dark:bg-blue-600"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <KeyRound size={15} />
                    Ubah Password
                  </button>
                </div>

                {/* TAB CONTENT: PROFILE USER */}
                {activeTab === "user" && (
                  <div className="mt-6 space-y-6">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditUserOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition active:scale-[0.98] shadow-sm"
                      >
                        <Pencil size={14} />
                        Edit Profil
                      </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Lengkap</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{admin?.name || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email Utama</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{admin?.email || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No. Telepon / WhatsApp</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{admin?.phone || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Zona Waktu</p>
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <Globe size={16} className="text-[#123c8c] dark:text-blue-400" />
                          <span>WIB (Asia/Jakarta)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: PROFILE PERUSAHAAN */}
                {activeTab === "company" && (
                  <div className="mt-6 space-y-6">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setIsEditCompanyOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition active:scale-[0.98] shadow-sm"
                      >
                        <Pencil size={14} />
                        Edit Kantor
                      </button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Nama Kantor</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{office?.name || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Radius Absensi</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{office?.radius_meters || 100} Meter</p>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Alamat Perusahaan</p>
                        <div className="flex items-start gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                          <MapPin size={16} className="mt-0.5 shrink-0 text-[#123c8c] dark:text-blue-400" />
                          <span>{office?.address || "-"}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Latitude</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{office?.latitude || "-"}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Longitude</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{office?.longitude || "-"}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB CONTENT: RESET PASSWORD */}
                {activeTab === "password" && (
                  <form onSubmit={handleResetPassword} className="mt-6 space-y-4 max-w-md">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Kata Sandi Lama</label>
                      <input
                        type="password"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        className="mt-1 h-11 w-full rounded-2xl border border-blue-100 dark:border-slate-800 bg-[#f7f9ff] dark:bg-[#0d1117] px-4 text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-[#123c8c] dark:focus:border-blue-500"
                        placeholder="Masukkan kata sandi lama"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={passwordForm.new}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                        className="mt-1 h-11 w-full rounded-2xl border border-blue-100 dark:border-slate-800 bg-[#f7f9ff] dark:bg-[#0d1117] px-4 text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-[#123c8c] dark:focus:border-blue-500"
                        placeholder="Minimal 8 karakter"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Konfirmasi Kata Sandi Baru</label>
                      <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="mt-1 h-11 w-full rounded-2xl border border-blue-100 dark:border-slate-800 bg-[#f7f9ff] dark:bg-[#0d1117] px-4 text-sm font-normal text-slate-900 dark:text-white outline-none focus:border-[#123c8c] dark:focus:border-blue-500"
                        placeholder="Ulangi kata sandi baru"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#123c8c] dark:bg-blue-600 py-3 text-sm font-bold text-white hover:bg-[#0f3274] dark:hover:bg-blue-700 transition active:scale-[0.98] shadow-md shadow-blue-900/20"
                    >
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : "Simpan Password Baru"}
                    </button>
                  </form>
                )}

              </div>
            </div>
          </section>
        )}

        {/* MODAL EDIT USER */}
        {isEditUserOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[2.5rem] border border-blue-100 bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-900">Ubah Profil</h3>
              
              <form onSubmit={handleUpdateUser} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Nama Lengkap</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="mt-1 h-12 w-full rounded-2xl border border-blue-100 bg-[#f7f9ff] px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#123c8c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="mt-1 h-12 w-full rounded-2xl border border-blue-100 bg-[#f7f9ff] px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#123c8c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500">Telepon / WA (Maks 12 Digit)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    value={userForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 12);
                      setUserForm({ ...userForm, phone: val });
                    }}
                    placeholder="Contoh: 081234567890"
                    className="mt-1 h-11 w-full rounded-2xl border border-blue-100 bg-[#f7f9ff] px-4 text-sm font-semibold text-slate-800 outline-none focus:border-[#123c8c]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditUserOpen(false)}
                    className="w-1/2 rounded-2xl bg-slate-100 py-3.5 text-sm font-black text-slate-600 hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-1/2 rounded-2xl bg-[#123c8c] py-3.5 text-sm font-black text-white hover:bg-[#0f3274] transition"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL EDIT COMPANY OFFICE */}
        {isEditCompanyOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-[2.5rem] border border-blue-100 bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-black text-slate-900">Ubah Profil Perusahaan</h3>
              
              <form onSubmit={handleUpdateCompany} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Nama Kantor</label>
                  <input
                    type="text"
                    value={companyForm.name}
                    onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="mt-1 h-12 w-full rounded-2xl border border-blue-100 bg-[#f7f9ff] px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#123c8c]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Alamat Kantor</label>
                  <textarea
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="mt-1 h-20 w-full rounded-2xl border border-blue-100 bg-[#f7f9ff] p-4 text-sm font-bold text-slate-800 outline-none focus:border-[#123c8c] resize-none"
                  />
                </div>

                <div className="grid gap-4 grid-cols-3">
                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={companyForm.latitude}
                      onChange={(e) => setCompanyForm({ ...companyForm, latitude: Number(e.target.value) })}
                      className="mt-1 h-12 w-full rounded-2xl border border-blue-100 bg-[#f7f9ff] px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#123c8c]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={companyForm.longitude}
                      onChange={(e) => setCompanyForm({ ...companyForm, longitude: Number(e.target.value) })}
                      className="mt-1 h-12 w-full rounded-2xl border border-blue-100 bg-[#f7f9ff] px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#123c8c]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-500 uppercase">Radius (Meter)</label>
                    <input
                      type="number"
                      value={companyForm.radius_meters}
                      onChange={(e) => setCompanyForm({ ...companyForm, radius_meters: Number(e.target.value) })}
                      className="mt-1 h-12 w-full rounded-2xl border border-blue-100 bg-[#f7f9ff] px-4 text-sm font-bold text-slate-800 outline-none focus:border-[#123c8c]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditCompanyOpen(false)}
                    className="w-1/2 rounded-2xl bg-slate-100 py-3.5 text-sm font-black text-slate-600 hover:bg-slate-200 transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-1/2 rounded-2xl bg-[#123c8c] py-3.5 text-sm font-black text-white hover:bg-[#0f3274] transition"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <BottomNav variant="admin" />
      </main>
    </MobileShell>
  );
}
