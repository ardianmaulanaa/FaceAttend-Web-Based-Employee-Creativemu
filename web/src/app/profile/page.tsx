"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Mail,
  ShieldCheck,
  UserRound,
  BriefcaseBusiness,
  MapPin,
  Loader2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

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

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Profile"
        subtitle="Informasi akun karyawan"
        rightLabel={user.employee_code || "EMP"}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-center text-white shadow-xl shadow-blue-900/20">
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
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white">
              <BadgeCheck size={18} />
              Face Registered
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Employee ID
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {user.employee_code || "-"}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Account Status
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
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
              pencatatan absensi berbasis verifikasi wajah serta validasi GPS.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <Mail size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Email</p>
              <p className="mt-1 break-all font-black text-slate-950">
                {user.email}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <Building2 size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Department
              </p>
              <p className="mt-1 font-black text-slate-950">
                {user.department?.name || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <BriefcaseBusiness size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Position</p>
              <p className="mt-1 font-black text-slate-950">
                {user.position?.name || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <ShieldCheck size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Role</p>
              <p className="mt-1 font-black text-slate-950">
                {formatRole(user.role)}
              </p>
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

          <div className="rounded-3xl border border-blue-100 bg-[#f6f8ff] p-5">
            <p className="text-sm font-black text-[#123c8c]">
              Face & GPS Verification
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Wajah karyawan digunakan sebagai bukti foto absensi. Lokasi GPS
              akan divalidasi berdasarkan kantor terdaftar dan radius kantor
              aktif.
            </p>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}