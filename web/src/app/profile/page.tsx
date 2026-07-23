"use client";

import { FormEvent, useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  CreditCard,
  Eye,
  EyeOff,
  Gift,
  IdCard,
  Image as ImageIcon,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Network,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  UserCheck,
  UserRound,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
  type LucideIcon,
} from "lucide-react";

import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type ShiftWorkSchedule = {
  day_of_week: string;
  is_work_day: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
};

type ProfileUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
  profile_photo: string | null;
  unit?: {
    id: string;
    name: string;
  } | null;
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
    work_schedules?: ShiftWorkSchedule[];
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

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

type EditProfileForm = {
  name: string;
  phone: string;
  birth_place: string;
  birth_date: string;
  nik: string;
  bank_account_number: string;
};

type ProfileView = "menu" | "personal-detail";

type ProfileAlert = {
  type: "warning" | "success" | "error" | "info";
  title: string;
  message: string;
} | null;

const initialPasswordForm: PasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
};

const initialEditProfileForm: EditProfileForm = {
  name: "",
  phone: "",
  birth_place: "",
  birth_date: "",
  nik: "",
  bank_account_number: "",
};

const dayLabels: Record<string, string> = {
  MONDAY: "Senin",
  TUESDAY: "Selasa",
  WEDNESDAY: "Rabu",
  THURSDAY: "Kamis",
  FRIDAY: "Jumat",
  SATURDAY: "Sabtu",
  SUNDAY: "Minggu",
};

function cleanValue(value?: string | null) {
  return value?.trim() || "";
}

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
  const roleMap: Record<string, string> = {
    owner: "Owner",
    admin: "Admin",
    cs: "CS",
    employee: "Employee",
    OWNER: "Owner",
    ADMIN: "Admin",
    CS: "CS",
    EMPLOYEE: "Employee",
  };

  return roleMap[role] || role;
}

function formatStatus(status: string) {
  const statusMap: Record<string, string> = {
    active: "Aktif",
    inactive: "Nonaktif",
    ACTIVE: "Aktif",
    INACTIVE: "Nonaktif",
  };

  return statusMap[status] || status;
}

function formatDay(day: string) {
  return dayLabels[day] || day;
}

function normalizePhoneInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 12);
}

