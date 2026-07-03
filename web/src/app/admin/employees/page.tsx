"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Edit,
  KeyRound,
  Camera,
  CameraOff,
  CreditCard,
  Mail,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Employee = {
  id: string;
  employee_code: string | null;
  name: string;
  email: string;
  role: "admin" | "employee";
  department: string | null;
  position: string | null;
  phone: string | null;
  profile_photo_url?: string | null;
  payroll_methods?: PayrollMethodForm[];
  payroll_status?: "paid" | "unpaid";
  status: "active" | "inactive";
  created_at: string;
};

type PayrollMethodForm = {
  bankName: string;
  cardType: string;
  accountNumber: string;
  accountHolderName: string;
  expiryMonth: string;
  expiryYear: string;
};

type EmployeeForm = {
  name: string;
  email: string;
  department: string;
  position: string;
  temporaryPassword: string;
  status: "active" | "inactive";
  profilePhotoUrl: string;
  payrollMethods: PayrollMethodForm[];
};

function createEmptyPayrollMethod(): PayrollMethodForm {
  return {
    bankName: "",
    cardType: "Debit",
    accountNumber: "",
    accountHolderName: "",
    expiryMonth: "",
    expiryYear: "",
  };
}

const initialForm: EmployeeForm = {
  name: "",
  email: "",
  department: "",
  position: "",
  temporaryPassword: "",
  status: "active",
  profilePhotoUrl: "",
  payrollMethods: [createEmptyPayrollMethod()],
};

function getInitialName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatStatus(status: "active" | "inactive") {
  return status === "active" ? "Active" : "Inactive";
}

