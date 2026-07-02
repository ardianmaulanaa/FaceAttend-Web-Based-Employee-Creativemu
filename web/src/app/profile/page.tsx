"use client";

<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
import { useEffect, useMemo, useState } from "react";
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CreditCard,
  Gift,
  Landmark,
  Mail,
  Plus,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  BriefcaseBusiness,
  MapPin,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

type ProfileUser = {
  id: string;
  employee_code: string | null;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
  profile_photo: string | null;
  department: {
    id: string;
    name: string;
  } | null;
  position: {
    id: string;
    name: string;
  } | null;
  shift: {
    id: string;
    name: string;
    tolerance_minutes: number;
    work_schedules?: {
      day_of_week: string;
      is_work_day: boolean;
      check_in_time: string | null;
      check_out_time: string | null;
    }[];
  } | null;
  registered_office: {
    id: string;
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    radius_meters: number;
  } | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function formatRole(role: string) {
  if (role === "admin") return "Admin";
  if (role === "employee") return "Employee";
  return role;
}

function formatStatus(status: string) {
  if (status === "active") return "Active";
  if (status === "inactive") return "Inactive";
  return status;
}

export default function ProfilePage() {
<<<<<<< HEAD
  const router = useRouter();
  const { authUser, updatePaymentProfile, claimEmployeeReward } = useAppData();
  const [saveMessage, setSaveMessage] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [form, setForm] = useState({
    accountHolderName: "",
    contactEmail: "",
    phoneNumber: "",
    bankName: "",
    payoutLabel: "",
    accountNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvc: "",
    cards: [] as Array<{
      id: string;
      bankName: string;
      cardHolderName: string;
      accountNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvc: string;
    }>,
  });
  const [cardForm, setCardForm] = useState({
    bankName: "",
    cardHolderName: "",
    accountNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvc: "",
  });

  useEffect(() => {
    if (!authUser) {
      router.replace("/login");
      return;
    }

    setForm({
      accountHolderName:
        authUser.paymentProfile?.accountHolderName || authUser.name,
      contactEmail: authUser.paymentProfile?.contactEmail || authUser.email,
      phoneNumber: authUser.paymentProfile?.phoneNumber || "",
      bankName: authUser.paymentProfile?.bankName || "",
      payoutLabel: authUser.paymentProfile?.payoutLabel || "",
      accountNumber: authUser.paymentProfile?.accountNumber || "",
      expiryMonth: authUser.paymentProfile?.expiryMonth || "",
      expiryYear: authUser.paymentProfile?.expiryYear || "",
      cvc: authUser.paymentProfile?.cvc || "",
      cards: authUser.paymentProfile?.cards || [],
    });
  }, [authUser, router]);

  if (!authUser) return null;

  const claimableRewards = [
    {
      title: "Claim Kopi Pagi",
      amount: 5,
      message: "Claim hadiah kecil kopi pagi untuk karyawan aktif",
    },
    {
      title: "Claim Voucher Makan",
      amount: 8,
      message: "Claim hadiah umum voucher makan siang",
    },
    {
      title: "Claim Pulsa Kerja",
      amount: 6,
      message: "Claim pulsa kerja harian untuk kebutuhan komunikasi",
    },
    {
      title: "Claim Transport Lokal",
      amount: 7,
      message: "Claim transport lokal sebagai hadiah umum karyawan",
    },
  ];

  const handleSave = () => {
    if (!/^\d{16}$/.test(form.accountNumber.trim())) {
      setSaveMessage("No rekening utama harus 16 digit angka.");
      return;
    }

    const result = updatePaymentProfile(form);
    setSaveMessage(result.message);
  };

  const handleAddCard = () => {
    if (
      !cardForm.bankName.trim() ||
      !cardForm.cardHolderName.trim() ||
      !/^\d{16}$/.test(cardForm.accountNumber.trim())
    ) {
      setCardMessage(
        "Isi bank asal, atas nama kartu, dan no rekening 16 digit untuk tambah kartu.",
      );
      return;
    }

    const newCard = {
      id: `CARD-${Date.now()}`,
      bankName: cardForm.bankName.trim(),
      cardHolderName: cardForm.cardHolderName.trim(),
      accountNumber: cardForm.accountNumber.trim(),
      expiryMonth: cardForm.expiryMonth.trim(),
      expiryYear: cardForm.expiryYear.trim(),
      cvc: cardForm.cvc.trim(),
    };

    setForm((prev) => ({
      ...prev,
      cards: [newCard, ...prev.cards],
    }));

    setCardForm({
      bankName: "",
      cardHolderName: "",
      accountNumber: "",
      expiryMonth: "",
      expiryYear: "",
      cvc: "",
    });
    setCardMessage("Kartu baru berhasil ditambahkan ke daftar.");
  };

  const handleClaim = (reward: (typeof claimableRewards)[number]) => {
    const result = claimEmployeeReward(reward);
    setClaimMessage(result.message);
  };
=======
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || data.message || "Gagal mengambil profil.");
        }

        setUser(data.user);
      } catch (error) {
        console.error("PROFILE_ERROR:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Gagal mengambil profil."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return getInitials(user.name);
  }, [user?.name]);

  const workSchedule = useMemo(() => {
    const schedules = user?.shift?.work_schedules;

    if (!schedules || schedules.length === 0) {
      return "Belum diatur";
    }

    const activeSchedule = schedules.find(
      (schedule) => schedule.is_work_day && schedule.check_in_time && schedule.check_out_time
    );

    if (!activeSchedule) {
      return "Belum diatur";
    }

    return `${activeSchedule.check_in_time} - ${activeSchedule.check_out_time}`;
  }, [user?.shift?.work_schedules]);

  if (loading) {
    return (
      <MobileShell variant="employee">
        <AppHeader
          title="Profile"
          subtitle="Informasi akun karyawan"
          rightLabel="Loading"
        />

        <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-5 py-6 md:px-10 lg:px-16">
          <div className="flex items-center gap-3 rounded-3xl border border-blue-100 bg-white px-6 py-5 shadow-xl shadow-slate-300/30">
            <Loader2 className="h-5 w-5 animate-spin text-[#123c8c]" />
            <p className="text-sm font-black text-slate-700">
              Mengambil data profil...
            </p>
          </div>
        </section>

        <BottomNav />
      </MobileShell>
    );
  }

  if (errorMessage || !user) {
    return (
      <MobileShell variant="employee">
        <AppHeader
          title="Profile"
          subtitle="Informasi akun karyawan"
          rightLabel="-"
        />

        <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-5 py-6 md:px-10 lg:px-16">
          <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-5 text-center shadow-xl shadow-slate-300/30">
            <p className="text-sm font-black text-red-700">
              {errorMessage || "Profil tidak ditemukan."}
            </p>
          </div>
        </section>

        <BottomNav />
      </MobileShell>
    );
  }
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Profile"
        subtitle="Informasi akun karyawan"