function isValidPhoneNumber(value: string) {
  return /^\d{10,12}$/.test(value);
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

function getProfileAlertTheme(type: NonNullable<ProfileAlert>["type"]) {
  if (type === "success") {
    return {
      shell: "from-emerald-50 via-white to-blue-50 dark:from-[#0f291e] dark:via-[#161b22] dark:to-[#0d141e] dark:border-[#21262d]",
      iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      badge: "text-emerald-600 bg-white/70 dark:bg-[#30363d] dark:text-emerald-400",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-[#0d1117]",
      icon: CheckCircle2,
      label: "BERHASIL",
    };
  }

  if (type === "error") {
    return {
      shell: "from-red-50 via-white to-blue-50 dark:from-[#2d1918] dark:via-[#161b22] dark:to-[#0f141c] dark:border-[#21262d]",
      iconWrap: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
      badge: "text-red-600 bg-white/70 dark:bg-[#30363d] dark:text-red-400",
      button: "bg-red-600 hover:bg-red-700 shadow-red-900/20 dark:bg-red-500 dark:hover:bg-red-600 dark:text-[#0d1117]",
      icon: AlertTriangle,
      label: "GAGAL",
    };
  }

  if (type === "info") {
    return {
      shell: "from-blue-50 via-white to-blue-50 dark:from-[#0d1f3d] dark:via-[#161b22] dark:to-[#0d1f3d] dark:border-[#21262d]",
      iconWrap: "bg-blue-100 text-[#123c8c] dark:bg-blue-950/40 dark:text-[#58a6ff]",
      badge: "text-[#123c8c] bg-white/70 dark:bg-[#30363d] dark:text-[#58a6ff]",
      button: "bg-[#123c8c] hover:bg-[#0f3274] shadow-blue-900/20 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd]",
      icon: ShieldCheck,
      label: "INFO",
    };
  }

  return {
    shell: "from-orange-50 via-white to-blue-50 dark:from-[#2e1d0f] dark:via-[#161b22] dark:to-[#121d2f] dark:border-[#21262d]",
    iconWrap: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    badge: "text-orange-600 bg-white/70 dark:bg-[#30363d] dark:text-orange-400",
    button: "bg-[#526fae] hover:bg-[#46629d] shadow-blue-900/20 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd]",
    icon: AlertTriangle,
    label: "PERHATIAN",
  };
}

function getActiveScheduleText(schedules?: ShiftWorkSchedule[]) {
  if (!schedules || schedules.length === 0) return "";

  const activeSchedules = schedules.filter(
    (schedule) =>
      schedule.is_work_day && schedule.check_in_time && schedule.check_out_time,
  );

  if (activeSchedules.length === 0) return "";

  const firstSchedule = activeSchedules[0];

  return `${formatDay(firstSchedule.day_of_week)} • ${firstSchedule.check_in_time
    } - ${firstSchedule.check_out_time}`;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function ProfileMotionStyles() {
  return (
    <style>{`
      @keyframes profileEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes profileRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes profileModalBackdrop {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
      }

      @keyframes profileModalPanel {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes profileAvatarPop {
        0% {
          opacity: 0;
          transform: translateY(8px) scale(0.92);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes profileToastIn {
        0% {
          opacity: 0;
          transform: translateX(28px) translateY(-8px) scale(0.96);
        }

        100% {
          opacity: 1;
          transform: translateX(0) translateY(0) scale(1);
        }
      }

      .profile-enter {
        animation: profileEnter 340ms ease-out both;
      }

      .profile-row-enter {
        opacity: 0;
        animation: profileRowEnter 300ms ease-out both;
      }

      .profile-modal-backdrop {
        animation: profileModalBackdrop 180ms ease-out both;
      }

      .profile-modal-panel {
        animation: profileModalPanel 260ms ease-out both;
        transform-origin: center bottom;
      }

      .profile-avatar-pop {
        animation: profileAvatarPop 300ms ease-out both;
      }

      .profile-toast-enter {
        animation: profileToastIn 260ms ease-out both;
      }

      .profile-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease,
          transform 180ms ease;
      }

      .profile-field:focus {
        transform: translateY(-1px);
      }

      @media (prefers-reduced-motion: reduce) {
        .profile-enter,
        .profile-row-enter,
        .profile-modal-backdrop,
        .profile-modal-panel,
        .profile-avatar-pop,
        .profile-toast-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }

        .profile-field:focus {
          transform: none !important;
        }
      }
    `}</style>
  );
}

type ProfileAvatarProps = {
  user: ProfileUser;
  initials: string;
  size?: "sm" | "md" | "lg";
};

function ProfileAvatar({ user, initials, size = "md" }: ProfileAvatarProps) {
  const sizeClass = {
    sm: "h-16 w-16 text-xl",
    md: "h-24 w-24 text-3xl",
    lg: "h-32 w-32 text-4xl",
  }[size];

  return (
    <div
      className={`profile-avatar-pop flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf1ff] font-black text-[#123c8c] ring-4 ring-blue-100 ${sizeClass}`}
    >
      {user.profile_photo ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user.profile_photo}
            alt={user.name}
            className="h-full w-full object-cover"
          />
        </>
      ) : (
        initials
      )}
    </div>
  );
}

type SectionRowProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  delay?: string;
};

function SectionRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
  delay = "0ms",
}: SectionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="profile-row-enter w-full border-b border-slate-100 dark:border-[#30363d]/50 transition hover:bg-[#f8fbff] dark:hover:bg-[#30363d]/30 active:scale-[0.99]"
      style={{ animationDelay: delay }}
    >
      <div className="flex w-full items-center gap-4 py-5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] dark:bg-[#21262d] text-[#123c8c] dark:text-[#58a6ff]">
          <Icon size={24} strokeWidth={2.7} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="text-base font-black text-slate-950 dark:text-white md:text-lg">
            {title}
          </p>

          {subtitle ? (
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-400 dark:text-slate-500">
              {subtitle}
            </p>
          ) : null}
        </div>

        <ChevronRight
          size={24}
          strokeWidth={2.8}
          className="shrink-0 text-[#123c8c] dark:text-[#58a6ff]"
        />
      </div>
    </button>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  delay?: string;
};

