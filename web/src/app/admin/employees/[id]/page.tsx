"use client";

import { ElementType, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Gift,
  Coins,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Network,
  Phone,
  ShieldCheck,
  UserCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type OfficeMiniRelation = {
  id: string;
  name: string;
  address?: string | null;
  status?: string;
} | null;

type DepartmentRelation = {
  id: string;
  name: string;
  office_id?: string | null;
  office?: OfficeMiniRelation;
} | null;

type UnitRelation = {
  id: string;
  name: string;
  department_id?: string | null;
  department?: DepartmentRelation;
} | null;

type PositionRelation = {
  id: string;
  name: string;
  unit_id?: string | null;
  unit?: UnitRelation;
} | null;

type ShiftRelation = {
  id: string;
  name: string;
  tolerance_minutes?: number;
  status?: string;
} | null;

type OfficeRelation = {
  id: string;
  name: string;
  address: string | null;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  status?: string;
} | null;

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  unit: UnitRelation;
  department: DepartmentRelation;
  position: PositionRelation;
  shift: ShiftRelation;
  registered_office: OfficeRelation;
  phone: string | null;
  status: "active" | "inactive";
  created_at: string;

  profile_photo?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;

  birth_place?: string | null;
  birth_date?: string | null;
  bank_account_number?: string | null;
  nik?: string | null;
  employment_status?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  base_salary?: number | string | null;
  npwp_number?: string | null;
  ptkp_status?: string | null;
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function getInitialName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRelationName(
  item:
    | UnitRelation
    | DepartmentRelation
    | PositionRelation
    | ShiftRelation
    | OfficeRelation,
) {
  return item?.name || "-";
}

function normalizeProfilePhotoUrl(photo?: string | null) {
  if (!photo) return "";

  const cleanPhoto = photo.trim();

  if (!cleanPhoto) return "";

  if (
    cleanPhoto.startsWith("http://") ||
    cleanPhoto.startsWith("https://") ||
    cleanPhoto.startsWith("data:") ||
    cleanPhoto.startsWith("/")
  ) {
    return cleanPhoto;
  }

  if (cleanPhoto.startsWith("uploads/")) {
    return `/${cleanPhoto}`;
  }

  return `/uploads/profiles/${cleanPhoto}`;
}

function getEmployeeProfilePhoto(employee: Employee) {
  return normalizeProfilePhotoUrl(
    employee.profile_photo ||
      employee.profile_photo_url ||
      employee.photo_url ||
      employee.avatar_url ||
      "",
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTTL(birthPlace?: string | null, birthDate?: string | null) {
  const place = birthPlace?.trim() || "";
  const dateFormatted = formatDate(birthDate);

  if (place && dateFormatted !== "-") {
    return `${place}, ${dateFormatted}`;
  }
  if (place) return place;
  if (dateFormatted !== "-") return dateFormatted;
  return "-";
}

function formatEmploymentStatus(status?: string | null) {
  if (!status) return "-";
  const s = status.toLowerCase();
  if (s === "kartap") return "Karyawan Tetap";
  if (s === "kontrak") return "Karyawan Kontrak";
  if (s === "magang") return "Intern / Magang";
  if (s === "pkl") return "Siswa PKL";
  return status;
}

function formatCurrency(amount?: number | string | null) {
  if (!amount) return "-";
  const num = Number(amount);
  if (isNaN(num)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

function formatStatus(status: "active" | "inactive") {
  return status === "active" ? "Active" : "Inactive";
}

function EmployeeDetailMotionStyles() {
  return (
    <style>{`
      @keyframes employeeDetailEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes employeeDetailCardEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes employeeDetailAvatarEnter {
        0% {
          opacity: 0;
          transform: translateY(12px) scale(0.96);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .employee-detail-enter {
        animation: employeeDetailEnter 320ms ease-out both;
      }

      .employee-detail-card-enter {
        opacity: 0;
        animation: employeeDetailCardEnter 300ms ease-out both;
      }

      .employee-detail-avatar-enter {
        animation: employeeDetailAvatarEnter 360ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .employee-detail-enter,
        .employee-detail-card-enter,
        .employee-detail-avatar-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

function EmployeeProfileAvatar({ employee }: { employee: Employee }) {
  const [imageError, setImageError] = useState(false);
  const profilePhoto = getEmployeeProfilePhoto(employee);

  if (profilePhoto && !imageError) {
    return (
      <div className="employee-detail-avatar-enter h-28 w-28 overflow-hidden rounded-[2rem] bg-white/15 ring-4 ring-white/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profilePhoto}
          alt={`Foto profil ${employee.name}`}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className="employee-detail-avatar-enter flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white/15 text-4xl font-black text-white ring-4 ring-white/20">
      {getInitialName(employee.name) || <UserRound size={42} />}
    </div>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  description,
  delay = 0,
}: {
  icon: ElementType;
  label: string;
  value: string;
  description?: string;
  delay?: number;
}) {
  return (
    <div
      className="employee-detail-card-enter rounded-[1.6rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
          <Icon size={23} strokeWidth={2.7} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>

          <p className="mt-2 break-words text-base font-black text-slate-950">
            {value || "-"}
          </p>

          {description ? (
            <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
        {title}
      </p>
      <h2 className="mt-2 text-2xl font-black text-slate-950">{subtitle}</h2>
    </div>
  );
}

export default function AdminEmployeeDetailPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadEmployeeDetail() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        setEmployee(null);
        setErrorMessage(result.message || "Gagal mengambil data karyawan.");
        return;
      }

      const employees = (result.employees || result.data || []) as Employee[];
      const selectedEmployee =
        employees.find((item) => String(item.id) === id) || null;

      if (!selectedEmployee) {
        setEmployee(null);
        setErrorMessage("Data karyawan tidak ditemukan.");
        return;
      }

      setEmployee(selectedEmployee);
    } catch (error) {
      console.error("LOAD_EMPLOYEE_DETAIL_ERROR:", error);

      setEmployee(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data karyawan.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      void loadEmployeeDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const profilePhoto = useMemo(() => {
    if (!employee) return "";
    return getEmployeeProfilePhoto(employee);
  }, [employee]);

  return (
    <MobileShell variant="admin">
      <EmployeeDetailMotionStyles />

      <AppHeader
        title="Profil Karyawan"
        subtitle="Detail data employee untuk admin"
        variant="admin"
      />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <Link
          href="/admin/employees"
          className="employee-detail-enter inline-flex items-center gap-2 rounded-2xl bg-white dark:bg-[#21262d] px-4 py-3 text-sm font-black text-[#123c8c] dark:text-[#58a6ff] shadow-sm ring-1 ring-blue-100 dark:ring-[#30363d] transition hover:bg-[#f8fbff] dark:hover:bg-[#30363d] active:scale-[0.98]"
        >
          <ArrowLeft size={18} strokeWidth={2.7} />
          Kembali ke Employees
        </Link>

        {isLoading ? (
          <div className="employee-detail-enter mt-6 flex min-h-[360px] items-center justify-center rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/50">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
              <p className="mt-3 text-sm font-black text-slate-600">
                Mengambil data karyawan...
              </p>
            </div>
          </div>
        ) : errorMessage || !employee ? (
          <div className="employee-detail-enter mt-6 rounded-[2rem] border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
            {errorMessage || "Data karyawan tidak ditemukan."}
          </div>
        ) : (
          <>
            <section className="employee-detail-enter mt-6 overflow-hidden rounded-[2.2rem] border border-blue-100 bg-white shadow-2xl shadow-slate-300/30">
              <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
                <div className="relative overflow-hidden bg-[#123c8c] p-7 text-white md:p-8">
                  <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

                  <div className="relative z-10">
                    <EmployeeProfileAvatar employee={employee} />

                    <div
                      className="employee-detail-card-enter mt-6"
                      style={{ animationDelay: "80ms" }}
                    >
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                        Employee Profile
                      </p>

                      <h1 className="mt-2 break-words text-4xl font-black tracking-tight">
                        {employee.name}
                      </h1>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span
                          className={`inline-flex rounded-full px-4 py-2 text-xs font-black ${
                            employee.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(employee.status)}
                        </span>

                        <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                          {employee.role || "employee"}
                        </span>
                      </div>

                      {profilePhoto ? (
                        <p className="mt-4 text-xs font-semibold text-blue-100">
                          Foto profil tersimpan pada akun karyawan.
                        </p>
                      ) : (
                        <p className="mt-4 text-xs font-semibold text-blue-100">
                          Karyawan belum memiliki foto profil.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2 md:p-7">
                  <DetailCard
                    icon={Mail}
                    label="Email"
                    value={employee.email}
                    description="Email login karyawan"
                    delay={80}
                  />

                  <DetailCard
                    icon={Phone}
                    label="Nomor Telepon"
                    value={employee.phone || "-"}
                    description="Kontak pribadi karyawan"
                    delay={100}
                  />

                  <DetailCard
                    icon={IdCard}
                    label="NIK (No. Induk Kependudukan)"
                    value={employee.nik || "-"}
                    description="Nomor NIK KTP resmi"
                    delay={120}
                  />

                  <DetailCard
                    icon={Gift}
                    label="Tempat, Tanggal Lahir (TTL)"
                    value={formatTTL(employee.birth_place, employee.birth_date)}
                    description="TTL sesuai identitas resmi"
                    delay={140}
                  />

                  <DetailCard
                    icon={CreditCard}
                    label="No. Rekening Bank"
                    value={employee.bank_account_number || "-"}
                    description="Rekening pencairan gaji karyawan"
                    delay={160}
                  />

                  <DetailCard
                    icon={UserCheck}
                    label="Status Kepegawaian"
                    value={formatEmploymentStatus(employee.employment_status)}
                    description={
                      employee.contract_start_date
                        ? `Mulai kerja: ${formatDate(employee.contract_start_date)}`
                        : "Status hubungan kerja"
                    }
                    delay={180}
                  />

                  <DetailCard
                    icon={Coins}
                    label="Gaji Pokok"
                    value={formatCurrency(employee.base_salary)}
                    description={
                      employee.ptkp_status
                        ? `Status PTKP: ${employee.ptkp_status}`
                        : "Gaji acuan bulanan"
                    }
                    delay={200}
                  />

                  <DetailCard
                    icon={IdCard}
                    label="Employee ID"
                    value={employee.id}
                    description="ID unik akun di database"
                    delay={220}
                  />

                  <DetailCard
                    icon={CalendarDays}
                    label="Tanggal Dibuat"
                    value={formatDate(employee.created_at)}
                    description="Tanggal akun employee didaftarkan"
                    delay={240}
                  />
                </div>
              </div>
            </section>

            <section
              className="employee-detail-enter mt-6 rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-300/30 md:p-6"
              style={{ animationDelay: "120ms" }}
            >
              <SectionTitle
                title="Struktur Organisasi"
                subtitle="Kantor, divisi, posisi, jabatan, dan shift"
              />

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailCard
                  icon={MapPin}
                  label="Kantor Terdaftar"
                  value={getRelationName(employee.registered_office)}
                  description={employee.registered_office?.address || "-"}
                  delay={80}
                />

                <DetailCard
                  icon={Network}
                  label="Divisi"
                  value={getRelationName(employee.department)}
                  delay={120}
                />

                <DetailCard
                  icon={Building2}
                  label="Posisi"
                  value={getRelationName(employee.unit)}
                  delay={160}
                />

                <DetailCard
                  icon={BriefcaseBusiness}
                  label="Jabatan"
                  value={getRelationName(employee.position)}
                  delay={200}
                />

                <DetailCard
                  icon={Clock3}
                  label="Shift"
                  value={getRelationName(employee.shift)}
                  description={
                    employee.shift?.tolerance_minutes !== undefined
                      ? `Toleransi keterlambatan ${employee.shift.tolerance_minutes} menit`
                      : "Toleransi belum tersedia"
                  }
                  delay={240}
                />

                <DetailCard
                  icon={ShieldCheck}
                  label="Status Akun"
                  value={formatStatus(employee.status)}
                  description={
                    employee.status === "active"
                      ? "Akun dapat digunakan untuk login dan absensi."
                      : "Akun sedang nonaktif."
                  }
                  delay={280}
                />
              </div>
            </section>

            <section
              className="employee-detail-enter mt-6 rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-300/30 md:p-6"
              style={{ animationDelay: "160ms" }}
            >
              <SectionTitle
                title="Ringkasan"
                subtitle="Informasi cepat karyawan"
              />

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div
                  className="employee-detail-card-enter rounded-[1.6rem] bg-[#f8fbff] p-5 ring-1 ring-blue-50 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
                  style={{ animationDelay: "80ms" }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                    <UsersRound size={24} strokeWidth={2.7} />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Nama
                  </p>
                  <p className="mt-2 break-words text-lg font-black text-slate-950">
                    {employee.name}
                  </p>
                </div>

                <div
                  className="employee-detail-card-enter rounded-[1.6rem] bg-[#f8fbff] p-5 ring-1 ring-blue-50 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
                  style={{ animationDelay: "120ms" }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <BadgeCheck size={24} strokeWidth={2.7} />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Akun
                  </p>
                  <p className="mt-2 text-lg font-black text-slate-950">
                    {formatStatus(employee.status)}
                  </p>
                </div>

                <div
                  className="employee-detail-card-enter rounded-[1.6rem] bg-[#f8fbff] p-5 ring-1 ring-blue-50 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60"
                  style={{ animationDelay: "160ms" }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                    <BriefcaseBusiness size={24} strokeWidth={2.7} />
                  </div>
                  <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                    Jabatan
                  </p>
                  <p className="mt-2 break-words text-lg font-black text-slate-950">
                    {getRelationName(employee.position)}
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