export default function AdminEmployeesPage() {
  const [sessionRole, setSessionRole] = useState<string>("admin");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(initialForm);

  const [filterCategory, setFilterCategory] = useState<
    "all" | "magang" | "tetap"
  >("all");
  const [filterName, setFilterName] = useState("");
  const [filterPosition, setFilterPosition] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [filterPhone, setFilterPhone] = useState("");

  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("user");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const canEditData = canEditAdminData(sessionRole);
  const canDeleteData = canDeleteAdminData(sessionRole);

  async function loadEmployees() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        alert(result.message || "Gagal mengambil data karyawan.");
        return;
      }

      setEmployees(result.data || []);
      setUnits(result.units || []);
      setDepartments(result.departments || []);
      setPositions(result.positions || []);
      setShifts(result.shifts || []);
    } catch (error) {
      console.error("LOAD_EMPLOYEES_ERROR:", error);
      alert("Terjadi kesalahan saat mengambil data karyawan.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const text = `
        ${employee.name}
        ${employee.email}
        ${employee.department || ""}
        ${employee.position || ""}
        ${employee.status}
      `.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [
    employees,
    filterCategory,
    filterDivision,
    filterName,
    filterPhone,
    filterPosition,
  ]);

  const activeEmployees = employees.filter(
    (employee) => employee.status === "active",
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status === "inactive"
  ).length;

  const paidEmployees = employees.filter(
    (employee) => employee.payroll_status === "paid",
  ).length;

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
  }

  async function startCamera() {
    try {
      setCameraError("");
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraOn(true);
    } catch {
      setCameraError("Kamera tidak dapat diakses. Periksa izin browser.");
      setIsCameraOn(false);
    }
  }

  async function toggleCamera() {
    if (isCameraOn) {
      stopCamera();
      return;
    }

    await startCamera();
  }

  async function switchCamera() {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));

    if (isCameraOn) {
      await startCamera();
    }
  }

  function captureFromCamera() {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setForm((prev) => ({
      ...prev,
      profilePhotoUrl: dataUrl,
    }));

    stopCamera();
  }

  function retakePhoto() {
    setForm((prev) => ({
      ...prev,
      profilePhotoUrl: "",
    }));
  }

  function handleProfilePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        profilePhotoUrl: String(reader.result || ""),
      }));
      stopCamera();
    };
    reader.readAsDataURL(file);
  }

  function openRegisterModal() {
    setForm(initialForm);
    setEditingEmployeeId(null);
    setCameraError("");
    setIsModalOpen(true);
  }

  function closeRegisterModal() {
    stopCamera();
    setIsModalOpen(false);
    setForm(initialForm);
  }

  async function handleDeleteEmployee(employee: Employee) {
    if (!canDeleteData) {
      alert("Hanya owner yang dapat menghapus akun.");
      return;
    }

    const shouldDelete = window.confirm(
      `Hapus karyawan ${employee.name}? Aksi ini tidak bisa dibatalkan.`,
    );

    if (!shouldDelete) return;

    try {
      setDeletingEmployeeId(employee.id);

      const response = await fetch("/api/employees", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: employee.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Gagal menghapus karyawan.");
        return;
      }

      alert("Karyawan berhasil dihapus.");
      await loadEmployees();
    } catch {
      alert("Terjadi kesalahan saat menghapus karyawan.");
    } finally {
      setDeletingEmployeeId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isEditing = Boolean(editingEmployee);

    if (
      !form.name ||
      !form.email ||
      !form.department ||
      !form.position ||
      !form.temporaryPassword
    ) {
      alert("Semua field wajib diisi.");
      return;
    }

    if (form.temporaryPassword.length < 8) {
      alert("Temporary password minimal 8 karakter.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          temporaryPassword: form.temporaryPassword,
          department: form.department,
          position: form.position,
          status: form.status,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        alert(result.message || "Gagal menambahkan karyawan.");
        return;
      }

      alert("Employee berhasil dibuat.");

      closeRegisterModal();
      await loadEmployees();
    } catch (error) {
      console.error("SAVE_EMPLOYEE_ERROR:", error);
      alert("Terjadi kesalahan saat menyimpan karyawan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEmployee(employee: Employee) {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus employee "${employee.name}"? Data yang dihapus tidak bisa dikembalikan.`,
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(employee.id);

      const response = await fetch(`/api/employees?id=${employee.id}`, {
        method: "DELETE",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        alert(result.message || "Gagal menghapus employee.");
        return;
      }

      alert("Employee berhasil dihapus.");
      await loadEmployees();
    } catch (error) {
      console.error("DELETE_EMPLOYEE_ERROR:", error);
      alert("Terjadi kesalahan saat menghapus employee.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Employees"
        subtitle="Kelola data karyawan, foto wajah, dan status payroll"
        variant="admin"
      />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-6 text-white shadow-2xl shadow-blue-900/25 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                <ShieldCheck size={15} />
                Employee Management
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                Data Karyawan
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                Admin dapat menambahkan akun karyawan untuk login ke sistem
                absensi. Register wajah akan dibuat pada tahap berikutnya.
              </p>
            </div>

            <button
              type="button"
              onClick={openRegisterModal}
              disabled={!canEditData}
              className="group inline-flex w-full items-center justify-center gap-4 rounded-[1.8rem] bg-white px-6 py-5 text-[#123c8c] shadow-2xl shadow-blue-950/20 ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-blue-950/30 active:scale-[0.97] md:w-auto"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-[#eaf1ff] transition-all duration-300 group-hover:rotate-90 group-hover:bg-[#123c8c] group-hover:text-white">
                <Plus size={27} strokeWidth={3} />
              </span>

              <span className="text-left">
                <span className="block text-xl font-black leading-none tracking-tight">
                  Tambah Karyawan
                </span>
                <span className="mt-2 block text-sm font-bold text-slate-400">
                  Kelola wajah dan status payroll
                </span>
              </span>
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          <div className="rounded-[1.7rem] border border-blue-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Total Employee
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {employees.length}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                <UsersRound size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-emerald-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Active Account
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {activeEmployees}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BadgeCheck size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-amber-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">Total Magang</p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {internEmployees}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <UserRound size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-cyan-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">Sudah Digaji</p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {paidEmployees}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                <BadgeCheck size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Employee List
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Filter data berdasarkan tipe karyawan, nama, jabatan, divisi,
                dan nomor telepon.
              </p>
            </div>

            <div className="relative w-full md:w-[330px]">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Search employee..."
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-blue-100">
            <div className="hidden grid-cols-[1fr_1.2fr_1fr_1fr_0.7fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>Employee</p>
              <p>Email</p>
              <p>Department</p>
              <p>Position</p>
              <p>Status</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50">
              {isLoading && (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Loading employee data...
                  </p>
                </div>
              )}

              {!isLoading &&
                filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="grid gap-4 px-5 py-5 transition hover:bg-[#f8fbff] md:grid-cols-[1fr_1.2fr_1fr_1fr_0.7fr] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      {employee.profile_photo_url ? (
                        <img
                          src={employee.profile_photo_url}
                          alt={`Foto ${employee.name}`}
                          className="h-12 w-12 rounded-2xl border border-blue-100 object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-sm font-black text-[#123c8c]">
                          {getInitialName(employee.name)}
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {employee.name}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          Employee Account
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {employee.position || "-"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {employee.department || "-"} •{" "}
                        {getAdminRoleLabel(employee.role)}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-slate-600">
                      {employee.department || "-"}
                    </p>

                    <p className="text-sm font-semibold text-slate-600">
                      {employee.position || "-"}
                    </p>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          employee.status === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {formatStatus(employee.status)}
                      </span>

                      <button
                        type="button"
                        onClick={() => openEditModal(employee)}
                        disabled={!canEditData}
                        aria-label={`Edit ${employee.name}`}
                        title="Edit"
                        className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-[#f6f8ff] text-[#123c8c] disabled:opacity-50"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(employee)}
                        disabled={
                          deletingEmployeeId === employee.id || !canDeleteData
                        }
                        aria-label={`Hapus ${employee.name}`}
                        title="Hapus"
                        className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid gap-2 md:flex md:justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(employee)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 text-xs font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.97] md:h-auto md:rounded-xl md:border md:border-blue-100 md:bg-white md:py-2 md:text-[#123c8c] md:shadow-none md:hover:bg-[#eaf1ff]"
                      >
                        <Edit size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(employee)}
                        disabled={deletingId === employee.id}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-xs font-black text-red-600 transition hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:h-auto md:rounded-xl md:py-2"
                      >
                        <Trash2 size={15} />
                        {deletingId === employee.id ? "..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                ))}

              {!isLoading && filteredEmployees.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Data tidak ditemukan
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Ubah kombinasi filter untuk melihat data.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  <Plus size={15} strokeWidth={3} />
                  Register Employee
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  Tambah Karyawan Baru
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Untuk sekarang hanya membuat akun karyawan. Register wajah
                  akan ditambahkan nanti.
                </p>
              </div>

              <button
                type="button"
                onClick={closeRegisterModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                  <p className="text-sm font-black text-[#123c8c]">
                    Foto Wajah
                  </p>

                  <div className="mt-3 overflow-hidden rounded-2xl border border-blue-100 bg-black/90">
                    {form.profilePhotoUrl ? (
                      <img
                        src={form.profilePhotoUrl}
                        alt="Foto wajah"
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="h-48 w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={toggleCamera}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#123c8c]"
                    >
                      {isCameraOn ? (
                        <CameraOff size={14} />
                      ) : (
                        <Camera size={14} />
                      )}
                      {isCameraOn ? "Off Cam" : "On Cam"}
                    </button>

                    <button
                      type="button"
                      onClick={switchCamera}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#123c8c]"
                    >
                      <RefreshCw size={14} />
                      Switch Cam
                    </button>

                    <button
                      type="button"
                      onClick={captureFromCamera}
                      disabled={!isCameraOn}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#123c8c] disabled:opacity-40"
                    >
                      <Camera size={14} />
                      Capture
                    </button>

                    <button
                      type="button"
                      onClick={retakePhoto}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#123c8c]"
                    >
                      <RefreshCw size={14} />
                      Retake
                    </button>
                  </div>

                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#123c8c]">
                    <Plus size={14} />
                    Upload Manual
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      className="hidden"
                    />
                  </label>

                  {cameraError && (
                    <p className="mt-2 text-xs font-bold text-rose-600">
                      {cameraError}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Nama
                    </label>
                    <div className="relative">
                      <UserRound
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={form.name}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Nama karyawan"
                        className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        placeholder="employee@creativemu.com"
                        className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                      />
                    </div>
                  </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Department
                  </label>
                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={form.department}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          department: event.target.value,
                        }))
                      }
                      placeholder="IT Department"
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Position
                  </label>
                  <div className="relative">
                    <BriefcaseBusiness
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={form.position}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          position: event.target.value,
                        }))
                      }
                      placeholder="Backend Intern"
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Temporary Password
                  </label>
                  <div className="relative">
                    <KeyRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="password"
                      value={form.temporaryPassword}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          temporaryPassword: event.target.value,
                        }))
                      }
                      placeholder="Minimal 8 karakter"
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    />
                  </div>
                </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Tipe Karyawan
                    </label>
                    <select
                      value={form.employeeCategory}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          employeeCategory: event.target.value as
                            | "magang"
                            | "tetap",
                        }))
                      }
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    >
                      <option value="magang">Magang</option>
                      <option value="tetap">Karyawan Tetap</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Role Akun
                    </label>
                    <select
                      value={form.role}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          role: event.target.value as EmployeeForm["role"],
                        }))
                      }
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    >
                      <option value="employee">Employee</option>
                      <option value="cs">Customer Service (CS)</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Status Payroll
                    </label>
                    <select
                      value={form.payrollStatus}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          payrollStatus: event.target.value as
                            | "paid"
                            | "unpaid",
                        }))
                      }
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    >
                      <option value="unpaid">Belum Digaji</option>
                      <option value="paid">Sudah Digaji</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Status Akun
                    </label>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          status: event.target.value as "active" | "inactive",
                        }))
                      }
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

              <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                <p className="text-sm font-black text-[#123c8c]">
                  Catatan sementara
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Temporary password digunakan untuk login karyawan. Password
                  akan disimpan ke MySQL dalam bentuk{" "}
                  <span className="font-black text-slate-700">
                    password_hash
                  </span>
                  , bukan password asli.
                </p>
              </div>

              <div className="mt-2 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closeRegisterModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save Employee"}
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