function DetailItem({
  label,
  value,
  icon: Icon,
  delay = "0ms",
}: DetailItemProps) {
  return (
    <div
      className="profile-row-enter rounded-3xl border border-blue-100 dark:border-[#30363d] bg-white dark:bg-[#161b22] p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 md:p-6"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start gap-4">
        {Icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] dark:bg-[#21262d] text-[#123c8c] dark:text-[#58a6ff]">
            <Icon size={22} strokeWidth={2.7} />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-400 dark:text-slate-500">{label}</p>
          <p className="mt-2 break-words text-lg font-black leading-7 text-[#123456] dark:text-[#c9d1d9]">
            {value || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}

type PasswordInputProps = {
  label: string;
  value: string;
  placeholder: string;
  show: boolean;
  onToggleShow: () => void;
  onChange: (value: string) => void;
};

function PasswordInput({
  label,
  value,
  placeholder,
  show,
  onToggleShow,
  onChange,
}: PasswordInputProps) {
  return (
    <div className="profile-row-enter">
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="profile-field w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 pr-12 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-[#123c8c]"
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function getAlertTheme(type: NonNullable<ProfileAlert>["type"]) {
  if (type === "success") {
    return {
      shell: "from-emerald-50 via-white to-blue-50 dark:from-[#0f291e] dark:via-[#161b22] dark:to-[#0d141e] dark:border-[#21262d]",
      iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      badge: "text-emerald-600 bg-white/70 dark:bg-[#30363d] dark:text-emerald-400",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-[#0d1117]",
      icon: CheckCircle2,
      label: "BERHASIL",
    };
  }

  if (type === "error") {
    return {
      shell: "from-red-50 via-white to-blue-50 dark:from-[#2d1918] dark:via-[#161b22] dark:to-[#0f141c] dark:border-[#21262d]",
      iconWrap: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
      badge: "text-red-600 bg-white/70 dark:bg-[#30363d] dark:text-red-400",
      button: "bg-red-600 hover:bg-red-700 shadow-red-900/20 dark:bg-red-500 dark:hover:bg-red-600 dark:text-[#0d1117]",
      icon: AlertTriangle,
      label: "GAGAL",
    };
  }

  if (type === "info") {
    return {
      shell: "from-blue-50 via-white to-blue-50 dark:from-[#0d1f3d] dark:via-[#161b22] dark:to-[#0d1f3d] dark:border-[#21262d]",
      iconWrap: "bg-blue-100 text-[#123c8c] dark:bg-blue-950/40 dark:text-[#58a6ff]",
      badge: "text-[#123c8c] bg-white/70 dark:bg-[#30363d] dark:text-[#58a6ff]",
      button: "bg-[#123c8c] hover:bg-[#0f3274] shadow-blue-900/20 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd]",
      icon: Info,
      label: "INFO",
    };
  }

  return {
    shell: "from-orange-50 via-white to-blue-50 dark:from-[#2e1d0f] dark:via-[#161b22] dark:to-[#121d2f] dark:border-[#21262d]",
    iconWrap: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    badge: "text-orange-600 bg-white/70 dark:bg-[#30363d] dark:text-orange-400",
    button: "bg-[#526fae] hover:bg-[#46629d] shadow-blue-900/20 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd]",
    icon: AlertTriangle,
    label: "PERHATIAN",
  };
}

export default function ProfilePage() {
  const router = useRouter();

  const [activeView, setActiveView] = useState<ProfileView>("menu");

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [profileAlert, setProfileAlert] = useState<ProfileAlert>(null);
  const [isProfileAlertClosing, setIsProfileAlertClosing] = useState(false);
  const profileAlertCloseTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState<EditProfileForm>(
    initialEditProfileForm,
  );

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(initialPasswordForm);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function showProfileAlert(
    title: string,
    message: string,
    type: "success" | "error" | "warning" | "info" = "warning",
  ) {
    if (profileAlertCloseTimeoutRef.current) {
      clearTimeout(profileAlertCloseTimeoutRef.current);
    }

    setIsProfileAlertClosing(false);
    setProfileAlert({
      type,
      title,
      message,
    });
  }

  function closeProfileAlert() {
    setIsProfileAlertClosing(true);

    profileAlertCloseTimeoutRef.current = setTimeout(() => {
      setProfileAlert(null);
      setIsProfileAlertClosing(false);
    }, 240);
  }

  function handlePhoneInputChange(value: string) {
    const normalizedPhone = normalizePhoneInput(value);

    if (value !== normalizedPhone) {
      showProfileAlert(
        "Nomor telepon tidak valid",
        "Nomor telepon hanya boleh menggunakan angka tanpa spasi atau simbol, maksimal 12 digit.",
        "warning",
      );
    }

    setEditProfileForm((prev) => ({
      ...prev,
      phone: normalizedPhone,
    }));
  }

  async function loadProfile() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal mengambil profil.",
        );
      }

      setUser(data.user);
    } catch (error) {
      console.error("PROFILE_ERROR:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengambil profil.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openEditProfileModal() {
    if (!user) return;

    setEditProfileForm({
      name: user.name || "",
      phone: user.phone || "",
      birth_place: (user as any).birth_place || "",
      birth_date: (user as any).birth_date ? String((user as any).birth_date).substring(0, 10) : "",
      nik: (user as any).nik || "",
      bank_account_number: (user as any).bank_account_number || "",
    });

    setIsEditProfileModalOpen(true);
  }

  function closeEditProfileModal() {
    setEditProfileForm(initialEditProfileForm);
    setIsEditProfileModalOpen(false);
  }

  async function handleUpdateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = editProfileForm.name.trim();
    const phone = editProfileForm.phone.trim();
    const birth_place = editProfileForm.birth_place.trim();
    const birth_date = editProfileForm.birth_date.trim();
    const nik = editProfileForm.nik.trim();
    const bank_account_number = editProfileForm.bank_account_number.trim();

    if (!name) {
      showProfileAlert(
        "Nama wajib diisi",
        "Nama lengkap tidak boleh kosong.",
        "warning",
      );
      return;
    }

    if (name.split(/\s+/).filter(Boolean).length < 2) {
      showProfileAlert(
        "Nama tidak lengkap",
        "Nama lengkap harus terdiri dari minimal 2 kata.",
        "warning",
      );
      return;
    }

    if (!phone) {
      showProfileAlert(
        "Nomor telepon wajib diisi",
        "Nomor telepon harus berisi angka dengan panjang 10 sampai 12 digit.",
        "warning",
      );
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      showProfileAlert(
        "Nomor telepon tidak valid",
        "Nomor telepon hanya boleh berisi angka tanpa spasi, dengan panjang 10 sampai 12 digit.",
        "warning",
      );
      return;
    }

    if (nik && (!/^\d+$/.test(nik) || nik.length !== 12)) {
      showProfileAlert(
        "NIK tidak valid",
        "NIK harus berupa angka dan berjumlah tepat 12 digit.",
        "warning"
      );
      return;
    }

    if (bank_account_number && (!/^\d+$/.test(bank_account_number) || bank_account_number.length < 11 || bank_account_number.length > 13)) {
      showProfileAlert(
        "Nomor Rekening tidak valid",
        "Nomor rekening harus berupa angka dengan panjang antara 11 sampai 13 digit.",
        "warning"
      );
      return;
    }

    try {
      setIsUpdatingProfile(true);

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          birth_place,
          birth_date: birth_date || null,
          nik,
          bank_account_number,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        showProfileAlert(
          "Gagal memperbarui profil",
          data.message || data.error || "Gagal memperbarui profil.",
          "error",
        );
        return;
      }

      setUser((currentUser) =>
        currentUser
          ? {
              ...currentUser,
              name: data.user?.name || name,
              phone: data.user?.phone || phone || null,
              birth_place: data.user?.birth_place || birth_place || null,
              birth_date: data.user?.birth_date || birth_date || null,
              nik: data.user?.nik || nik || null,
              bank_account_number: data.user?.bank_account_number || bank_account_number || null,
            }
          : currentUser,
      );

      showProfileAlert(
        "Profil berhasil diperbarui",
        "Nama dan nomor telepon berhasil disimpan.",
        "success",
      );
      closeEditProfileModal();
    } catch (error) {
      console.error("UPDATE_PROFILE_ERROR:", error);
      showProfileAlert(
        "Gagal memperbarui profil",
        "Terjadi kesalahan saat menyimpan perubahan profil.",
        "error",
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  }

  async function handleLogout() {
    try {
      setIsLoggingOut(true);

      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });

      window.localStorage.removeItem("faceattend_read_announcement_id");
      window.sessionStorage.clear();

      document.cookie.split(";").forEach((cookie) => {
        const cookieName = cookie.split("=")[0]?.trim();

        if (!cookieName) return;

        document.cookie = `${cookieName}=; Max-Age=0; path=/`;
      });

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("LOGOUT_ERROR:", error);

      router.replace("/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  async function handleUploadProfilePhoto(file: File) {
    try {
      if (!file.type.startsWith("image/")) {
        showProfileAlert(
          "File tidak valid",
          "File harus berupa gambar.",
          "warning",
        );
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showProfileAlert(
          "Foto terlalu besar",
          "Ukuran foto maksimal 2MB.",
          "warning",
        );
        return;
      }

      setIsUploadingPhoto(true);

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/profile/photo", {
        method: "POST",
        body: formData,
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        showProfileAlert(
          "Gagal upload foto",
          data.error || data.message || "Gagal upload foto profil.",
          "error",
        );
        return;
      }

      if (data.user?.profile_photo) {
        setUser((currentUser) =>
          currentUser
            ? {
                ...currentUser,
                profile_photo: data.user.profile_photo,
              }
            : currentUser,
        );
      }

      showProfileAlert(
        "Foto profil berhasil diperbarui",
        "Foto profil baru sudah tersimpan.",
        "success",
      );
    } catch (error) {
      console.error("UPLOAD_PROFILE_PHOTO_ERROR:", error);
      showProfileAlert(
        "Gagal upload foto",
        "Gagal upload foto profil.",
        "error",
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function openPasswordModal() {
    setPasswordForm(initialPasswordForm);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordModalOpen(true);
  }

  function closePasswordModal() {
    setPasswordForm(initialPasswordForm);
    setIsPasswordModalOpen(false);
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      showProfileAlert(
        "Password belum lengkap",
        "Semua field password wajib diisi.",
        "warning",
      );
      return;
    }

    if (passwordForm.new_password.length < 8) {
      showProfileAlert(
        "Password terlalu pendek",
        "Password baru minimal 8 karakter.",
        "warning",
      );
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showProfileAlert(
        "Konfirmasi password tidak sama",
        "Password baru and konfirmasi password harus sama.",
        "warning",
      );
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await fetch("/api/profile/change-password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(passwordForm),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal mengubah password.",
        );
      }

      showProfileAlert(
        "Password berhasil diperbarui",
        "Gunakan password baru untuk login berikutnya.",
        "success",
      );
      closePasswordModal();
    } catch (error) {
      console.error("CHANGE_PASSWORD_ERROR:", error);

      showProfileAlert(
        "Gagal mengubah password",
        error instanceof Error ? error.message : "Gagal mengubah password.",
        "error",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (profileAlertCloseTimeoutRef.current) {
        clearTimeout(profileAlertCloseTimeoutRef.current);
      }
    };
  }, []);

  const initials = useMemo(() => {
    if (!user?.name) return "";
    return getInitials(user.name);
  }, [user?.name]);

  const subtitleInfo = useMemo(() => {
    if (!user) return "";

    return [
      cleanValue(user.position?.name),
      cleanValue(user.unit?.name),
      cleanValue(user.department?.name),
    ]
      .filter(Boolean)
      .join(" • ");
  }, [user]);

  const workSchedule = useMemo(() => {
    return getActiveScheduleText(user?.shift?.work_schedules);
  }, [user?.shift?.work_schedules]);

  const headerRightLabel = user?.shift?.name || undefined;

  const detailItems = useMemo(() => {
    if (!user) return [];

    return [
      {
        label: "Nama Lengkap",
        value: user.name,
        icon: UserRound,
      },
      {
        label: "Email",
        value: user.email,
        icon: Mail,
      },
      {
        label: "Nomor Telepon",
        value: user.phone || "-",
        icon: Phone,
      },
      {
        label: "Status Akun",
        value: formatStatus(user.status),
        icon: BadgeCheck,
      },
      {
        label: "Role Akun",
        value: formatRole(user.role),
        icon: ShieldCheck,
      },
      {
        label: "Posisi",
        value: user.unit?.name || "-",
        icon: Building2,
      },
      {
        label: "Divisi",
        value: user.department?.name || "-",
        icon: Network,
      },
      {
        label: "Jabatan",
        value: user.position?.name || "-",
        icon: BriefcaseBusiness,
      },
      {
        label: "NIK (No. Induk Kependudukan)",
        value: (user as any).nik || "-",
        icon: IdCard,
      },
      {
        label: "Tempat, Tanggal Lahir (TTL)",
        value: formatTTL((user as any).birth_place, (user as any).birth_date),
        icon: Gift,
      },
      {
        label: "No. Rekening Bank",
        value: (user as any).bank_account_number || "-",
        icon: CreditCard,
      },
      {
        label: "Status Kepegawaian",
        value: formatEmploymentStatus((user as any).employment_status),
        icon: UserCheck,
      },
      {
        label: "Shift",
        value: user.shift?.name || "-",
        icon: CalendarDays,
      },
      {
        label: "Jam Kerja",
        value: workSchedule || "-",
        icon: Clock3,
      },
      {
        label: "Kantor Terdaftar",
        value: user.registered_office?.name || "-",
        icon: MapPin,
      },
      {
        label: "Alamat Kantor",
        value: user.registered_office?.address || "-",
        icon: MapPin,
      },
    ];
  }, [user, workSchedule]);

  const profileAlertTheme = profileAlert
    ? getProfileAlertTheme(profileAlert.type)
    : null;
  const ProfileAlertIcon = profileAlertTheme?.icon || AlertTriangle;

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <ProfileMotionStyles />

      <div className="hidden md:block">
        <AppHeader
          title={
            activeView === "personal-detail" ? "Detail Personal" : "Profile"
          }
          subtitle={
            activeView === "personal-detail"
              ? "Informasi lengkap data karyawan"
              : "Pengaturan akun dan data pribadi"
          }
          rightLabel={headerRightLabel}
          variant="employee"
        />
      </div>

      <main className="w-full max-w-full text-slate-950 pb-28">
        {loading ? (
          <section className="profile-enter mx-auto max-w-5xl px-5 pt-8 md:px-10">
            <div className="flex items-center gap-3 rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 text-sm font-bold text-slate-500">
              <Loader2 size={20} className="animate-spin text-[#123c8c]" />
              Mengambil data profil...
            </div>
          </section>
        ) : errorMessage || !user ? (
          <section className="profile-enter mx-auto max-w-5xl px-5 pt-8 md:px-10">
            <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-center">
              <p className="text-sm font-black text-red-700">
                {errorMessage || "Profil tidak ditemukan."}
              </p>
            </div>
          </section>
        ) : activeView === "personal-detail" ? (
          <section className="profile-enter mx-auto max-w-5xl px-5 pt-5 md:px-10 md:pt-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5 md:hidden">
              <button
                type="button"
                onClick={() => setActiveView("menu")}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-[#21262d] text-[#123456] dark:text-[#58a6ff] transition hover:bg-[#f8fbff] dark:hover:bg-[#30363d] active:scale-[0.96]"
              >
                <ArrowLeft size={25} strokeWidth={2.8} />
              </button>

              <h1 className="text-xl font-black text-[#123456] dark:text-white">
                Detail Personal
              </h1>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <button
                type="button"
                onClick={() => setActiveView("menu")}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white dark:bg-[#21262d] text-[#123456] dark:text-[#58a6ff] shadow-sm shadow-slate-200 dark:shadow-none transition hover:-translate-y-0.5 hover:bg-[#f8fbff] dark:hover:bg-[#30363d] active:scale-[0.96]"
              >
                <ArrowLeft size={25} strokeWidth={2.8} />
              </button>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Data Pribadi
                </p>

                <h1 className="mt-1 text-3xl font-black text-[#123456] dark:text-white">
                  Detail Personal
                </h1>
              </div>
            </div>

            <div
              className="profile-row-enter mt-10 flex flex-col items-center md:mt-8"
              style={{ animationDelay: "60ms" }}
            >
              <ProfileAvatar user={user} initials={initials} size="md" />

              <h2 className="mt-5 text-center text-2xl font-black text-[#123456] dark:text-white md:text-3xl">
                {user.name}
              </h2>

              {user.position?.name ? (
                <p className="mt-2 text-center text-base font-semibold text-slate-400">
                  {user.position.name}
                </p>
              ) : null}

              <button
                type="button"
                onClick={openEditProfileModal}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-[#0f3274] active:scale-[0.98]"
              >
                <Pencil size={17} strokeWidth={2.7} />
                Edit Detail
              </button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {detailItems.map((item, index) => (
                <DetailItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  delay={`${index * 45}ms`}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="profile-enter mx-auto max-w-5xl px-5 pt-5 md:px-10 md:pt-8">
            <div className="rounded-[2rem] bg-white px-1 pt-2 md:px-0 md:pt-0">
              <div className="flex items-center gap-4">
                <div className="profile-avatar-pop flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] bg-[#123c8c] text-white shadow-lg shadow-blue-900/20">
                  <UserRound size={27} strokeWidth={2.7} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                    Profile
                  </p>

                  <h1 className="mt-1 text-3xl font-black tracking-tight text-[#123456] md:text-4xl">
                    Akun
                  </h1>
                </div>
              </div>
            </div>

            <div
              className="profile-row-enter mt-6 flex items-center gap-5 rounded-[2rem] bg-white transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/50 md:border md:border-blue-100 md:p-6 md:shadow-xl md:shadow-slate-200/50"
              style={{ animationDelay: "60ms" }}
            >
              <ProfileAvatar user={user} initials={initials} size="sm" />

              <div className="min-w-0">
                <h2 className="truncate text-xl font-black text-[#123456] md:text-3xl">
                  {user.name}
                </h2>

                <p className="mt-1 truncate text-base font-semibold text-slate-400 md:text-lg">
                  {subtitleInfo || formatRole(user.role)}
                </p>
              </div>
            </div>

            <div
              className="profile-row-enter mt-12 md:mt-10"
              style={{ animationDelay: "100ms" }}
            >
              <h3 className="text-xl font-black text-slate-950">
                Data Pribadi
              </h3>

              <div className="mt-5 overflow-hidden rounded-[1.8rem] bg-white dark:bg-[#161b22] md:border md:border-blue-100 dark:md:border-[#21262d] md:p-2 md:shadow-xl md:shadow-slate-200/50">
                <SectionRow
                  icon={UserRound}
                  title="Info Pribadi"
                  subtitle="Lihat detail personal dan data karyawan"
                  onClick={() => setActiveView("personal-detail")}
                  delay="120ms"
                />

                <label
                  className={`profile-row-enter block w-full border-b border-slate-100 dark:border-[#30363d]/50 transition hover:bg-[#f8fbff] dark:hover:bg-[#30363d]/30 active:scale-[0.99] ${
                    isUploadingPhoto
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                  }`}
                  style={{ animationDelay: "160ms" }}
                >
                  <div className="flex w-full items-center gap-4 py-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] dark:bg-[#21262d] text-[#123c8c] dark:text-[#58a6ff]">
                      {isUploadingPhoto ? (
                        <Loader2 size={23} className="animate-spin" />
                      ) : (
                        <ImageIcon size={24} strokeWidth={2.7} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-base font-black text-slate-950 dark:text-white md:text-lg">
                        Foto Data Pribadi
                      </p>

                      <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-400 dark:text-slate-500">
                        {isUploadingPhoto
                          ? "Mengupload foto..."
                          : "Ubah foto profil akun"}
                      </p>
                    </div>

                    <Upload
                      size={24}
                      strokeWidth={2.8}
                      className="shrink-0 text-[#123c8c] dark:text-[#58a6ff]"
                    />
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={isUploadingPhoto}
                    onChange={(event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        void handleUploadProfilePhoto(file);
                      }

                      event.target.value = "";
                    }}
                  />
                </label>

                <SectionRow
                  icon={LockKeyhole}
                  title="Ubah Kata Sandi"
                  subtitle="Perbarui password akun"
                  onClick={openPasswordModal}
                  delay="200ms"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="profile-row-enter mt-20 flex h-14 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-base font-black text-[#123456] shadow-sm transition hover:-translate-y-0.5 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:mx-auto md:mt-12 md:max-w-sm"
              style={{ animationDelay: "240ms" }}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Keluar...
                </>
              ) : (
                <>
                  <LogOut size={19} strokeWidth={2.7} />
                  Keluar Akun
                </>
              )}
            </button>
          </section>
        )}

        {isEditProfileModalOpen ? (
          <div className="profile-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
            <div className="profile-modal-panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                    Edit Profil
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Ubah Detail Personal
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Hanya nama lengkap dan nomor telepon yang dapat diedit.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditProfileModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-[0.96]"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
                <div className="profile-row-enter">
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Nama Lengkap
                  </label>

                  <div className="relative">
                    <UserRound
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={editProfileForm.name}
                      onChange={(event) =>
                        setEditProfileForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Masukkan nama lengkap"
                      className="profile-field w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div
                  className="profile-row-enter"
                  style={{ animationDelay: "40ms" }}
                >
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Nomor Telepon
                  </label>

                  <div className="relative">
                    <Phone
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={editProfileForm.phone}
                      onChange={(event) =>
                        handlePhoneInputChange(event.target.value)
                      }
                      onPaste={(event) => {
                        const pastedText = event.clipboardData.getData("text");

                        if (/\D/.test(pastedText) || pastedText.length > 12) {
                          showProfileAlert(
                            "Nomor telepon tidak valid",
                            "Nomor telepon hanya boleh menggunakan angka tanpa spasi atau simbol, maksimal 12 digit.",
                            "warning",
                          );
                        }
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={12}
                      placeholder="Contoh: 081234567890"
                      className="profile-field w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="profile-row-enter">
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Tempat Lahir
                    </label>
                    <input
                      value={editProfileForm.birth_place}
                      onChange={(event) =>
                        setEditProfileForm((prev) => ({
                          ...prev,
                          birth_place: event.target.value,
                        }))
                      }
                      placeholder="Kota Lahir"
                      className="profile-field w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="profile-row-enter">
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={editProfileForm.birth_date}
                      onChange={(event) =>
                        setEditProfileForm((prev) => ({
                          ...prev,
                          birth_date: event.target.value,
                        }))
                      }
                      className="profile-field w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="profile-row-enter">
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      NIK (12 Digit)
                    </label>
                    <input
                      value={editProfileForm.nik}
                      onChange={(event) =>
                        setEditProfileForm((prev) => ({
                          ...prev,
                          nik: event.target.value.replace(/\D/g, "").substring(0, 12),
                        }))
                      }
                      placeholder="Contoh: 123456789012"
                      className="profile-field w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="profile-row-enter">
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Nomor Rekening
                    </label>
                    <input
                      value={editProfileForm.bank_account_number}
                      onChange={(event) =>
                        setEditProfileForm((prev) => ({
                          ...prev,
                          bank_account_number: event.target.value.replace(/\D/g, ""),
                        }))
                      }
                      placeholder="Masukkan nomor rekening"
                      className="profile-field w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div
                  className="profile-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 text-xs font-semibold leading-6 text-slate-500"
                  style={{ animationDelay: "80ms" }}
                >
                  Email, status, role, unit, divisi, jabatan, shift, dan kantor
                  terdaftar hanya dapat diubah oleh admin/owner.
                </div>

                <div
                  className="profile-row-enter flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end"
                  style={{ animationDelay: "120ms" }}
                >
                  <button
                    type="button"
                    onClick={closeEditProfileModal}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isUpdatingProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        {isPasswordModalOpen ? (
          <div className="profile-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
            <div className="profile-modal-panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                    Keamanan Akun
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Ubah Kata Sandi
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Gunakan kata sandi baru minimal 8 karakter.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-[0.96]"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
                <PasswordInput
                  label="Kata Sandi Lama"
                  value={passwordForm.current_password}
                  placeholder="Masukkan kata sandi lama"
                  show={showCurrentPassword}
                  onToggleShow={() => setShowCurrentPassword((prev) => !prev)}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      current_password: value,
                    }))
                  }
                />

                <PasswordInput
                  label="Kata Sandi Baru"
                  value={passwordForm.new_password}
                  placeholder="Minimal 8 karakter"
                  show={showNewPassword}
                  onToggleShow={() => setShowNewPassword((prev) => !prev)}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      new_password: value,
                    }))
                  }
                />

                <PasswordInput
                  label="Konfirmasi Kata Sandi Baru"
                  value={passwordForm.confirm_password}
                  placeholder="Ulangi kata sandi baru"
                  show={showConfirmPassword}
                  onToggleShow={() => setShowConfirmPassword((prev) => !prev)}
                  onChange={(value) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirm_password: value,
                    }))
                  }
                />

                <div className="profile-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 text-xs font-semibold leading-6 text-slate-500">
                  Setelah kata sandi berhasil diubah, gunakan kata sandi baru
                  untuk login berikutnya.
                </div>

                <div className="profile-row-enter flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <LockKeyhole size={18} />
                        Simpan Kata Sandi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

      {profileAlert && profileAlertTheme ? (
        <div
          className={`profile-toast-enter fixed right-4 top-4 z-[140] w-[calc(100vw-2rem)] max-w-md transition-all duration-300 ease-out md:right-7 md:top-7 ${
            isProfileAlertClosing
              ? "translate-x-8 scale-95 opacity-0"
              : "translate-x-0 scale-100 opacity-100"
          }`}
        >
          <div
            className={`overflow-hidden rounded-[2rem] border border-white/70 dark:border-[#21262d] bg-gradient-to-br ${profileAlertTheme.shell} shadow-2xl shadow-slate-900/20 backdrop-blur-xl transition-all duration-300 ease-out ${
              isProfileAlertClosing
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <div className="relative p-5">
              <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" />
              <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl" />

              <div className="relative flex items-start gap-4">
                <div
                  className={`profile-avatar-pop flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] ${profileAlertTheme.iconWrap} shadow-lg shadow-slate-300/40`}
                >
                  <ProfileAlertIcon size={32} strokeWidth={3} />
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div
                    className={`inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] ${profileAlertTheme.badge}`}
                  >
                    {profileAlertTheme.label}
                  </div>

                  <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950 dark:text-white">
                    {profileAlert.title}
                  </h3>

                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-400">
                    {profileAlert.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeProfileAlert}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 active:scale-[0.96]"
                >
                  <X size={22} strokeWidth={2.8} />
                </button>
              </div>
            </div>

            <div className="border-t border-white/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/90 p-4">
              <button
                type="button"
                onClick={closeProfileAlert}
                className={`w-full rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition active:scale-[0.98] ${profileAlertTheme.button}`}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      ) : null}

        <BottomNav />
      </main>
    </MobileShell>
  );
}