<<<<<<< HEAD
        rightLabel={authUser.id}
=======
        rightLabel={user.employee_code || "EMP"}
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-center text-white shadow-xl shadow-blue-900/20">
<<<<<<< HEAD
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-4xl font-black text-[#123c8c]">
              {authUser.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </div>

            <h2 className="mt-5 text-2xl font-black">{authUser.name}</h2>

            <p className="mt-1 text-sm font-semibold text-blue-100">
              {authUser.id} • {authUser.department}
=======
            <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-white text-4xl font-black text-[#123c8c]">
              {user.profile_photo ? (
                <img
                  src={user.profile_photo}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                initials
              )}
            </div>

            <h2 className="mt-5 text-2xl font-black">{user.name}</h2>

            <p className="mt-1 text-sm font-semibold text-blue-100">
              {user.employee_code || "No Employee Code"} •{" "}
              {user.department?.name || "No Department"}
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white">
              <BadgeCheck size={18} />
              Reward Member
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Employee ID
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
<<<<<<< HEAD
                {authUser.id}
=======
                {user.employee_code || "-"}
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Account Status
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
<<<<<<< HEAD
                {authUser.status}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Reward Points
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {authUser.rewardPoints}
              </p>
=======
                {formatStatus(user.status)}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Registered Office
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {user.registered_office?.name || "-"}
              </p>
              {user.registered_office?.address ? (
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {user.registered_office.address}
                </p>
              ) : null}
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <UserRound size={26} strokeWidth={2.6} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                  Employee Account
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                  Account Information
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-blue-100">
              Data akun digunakan untuk login, identifikasi karyawan, dan
<<<<<<< HEAD
              pencatatan absensi berbasis formulir dan lampiran bukti.
=======
              pencatatan absensi berbasis verifikasi wajah serta validasi GPS.
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <Mail size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Email</p>
<<<<<<< HEAD
              <p className="mt-1 font-black text-slate-950">{authUser.email}</p>
=======
              <p className="mt-1 break-all font-black text-slate-950">
                {user.email}
              </p>
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <Building2 size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Department
              </p>
              <p className="mt-1 font-black text-slate-950">
<<<<<<< HEAD
                {authUser.department}
=======
                {user.department?.name || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <BriefcaseBusiness size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Position</p>
              <p className="mt-1 font-black text-slate-950">
                {user.position?.name || "-"}
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <ShieldCheck size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Role</p>
<<<<<<< HEAD
              <p className="mt-1 font-black text-slate-950">{authUser.role}</p>
=======
              <p className="mt-1 font-black text-slate-950">
                {formatRole(user.role)}
              </p>
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <CalendarDays size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Work Schedule
              </p>
              <p className="mt-1 font-black text-slate-950">{workSchedule}</p>
              {user.shift?.name ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Shift: {user.shift.name}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <MapPin size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Office GPS
              </p>
              <p className="mt-1 font-black text-slate-950">
                {user.registered_office?.name || "-"}
              </p>
              {user.registered_office ? (
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Radius {user.registered_office.radius_meters} meter
                </p>
              ) : null}
            </div>
          </div>

<<<<<<< HEAD
          <div className="rounded-3xl border border-amber-100 bg-white/90 p-5 shadow-xl shadow-slate-200/60 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <CreditCard size={24} strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                  Reward Payout Data
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  No Rekening / Kartu Reward
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Isi data atas nama, nama akun rekening poin, email, no hp, bulan,
              dan no rek untuk pendataan reward.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Atas Nama
                </label>
                <input
                  value={form.accountHolderName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      accountHolderName: event.target.value,
                    }))
                  }
                  placeholder="Atas nama"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Email
                </label>
                <input
                  value={form.contactEmail}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      contactEmail: event.target.value,
                    }))
                  }
                  placeholder="Email"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  No HP
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-700"
                  />
                  <input
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneNumber: event.target.value,
                      }))
                    }
                    placeholder="No HP"
                    className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Rekening Poin
                </label>
                <input
                  value={form.payoutLabel}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      payoutLabel: event.target.value,
                    }))
                  }
                  placeholder="Contoh: BCA Reward / Bank Lain"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Bank Asal
                </label>
                <div className="relative">
                  <Landmark
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-700"
                  />
                  <input
                    value={form.bankName}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        bankName: event.target.value,
                      }))
                    }
                    placeholder="Contoh: BCA, Mandiri, BNI"
                    className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  No Rek
                </label>
                <input
                  value={form.accountNumber}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      accountNumber: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 16),
                    }))
                  }
                  placeholder="No rekening / no kartu"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Format wajib 16 digit angka.
                </p>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Bulan
                </label>
                <input
                  value={form.expiryMonth}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      expiryMonth: event.target.value,
                    }))
                  }
                  placeholder="Bulan berlaku"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>
              <input
                value={form.expiryYear}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    expiryYear: event.target.value,
                  }))
                }
                placeholder="Tahun berlaku"
                className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
              />
              <input
                value={form.cvc}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cvc: event.target.value }))
                }
                placeholder="CVC"
                className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2 md:col-span-2"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Poin reward saat ini:{" "}
                <span className="font-black text-amber-700">
                  {authUser.rewardPoints}
                </span>
              </p>

              <button
                onClick={handleSave}
                className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-200 transition active:scale-[0.98]"
              >
                Simpan Data Rekening
              </button>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-500">
              {saveMessage ||
                "Data ini dipakai sebagai label rekening reward untuk bank lain atau kartu lain yang ingin digunakan karyawan."}
            </p>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-amber-700">
                  Tambah Kartu Baru
                </p>
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white"
                >
                  <Plus size={14} />
                  Tambah Kartu
                </button>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <input
                  value={cardForm.bankName}
                  onChange={(event) =>
                    setCardForm((prev) => ({
                      ...prev,
                      bankName: event.target.value,
                    }))
                  }
                  placeholder="Bank asal"
                  className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                />

                <input
                  value={cardForm.cardHolderName}
                  onChange={(event) =>
                    setCardForm((prev) => ({
                      ...prev,
                      cardHolderName: event.target.value,
                    }))
                  }
                  placeholder="Atas nama kartu"
                  className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                />

                <input
                  value={cardForm.accountNumber}
                  onChange={(event) =>
                    setCardForm((prev) => ({
                      ...prev,
                      accountNumber: event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 16),
                    }))
                  }
                  placeholder="No rekening 16 digit"
                  className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                />

                <input
                  value={cardForm.expiryMonth}
                  onChange={(event) =>
                    setCardForm((prev) => ({
                      ...prev,
                      expiryMonth: event.target.value,
                    }))
                  }
                  placeholder="Bulan"
                  className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                />

                <input
                  value={cardForm.expiryYear}
                  onChange={(event) =>
                    setCardForm((prev) => ({
                      ...prev,
                      expiryYear: event.target.value,
                    }))
                  }
                  placeholder="Tahun"
                  className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                />

                <input
                  value={cardForm.cvc}
                  onChange={(event) =>
                    setCardForm((prev) => ({
                      ...prev,
                      cvc: event.target.value,
                    }))
                  }
                  placeholder="CVC"
                  className="rounded-2xl border border-amber-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
                />
              </div>

              <p className="mt-3 text-xs font-semibold text-slate-500">
                {cardMessage ||
                  "Kartu tambahan akan disimpan bersama data rekening utama."}
              </p>

              <div className="mt-3 space-y-2">
                {form.cards.length === 0 && (
                  <p className="text-xs font-semibold text-slate-500">
                    Belum ada kartu tambahan.
                  </p>
                )}

                {form.cards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-xl border border-amber-100 bg-white px-3 py-2"
                  >
                    <p className="text-xs font-black text-slate-800">
                      {card.bankName} • {card.cardHolderName}
                    </p>
                    <p className="text-xs font-semibold text-slate-500">
                      {card.accountNumber}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-lg shadow-emerald-100/50 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700">
                <Gift size={24} strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                  Employee Reward
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Claim Hadiah Kecil
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Karyawan bisa melakukan claim hadiah kecil dan umum. Setiap claim
              akan menambah poin reward ke akun Anda.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {claimableRewards.map((reward) => (
                <div
                  key={reward.title}
                  className="rounded-2xl border border-emerald-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {reward.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        {reward.message}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                      +{reward.amount} poin
                    </span>
                  </div>

                  <button
                    onClick={() => handleClaim(reward)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-100 transition active:scale-[0.98]"
                  >
                    <Sparkles size={16} />
                    Claim
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs font-semibold text-slate-500">
              {claimMessage ||
                "Setiap claim berhasil akan langsung menambah poin reward karyawan."}
=======
          <div className="rounded-3xl border border-blue-100 bg-[#f6f8ff] p-5">
            <p className="text-sm font-black text-[#123c8c]">
              Face & GPS Verification
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Wajah karyawan digunakan sebagai bukti foto absensi. Lokasi GPS
              akan divalidasi berdasarkan kantor terdaftar dan radius kantor
              aktif.
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
            </p>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
