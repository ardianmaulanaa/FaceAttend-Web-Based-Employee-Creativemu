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
  Camera,
  CameraOff,
  CreditCard,
  Mail,
  Pencil,
  Phone,
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
  name: string;
  email: string;
  role: "admin" | "employee";
  employee_category?: "magang" | "tetap";
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
  phone: string;
  employeeCategory: "magang" | "tetap";
  payrollStatus: "paid" | "unpaid";
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
  phone: "",
  employeeCategory: "tetap",
  payrollStatus: "unpaid",
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

function formatEmployeeCategory(value?: "magang" | "tetap") {
  return value === "magang" ? "Magang" : "Karyawan Tetap";
}

function formatPayrollStatus(value?: "paid" | "unpaid") {
  return value === "paid" ? "Sudah Digaji" : "Belum Digaji";
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(
    null,
  );
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null,
  );
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

  async function loadEmployees() {
    try {
      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Gagal mengambil data karyawan.");
        return;
      }

      setEmployees(result.data || []);
    } catch {
      alert("Terjadi kesalahan saat mengambil data karyawan.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadEmployees();
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const category = employee.employee_category || "tetap";

      if (filterCategory !== "all" && category !== filterCategory) {
        return false;
      }

      if (
        filterName &&
        !employee.name.toLowerCase().includes(filterName.toLowerCase())
      ) {
        return false;
      }

      if (
        filterPosition &&
        !(employee.position || "")
          .toLowerCase()
          .includes(filterPosition.toLowerCase())
      ) {
        return false;
      }

      if (
        filterDivision &&
        !(employee.department || "")
          .toLowerCase()
          .includes(filterDivision.toLowerCase())
      ) {
        return false;
      }

      if (
        filterPhone &&
        !(employee.phone || "")
          .toLowerCase()
          .includes(filterPhone.toLowerCase())
      ) {
        return false;
      }

      return true;
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

  const internEmployees = employees.filter(
    (employee) => employee.employee_category === "magang",
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
    stopCamera();
    setForm(initialForm);
    setEditingEmployeeId(null);
    setCameraError("");
    setIsModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    stopCamera();
    const methods =
      employee.payroll_methods && employee.payroll_methods.length > 0
        ? employee.payroll_methods.map((method) => ({
            bankName: method.bankName || "",
            cardType: method.cardType || "Debit",
            accountNumber: method.accountNumber || "",
            accountHolderName: method.accountHolderName || "",
            expiryMonth: method.expiryMonth || "",
            expiryYear: method.expiryYear || "",
          }))
        : [createEmptyPayrollMethod()];

    setForm({
      name: employee.name,
      email: employee.email,
      department: employee.department || "",
      position: employee.position || "",
      phone: employee.phone || "",
      employeeCategory: employee.employee_category || "tetap",
      payrollStatus: employee.payroll_status || "unpaid",
      status: employee.status,
      profilePhotoUrl: employee.profile_photo_url || "",
      payrollMethods: methods,
    });
    setEditingEmployeeId(employee.id);
    setCameraError("");
    setIsModalOpen(true);
  }

  function addPayrollMethod() {
    setForm((prev) => ({
      ...prev,
      payrollMethods: [...prev.payrollMethods, createEmptyPayrollMethod()],
    }));
  }

  function removePayrollMethod(index: number) {
    setForm((prev) => {
      const nextMethods = prev.payrollMethods.filter((_, idx) => idx !== index);

      return {
        ...prev,
        payrollMethods:
          nextMethods.length > 0 ? nextMethods : [createEmptyPayrollMethod()],
      };
    });
  }

  function updatePayrollMethod(
    index: number,
    field: keyof PayrollMethodForm,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      payrollMethods: prev.payrollMethods.map((method, idx) =>
        idx === index ? { ...method, [field]: value } : method,
      ),
    }));
  }

  function closeRegisterModal() {
    stopCamera();
    setIsModalOpen(false);
    setEditingEmployeeId(null);
    setCameraError("");
    setForm(initialForm);
  }

  async function handleDeleteEmployee(employee: Employee) {
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

    if (!form.name || !form.email || !form.department || !form.position) {
      alert("Nama, email, jabatan, dan divisi wajib diisi.");
      return;
    }

    const payrollMethods = form.payrollMethods
      .map((method) => ({
        bankName: method.bankName.trim(),
        cardType: method.cardType.trim() || "Debit",
        accountNumber: method.accountNumber.trim(),
        accountHolderName: method.accountHolderName.trim(),
        expiryMonth: method.expiryMonth.trim(),
        expiryYear: method.expiryYear.trim(),
      }))
      .filter(
        (method) =>
          method.bankName ||
          method.accountNumber ||
          method.accountHolderName ||
          method.expiryMonth ||
          method.expiryYear,
      );

    const hasInvalidPayrollMethod = payrollMethods.some(
      (method) =>
        !method.bankName || !method.accountNumber || !method.accountHolderName,
    );

    if (hasInvalidPayrollMethod) {
      alert(
        "Lengkapi data rekening: Nama bank, nomor rekening, dan nama pemilik wajib diisi.",
      );
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/employees", {
        method: editingEmployeeId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingEmployeeId,
          name: form.name,
          email: form.email,
          department: form.department,
          position: form.position,
          phone: form.phone,
          role: "employee",
          employeeCategory: form.employeeCategory,
          profilePhotoUrl: form.profilePhotoUrl,
          payrollStatus: form.payrollStatus,
          payrollMethods,
          status: form.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Gagal menyimpan karyawan.");
        return;
      }

      alert(
        editingEmployeeId
          ? "Employee berhasil diperbarui."
          : "Employee berhasil dibuat.",
      );

      closeRegisterModal();
      await loadEmployees();
    } catch {
      alert("Terjadi kesalahan saat menyimpan karyawan.");
    } finally {
      setIsSaving(false);
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
                Foto wajah ditampilkan supaya list tidak kosong, payroll hanya
                menampilkan status digaji tanpa detail rekening.
              </p>
            </div>

            <button
              onClick={openRegisterModal}
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

            <div className="grid gap-3 md:grid-cols-5">
              <select
                value={filterCategory}
                onChange={(event) =>
                  setFilterCategory(
                    event.target.value as "all" | "magang" | "tetap",
                  )
                }
                className="rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
              >
                <option value="all">Semua Tipe</option>
                <option value="magang">Magang</option>
                <option value="tetap">Karyawan Tetap</option>
              </select>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={filterName}
                  onChange={(event) => setFilterName(event.target.value)}
                  placeholder="Nama"
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-9 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <input
                value={filterPosition}
                onChange={(event) => setFilterPosition(event.target.value)}
                placeholder="Jabatan"
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
              />

              <input
                value={filterDivision}
                onChange={(event) => setFilterDivision(event.target.value)}
                placeholder="Divisi"
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
              />

              <input
                value={filterPhone}
                onChange={(event) => setFilterPhone(event.target.value)}
                placeholder="Nomor Telepon"
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-blue-100">
            <div className="hidden grid-cols-[1.2fr_1fr_0.95fr_0.8fr_0.9fr_0.9fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>Foto / Nama</p>
              <p>Jabatan - Divisi</p>
              <p>No Telepon</p>
              <p>Tipe Karyawan</p>
              <p>Payroll</p>
              <p>Status</p>
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
                    className="grid gap-4 px-5 py-5 transition hover:bg-[#f8fbff] md:grid-cols-[1.2fr_1fr_0.95fr_0.8fr_0.9fr_0.9fr] md:items-center"
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
                          {employee.email}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {employee.position || "-"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {employee.department || "-"}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-slate-600">
                      {employee.phone || "-"}
                    </p>

                    <p className="text-sm font-semibold text-slate-600">
                      {formatEmployeeCategory(employee.employee_category)}
                    </p>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${
                        employee.payroll_status === "paid"
                          ? "bg-cyan-50 text-cyan-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {formatPayrollStatus(employee.payroll_status)}
                    </span>

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
                        aria-label={`Edit ${employee.name}`}
                        title="Edit"
                        className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-100 bg-[#f6f8ff] text-[#123c8c]"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(employee)}
                        disabled={deletingEmployeeId === employee.id}
                        aria-label={`Hapus ${employee.name}`}
                        title="Hapus"
                        className="mt-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50 text-rose-700 disabled:opacity-50"
                      >
                        <Trash2 size={14} />
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
                  {editingEmployeeId ? "Edit Employee" : "Register Employee"}
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  {editingEmployeeId ? "Edit Karyawan" : "Tambah Karyawan Baru"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Aktifkan kamera untuk foto wajah, gunakan switch camera,
                  on/off camera, retake bila perlu, lalu lengkapi data rekening.
                </p>
              </div>

              <button
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

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Divisi
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
                        placeholder="Digital Marketing"
                        className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Jabatan
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
                        placeholder="Web Developer"
                        className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Nomor Telepon
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={form.phone}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        placeholder="08xxxxxxxxxx"
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

                  <div className="md:col-span-2">
                    <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="inline-flex items-center gap-2 text-sm font-black text-[#123c8c]">
                            <CreditCard size={16} />
                            Data Rekening
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            Isi seperti kartu bank pada umumnya. Bisa tambah,
                            edit, atau hapus kartu.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={addPayrollMethod}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-black text-[#123c8c]"
                        >
                          <Plus size={14} />
                          Tambah Kartu
                        </button>
                      </div>

                      <div className="mt-3 space-y-3">
                        {form.payrollMethods.map((method, index) => (
                          <div
                            key={`payroll-method-${index}`}
                            className="rounded-2xl border border-blue-100 bg-white p-3"
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                                Kartu {index + 1}
                              </p>

                              <button
                                type="button"
                                onClick={() => removePayrollMethod(index)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 text-[11px] font-black text-rose-600"
                              >
                                <Trash2 size={12} />
                                Hapus
                              </button>
                            </div>

                            <div className="mt-2 grid gap-2 md:grid-cols-2">
                              <input
                                value={method.bankName}
                                onChange={(event) =>
                                  updatePayrollMethod(
                                    index,
                                    "bankName",
                                    event.target.value,
                                  )
                                }
                                placeholder="Nama Bank (BCA, BNI, Mandiri)"
                                className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                              />

                              <select
                                value={method.cardType}
                                onChange={(event) =>
                                  updatePayrollMethod(
                                    index,
                                    "cardType",
                                    event.target.value,
                                  )
                                }
                                className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                              >
                                <option value="Debit">Debit</option>
                                <option value="Visa">Visa</option>
                                <option value="Mastercard">Mastercard</option>
                                <option value="GPN">GPN</option>
                              </select>

                              <input
                                value={method.accountNumber}
                                onChange={(event) =>
                                  updatePayrollMethod(
                                    index,
                                    "accountNumber",
                                    event.target.value,
                                  )
                                }
                                placeholder="Nomor Rekening"
                                inputMode="numeric"
                                className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                              />

                              <input
                                value={method.accountHolderName}
                                onChange={(event) =>
                                  updatePayrollMethod(
                                    index,
                                    "accountHolderName",
                                    event.target.value,
                                  )
                                }
                                placeholder="Nama Pemilik Rekening"
                                className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                              />

                              <input
                                value={method.expiryMonth}
                                onChange={(event) =>
                                  updatePayrollMethod(
                                    index,
                                    "expiryMonth",
                                    event.target.value,
                                  )
                                }
                                placeholder="Bulan Exp (MM)"
                                maxLength={2}
                                inputMode="numeric"
                                className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                              />

                              <input
                                value={method.expiryYear}
                                onChange={(event) =>
                                  updatePayrollMethod(
                                    index,
                                    "expiryYear",
                                    event.target.value,
                                  )
                                }
                                placeholder="Tahun Exp (YY)"
                                maxLength={2}
                                inputMode="numeric"
                                className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
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
                  {isSaving
                    ? "Saving..."
                    : editingEmployeeId
                      ? "Update Employee"
                      : "Save Employee"}
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
