"use client";

import {
  FormEvent,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  CreditCard,
  Image as ImageIcon,
  IdCard,
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
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import BankLogoBadge from "@/components/BankLogoBadge";
import { AppBankSelect } from "@/components/AppBankSelect";
import { getBankOption } from "@/lib/bank-options";
import {
  IDENTITY_VALIDATION,
  isValidBankAccountNumber,
  isValidNik,
  isValidPhoneNumber,
  normalizeDigits,
} from "@/lib/identity-validation";

type ShiftWorkSchedule = {
  day_of_week: string;
  is_work_day: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
};

type ProfileUser = {
  id: string;
  employee_code: string | null;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
  employment_status: string | null;
  employment_start_date: string | null;
  employment_end_date: string | null;
  birth_place: string | null;
  birth_date: string | null;
  bank_code: string | null;
  bank_name?: string | null;
  bank_account_number: string | null;
  nik: string | null;
  profile_photo: string | null;
  wfh_quota_monthly?: number | null;
  wfh_quota_used_monthly?: number | null;
  wfh_quota_remaining_monthly?: number | null;
  jabatan?: {
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
  bank_code: string;
  bank_account_number: string;
  nik: string;
};

type ProfileView = "menu" | "personal-detail";

type ProfileAlert = {
  type: "success" | "error" | "warning" | "info";
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
  bank_code: "",
  bank_account_number: "",
  nik: "",
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
    owner: "Pemilik",
    admin: "Admin",
    cs: "CS",
    employee: "Karyawan",
    OWNER: "Pemilik",
    ADMIN: "Admin",
    CS: "CS",
    EMPLOYEE: "Karyawan",
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

function formatEmploymentPeriod(user: ProfileUser) {
  const startDate = formatDate(user.employment_start_date);
  const endDate = formatDate(user.employment_end_date);

  if (startDate === "-" && endDate === "-") return "-";
  if (startDate === "-") return `Sampai ${endDate}`;
  if (endDate === "-") return `Mulai ${startDate}`;

  return `${startDate} - ${endDate}`;
}

function formatWfhQuota(value?: number | string | null) {
  const quota = Number(value || 0);

  return String(Number.isFinite(quota) ? Math.max(0, quota) : 0);
}

function formatWfhQuotaText(quotaMonthly?: number | string | null, quotaRemaining?: number | string | null) {
  const monthly = Number(quotaMonthly || 0);
  if (!monthly || monthly <= 0) {
    return "Tanpa Batas (Bebas WFH)";
  }
  const remaining = Math.max(0, Number(quotaRemaining ?? monthly));
  return `${remaining} hari tersisa dari ${monthly} hari/bulan`;
}

function formatDay(day: string) {
  return dayLabels[day] || day;
}

function normalizePhoneInput(value: string) {
  return normalizeDigits(value, IDENTITY_VALIDATION.phone.max);
}

function normalizeNumericInput(value: string) {
  return normalizeDigits(value);
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

function formatDateInput(value?: string | null) {
  if (!value) return "";

  return String(value).slice(0, 10);
}

function getProfileAlertTheme(type: NonNullable<ProfileAlert>["type"]) {
  if (type === "success") {
    return {
      shell: "from-emerald-50 via-white to-blue-50",
      iconWrap: "bg-emerald-100 text-emerald-600",
      badge: "text-emerald-600 bg-white/70",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20",
      icon: CheckCircle2,
      label: "BERHASIL",
    };
  }

  if (type === "error") {
    return {
      shell: "from-red-50 via-white to-blue-50",
      iconWrap: "bg-red-100 text-red-600",
      badge: "text-red-600 bg-white/70",
      button: "bg-red-600 hover:bg-red-700 shadow-red-900/20",
      icon: AlertTriangle,
      label: "GAGAL",
    };
  }

  if (type === "info") {
    return {
      shell: "from-blue-50 via-white to-blue-50",
      iconWrap: "bg-blue-100 text-[#123c8c]",
      badge: "text-[#123c8c] bg-white/70",
      button: "bg-[#123c8c] hover:bg-[#0f3274] shadow-blue-900/20",
      icon: ShieldCheck,
      label: "INFO",
    };
  }

  return {
    shell: "from-orange-50 via-white to-blue-50",
    iconWrap: "bg-orange-100 text-orange-600",
    badge: "text-orange-600 bg-white/70",
    button: "bg-[#526fae] hover:bg-[#46629d] shadow-blue-900/20",
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

      input[type="date"].profile-field {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        min-height: 48px;
        line-height: normal;
      }

      input[type="date"].profile-field::-webkit-date-and-time-value {
        text-align: left;
        min-height: 1.5em;
        margin: auto 0;
      }

      input[type="date"].profile-field::-webkit-calendar-picker-indicator {
        opacity: 0.6;
        cursor: pointer;
        padding: 4px;
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

  const photoSrc = user.profile_photo
    ? `${user.profile_photo}${user.profile_photo.includes("?") ? "&" : "?"}v=${Date.now()}`
    : null;

  return (
    <div
      className={`profile-avatar-pop flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf1ff] font-black text-[#123c8c] ring-4 ring-blue-100 ${sizeClass}`}
    >
      {photoSrc ? (
        <img
          key={user.profile_photo}
          src={photoSrc}
          alt={user.name}
          className="h-full w-full object-cover"
        />
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
  isLast?: boolean;
};

function SectionRow({
  icon: Icon,
  title,
  subtitle,
  onClick,
  delay = "0ms",
  isLast = false,
}: SectionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`profile-row-enter w-full transition hover:bg-[#f8fbff] active:scale-[0.99] ${isLast ? "" : "border-b border-slate-100"}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex w-full items-center gap-4 px-5 py-5 sm:px-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#123c8c]">
          <Icon size={24} strokeWidth={2.7} />
        </div>

        <div className="min-w-0 flex-1 text-left">
          <p className="text-base font-black text-slate-950 md:text-lg">
            {title}
          </p>

          {subtitle ? (
            <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>

        <ChevronRight
          size={24}
          strokeWidth={2.8}
          className="shrink-0 text-[#123c8c]"
        />
      </div>
    </button>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
  content?: ReactNode;
  icon?: LucideIcon;
  delay?: string;
};

function DetailItem({
  label,
  value,
  content,
  icon: Icon,
  delay = "0ms",
}: DetailItemProps) {
  return (
    <div
      className="profile-row-enter rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-slate-200/40 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 md:p-6"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start gap-4">
        {Icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#123c8c]">
            <Icon size={22} strokeWidth={2.7} />
          </div>
        ) : null}

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-400">{label}</p>
          <div className="mt-2 break-words text-lg font-black leading-7 text-[#123456]">
            {content || value || "-"}
          </div>
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

type ProfilPageContentProps = {
  initialView?: ProfileView;
};

export function ProfilPageContent({
  initialView = "menu",
}: ProfilPageContentProps = {}) {
  const router = useRouter();

  const [activeView, setActiveView] = useState<ProfileView>(initialView);

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
        "Nomor telepon hanya boleh menggunakan angka tanpa spasi atau simbol, 10 sampai 13 digit.",
        "warning",
      );
    }

    setEditProfileForm((prev) => ({
      ...prev,
      phone: normalizedPhone,
    }));
  }

  function handleNumericProfileInputChange(
    field: "bank_account_number" | "nik",
    value: string,
  ) {
    const maxLength = field === "nik" ? 16 : 16;
    const normalizedValue = normalizeNumericInput(value).slice(0, maxLength);

    if (value !== normalizedValue) {
      showProfileAlert(
        field === "nik" ? "NIK tidak valid" : "No rekening tidak valid",
        field === "nik"
          ? "NIK harus berupa angka dan berjumlah tepat 16 digit."
          : "No rekening harus berupa angka dengan panjang 10 sampai 16 digit.",
        "warning",
      );
    }

    setEditProfileForm((prev) => ({
      ...prev,
      [field]: normalizedValue,
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

      if (response.status === 401) {
        router.push("/login");
        return;
      }

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
      birth_place: user.birth_place || "",
      birth_date: formatDateInput(user.birth_date),
      bank_code: user.bank_code || "",
      bank_account_number: user.bank_account_number || "",
      nik: user.nik || "",
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
    const bankAccountNumber = editProfileForm.bank_account_number.trim();
    const bankCode = editProfileForm.bank_code;
    const nik = editProfileForm.nik.trim();

    if (!name) {
      showProfileAlert(
        "Nama wajib diisi",
        "Nama lengkap tidak boleh kosong.",
        "warning",
      );
      return;
    }

    if (!phone) {
      showProfileAlert(
        "Nomor telepon wajib diisi",
        "Nomor telepon harus berisi angka dengan panjang 10 sampai 13 digit.",
        "warning",
      );
      return;
    }

    if (!isValidPhoneNumber(phone)) {
      showProfileAlert(
        "Nomor telepon tidak valid",
        "Nomor telepon hanya boleh berisi angka tanpa spasi, dengan panjang 10 sampai 13 digit.",
        "warning",
      );
      return;
    }

    if (nik && !isValidNik(nik)) {
      showProfileAlert(
        "NIK tidak valid",
        "NIK harus berupa angka dan berjumlah tepat 16 digit.",
        "warning",
      );
      return;
    }

    if (bankAccountNumber && !isValidBankAccountNumber(bankAccountNumber)) {
      showProfileAlert(
        "No rekening tidak valid",
        "No rekening harus berupa angka dengan panjang 10 sampai 16 digit.",
        "warning",
      );
      return;
    }

    try {
      setIsUpdatingProfile(true);

      const response = await fetch("/api/profil", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          birth_place: editProfileForm.birth_place.trim(),
          birth_date: editProfileForm.birth_date,
          bank_code: bankCode,
          bank_account_number: bankAccountNumber,
          nik,
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
            birth_place:
              data.user?.birth_place ?? editProfileForm.birth_place.trim(),
            birth_date: data.user?.birth_date ?? editProfileForm.birth_date,
            bank_code: data.user?.bank_code ?? bankCode,
            bank_account_number:
              data.user?.bank_account_number ?? bankAccountNumber,
            nik: data.user?.nik ?? nik,
          }
          : currentUser,
      );

      showProfileAlert(
        "Profil berhasil diperbarui",
        "Data profil berhasil disimpan.",
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

      window.localStorage.removeItem("presensi_read_announcement_id");
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

      if (file.size > 5 * 1024 * 1024) {
        showProfileAlert(
          "Foto terlalu besar",
          "Ukuran foto maksimal 5MB.",
          "warning",
        );
        return;
      }

      setIsUploadingPhoto(true);

      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch("/api/profil/photo", {
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

      const uploadedPhoto =
        data.user?.profile_photo || data.photoUrl || data.profilePhoto || data.photo;

      if (uploadedPhoto) {
        setUser((currentUser) =>
          currentUser
            ? {
              ...currentUser,
              profile_photo: uploadedPhoto,
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
        "Password baru dan konfirmasi password harus sama.",
        "warning",
      );
      return;
    }

    try {
      setIsChangingPassword(true);

      const response = await fetch("/api/profil/change-password", {
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

  const initials = user?.name ? getInitials(user.name) : "";

  const subtitleInfo = useMemo(() => {
    if (!user) return "";

    return [].filter(Boolean).join(" • ");
  }, [user]);

  const workSchedule = useMemo(() => {
    return getActiveScheduleText(user?.shift?.work_schedules);
  }, [user?.shift?.work_schedules]);

  const headerRightLabel = user?.shift?.name || undefined;

  const detailSections = useMemo(() => {
    if (!user) return [];

    const bankOption = getBankOption(user.bank_name || user.bank_code);
    const bankName = bankOption?.name || user.bank_name || user.bank_code || "-";

    return [
      {
        title: "Informasi Utama & Kontak",
        icon: UserRound,
        items: [
          { label: "Nama Lengkap", value: user.name, icon: UserRound },
          {
            label: "No Induk Karyawan",
            value: user.employee_code || "-",
            icon: IdCard,
          },
          { label: "Email", value: user.email, icon: Mail },
          { label: "Nomor Telepon", value: user.phone || "-", icon: Phone },
          {
            label: "Role Akun",
            value: formatRole(user.role),
            icon: ShieldCheck,
          },
          {
            label: "Status Akun",
            value: formatStatus(user.status),
            icon: BadgeCheck,
          },
        ],
      },
      {
        title: "Pekerjaan & Penempatan",
        icon: Building2,
        items: [
          {
            label: "Kantor Terdaftar",
            value: user.registered_office?.name || "-",
            icon: MapPin,
          },
          {
            label: "Divisi",
            value: user.department?.name || "-",
            icon: Network,
          },
          {
            label: "Jabatan",
            value: user.jabatan?.name || "-",
            icon: Building2,
          },
          {
            label: "Posisi",
            value: user.position?.name || "-",
            icon: BriefcaseBusiness,
          },
          {
            label: "Shift",
            value: user.shift?.name || "-",
            icon: CalendarDays,
          },
          { label: "Jam Kerja", value: workSchedule || "-", icon: Clock3 },
          {
            label: "Alamat Kantor",
            value: user.registered_office?.address || "-",
            icon: MapPin,
          },
        ],
      },
      {
        title: "Status Kepegawaian & Presensi",
        icon: BriefcaseBusiness,
        items: [
          {
            label: "Status Kepegawaian",
            value: user.employment_status || "-",
            icon: BadgeCheck,
          },
          {
            label: "Masa Kerja",
            value: formatEmploymentPeriod(user),
            icon: CalendarDays,
          },
          {
            label: "Kuota WFH Bulanan",
            value: formatWfhQuotaText(
              user.wfh_quota_monthly,
              user.wfh_quota_remaining_monthly,
            ),
            icon: BriefcaseBusiness,
          },
        ],
      },
      {
        title: "Kelahiran, Identitas & Bank Payroll",
        icon: CreditCard,
        items: [
          {
            label: "Tempat Lahir",
            value: user.birth_place || "-",
            icon: MapPin,
          },
          {
            label: "Tanggal Lahir",
            value: formatDate(user.birth_date),
            icon: CalendarDays,
          },
          { label: "NIK (16 Digit)", value: user.nik || "-", icon: IdCard },
          {
            label: "Nama Bank Payroll",
            value: bankName,
            content: (
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800">{bankName}</span>
                {user.bank_code || user.bank_name ? (
                  <BankLogoBadge
                    bankCode={user.bank_name || user.bank_code}
                    compact
                  />
                ) : null}
              </div>
            ),
            icon: Building2,
          },
          {
            label: "No Rekening",
            value: user.bank_account_number || "-",
            content: (
              <BankLogoBadge
                bankCode={user.bank_name || user.bank_code}
                accountNumber={user.bank_account_number}
              />
            ),
            icon: CreditCard,
          },
        ],
      },
    ];
  }, [user, workSchedule]);

  const profileAlertTheme = profileAlert
    ? getProfileAlertTheme(profileAlert.type)
    : null;
  const ProfileAlertIcon = profileAlertTheme?.icon || AlertTriangle;
  const isDetailRoute = initialView === "personal-detail";
  const handleBackToMenu = () => {
    if (isDetailRoute) {
      router.push("/profil");
      return;
    }

    setActiveView("menu");
  };

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <ProfileMotionStyles />

      <div className="hidden md:block">
        <AppHeader
          title={
            activeView === "personal-detail" ? "Detail Personal" : "Profil"
          }
          rightLabel={headerRightLabel}
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-white pb-28 text-slate-950 md:bg-gradient-to-br md:from-[#f6f8ff] md:via-white md:to-[#eef4ff]">
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
            <div className="flex items-center gap-4 md:hidden">
              <button
                type="button"
                onClick={handleBackToMenu}
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-[#123456] shadow-sm shadow-slate-200 transition active:scale-[0.96]"
              >
                <ArrowLeft size={25} strokeWidth={2.8} />
              </button>

              <h1 className="text-xl font-black text-[#123456]">
                Info Pribadi
              </h1>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <button
                type="button"
                onClick={handleBackToMenu}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#123456] shadow-sm shadow-slate-200 transition hover:-translate-y-0.5 hover:bg-[#f8fbff] active:scale-[0.96]"
              >
                <ArrowLeft size={25} strokeWidth={2.8} />
              </button>

              <div>
                <h1 className="mt-1 text-3xl font-black text-[#123456]">
                  Info Pribadi
                </h1>
              </div>
            </div>

            <div
              className="profile-row-enter mt-10 flex flex-col items-center md:mt-8"
              style={{ animationDelay: "60ms" }}
            >
              <ProfileAvatar user={user} initials={initials} size="md" />

              <h2 className="mt-5 text-center text-2xl font-black text-[#123456] md:text-3xl">
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

            <div className="mt-8 space-y-6">
              {detailSections.map((section) => {
                const SectionIcon = section.icon;
                return (
                  <div
                    key={section.title}
                    className="rounded-3xl border border-blue-100/80 bg-white/90 p-5 shadow-lg shadow-blue-950/5 backdrop-blur-md md:p-6"
                  >
                    <div className="mb-4 flex items-center gap-2.5 text-xs font-black uppercase tracking-wider text-[#123c8c]">
                      <SectionIcon size={16} strokeWidth={2.5} />
                      {section.title}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {section.items.map((item, index) => (
                        <DetailItem
                          key={item.label}
                          label={item.label}
                          value={item.value}
                          content={item.content}
                          icon={item.icon}
                          delay={`${index * 40}ms`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="profile-enter mx-auto max-w-5xl px-5 pt-5 md:px-10 md:pt-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="profile-avatar-pop flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-white shadow-xl shadow-blue-900/30">
                <UserRound size={30} strokeWidth={2.7} />
              </div>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#123456] md:text-4xl">
                Akun
              </h1>
            </div>

            <button
              type="button"
              onClick={() => router.push("/kartu-identitas")}
              className="profile-row-enter mt-6 flex w-full items-center gap-5 rounded-[2rem] border border-blue-100 bg-white p-5 text-left shadow-xl shadow-slate-200/50 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-300/60 active:scale-[0.99] sm:p-6"
              style={{ animationDelay: "60ms" }}
            >
              <ProfileAvatar user={user} initials={initials} size="sm" />

              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-black text-[#123456] md:text-3xl">
                  {user.name}
                </h2>

                <p className="mt-1 truncate text-base font-semibold text-slate-400 md:text-lg">
                  {subtitleInfo || formatRole(user.role)}
                </p>
              </div>

              <ChevronRight
                size={26}
                strokeWidth={2.8}
                className="shrink-0 text-[#123c8c]"
              />
            </button>

            <div
              className="profile-row-enter mt-5 grid grid-cols-3 overflow-hidden rounded-[1.8rem] border border-blue-100 bg-white text-center shadow-xl shadow-slate-200/50"
              style={{ animationDelay: "85ms" }}
            >
              <div className="flex flex-col items-center justify-center border-r border-blue-50 px-4 py-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Kuota WFH
                </p>
                <p className="mt-1 text-base font-black text-[#123456]">
                  {Number(user.wfh_quota_monthly || 0) > 0
                    ? `${user.wfh_quota_monthly} Hari`
                    : "Bebas WFH"}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center border-r border-blue-50 px-4 py-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Terpakai
                </p>
                <p className="mt-1 text-lg font-black text-[#123456]">
                  {formatWfhQuota(user.wfh_quota_used_monthly)}
                </p>
              </div>

              <div className="flex flex-col items-center justify-center px-4 py-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Sisa
                </p>
                <p className="mt-1 text-lg font-black text-[#123c8c]">
                  {formatWfhQuota(user.wfh_quota_remaining_monthly)}
                </p>
              </div>
            </div>

            <div
              className="profile-row-enter mt-10"
              style={{ animationDelay: "100ms" }}
            >

              <div className="mt-4 overflow-hidden rounded-[1.8rem] border border-blue-100/80 bg-white shadow-xl shadow-slate-200/50">
                <SectionRow
                  icon={UserRound}
                  title="Info Pribadi"
                  onClick={() => router.push(`/profil/${user.id}`)}
                  delay="120ms"
                />

                <label
                  className={`profile-row-enter block w-full border-b border-slate-100 transition hover:bg-[#f8fbff] active:scale-[0.99] ${isUploadingPhoto
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                    }`}
                  style={{ animationDelay: "160ms" }}
                >
                  <div className="flex w-full items-center gap-4 px-5 py-5 sm:px-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#123c8c]">
                      {isUploadingPhoto ? (
                        <Loader2 size={23} className="animate-spin" />
                      ) : (
                        <ImageIcon size={24} strokeWidth={2.7} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-base font-black text-slate-950 md:text-lg">
                        Foto Data Pribadi
                      </p>

                      <p className="mt-1 line-clamp-1 text-sm font-semibold text-slate-400">
                        {isUploadingPhoto
                          ? "Mengupload foto..."
                          : "Ubah foto profil akun"}
                      </p>
                    </div>

                    <Upload
                      size={24}
                      strokeWidth={2.8}
                      className="shrink-0 text-[#123c8c]"
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
                  onClick={openPasswordModal}
                  delay="200ms"
                  isLast
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
          <div className="profile-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 md:items-center md:pb-0">
            <div className="profile-modal-panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                    Edit Profil
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Ubah Info Pribadi
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeEditProfileModal}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-[0.96]"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleUpdateProfile}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    (event.target as HTMLElement).tagName === "INPUT"
                  ) {
                    event.preventDefault();
                  }
                }}
                className="mt-6 space-y-5"
              >
                {/* GRUP 1: INFORMASI UTAMA */}
                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-[#123c8c] flex items-center gap-2">
                    <UserRound size={15} />
                    Informasi Utama & Foto Profil
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black text-slate-700">
                      Foto Profil
                    </label>
                    <div className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-white p-3">
                      {user ? (
                        <ProfileAvatar user={user} initials={initials} size="sm" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#123c8c] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#0f3274] active:scale-[0.97]">
                          {isUploadingPhoto ? (
                            <>
                              <Loader2 size={15} className="animate-spin" />
                              Mengupload...
                            </>
                          ) : (
                            <>
                              <Upload size={15} />
                              Pilih Foto Baru
                            </>
                          )}
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
                        <p className="mt-1.5 text-[11px] font-semibold text-slate-400">
                          Format JPG, PNG, atau WEBP (maks. 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black text-slate-700">
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
                        className="profile-field w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black text-slate-700">
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
                          const pastedText =
                            event.clipboardData.getData("text");
                          if (/\D/.test(pastedText) || pastedText.length > 13) {
                            showProfileAlert(
                              "Nomor telepon tidak valid",
                              "Nomor telepon hanya boleh menggunakan angka tanpa spasi atau simbol, 10 sampai 13 digit.",
                              "warning",
                            );
                          }
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={13}
                        placeholder="Contoh: 081234567890"
                        className="profile-field w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* GRUP 2: KELAHIRAN & IDENTITAS */}
                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-[#123c8c] flex items-center gap-2">
                    <IdCard size={15} />
                    Kelahiran & NIK
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">
                        Tempat Lahir
                      </label>
                      <div className="relative">
                        <MapPin
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={editProfileForm.birth_place}
                          onChange={(event) =>
                            setEditProfileForm((prev) => ({
                              ...prev,
                              birth_place: event.target.value,
                            }))
                          }
                          placeholder="Contoh: Jakarta"
                          className="profile-field w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">
                        Tanggal Lahir
                      </label>
                      <div className="relative">
                        <CalendarDays
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="date"
                          value={editProfileForm.birth_date}
                          onChange={(event) =>
                            setEditProfileForm((prev) => ({
                              ...prev,
                              birth_date: event.target.value,
                            }))
                          }
                          className="profile-field w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black text-slate-700">
                      NIK (16 Digit)
                    </label>
                    <div className="relative">
                      <IdCard
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={editProfileForm.nik}
                        onChange={(event) =>
                          handleNumericProfileInputChange(
                            "nik",
                            event.target.value,
                          )
                        }
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={16}
                        placeholder="Masukkan NIK"
                        className="profile-field w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>

                {/* GRUP 3: REKENING & BANK */}
                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 space-y-4">
                  <div className="text-xs font-black uppercase tracking-wider text-[#123c8c] flex items-center gap-2">
                    <CreditCard size={15} />
                    Rekening Payroll & Bank
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <AppBankSelect
                      label="Nama Bank"
                      value={editProfileForm.bank_code}
                      onChange={(val) =>
                        setEditProfileForm((prev) => ({
                          ...prev,
                          bank_code: val,
                        }))
                      }
                    />

                    <div>
                      <label className="mb-2 block text-xs font-black text-slate-700">
                        No Rekening
                      </label>
                      <div className="relative">
                        <CreditCard
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={editProfileForm.bank_account_number}
                          onChange={(event) =>
                            handleNumericProfileInputChange(
                              "bank_account_number",
                              event.target.value,
                            )
                          }
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={16}
                          placeholder="Masukkan no rekening"
                          className="profile-field w-full rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="profile-row-enter flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end"
                  style={{ animationDelay: "280ms" }}
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
          <div className="profile-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 md:items-center md:pb-0">
            <div className="profile-modal-panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                    Keamanan Akun
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Ubah Kata Sandi
                  </h2>
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
            className={`profile-toast-enter fixed right-4 top-4 z-[140] w-[calc(100vw-2rem)] max-w-md transition-all duration-300 ease-out md:right-7 md:top-7 ${isProfileAlertClosing
              ? "translate-x-8 scale-95 opacity-0"
              : "translate-x-0 scale-100 opacity-100"
              }`}
          >
            <div
              className={`overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br ${profileAlertTheme.shell} shadow-2xl shadow-slate-900/20 backdrop-blur-xl transition-all duration-300 ease-out ${isProfileAlertClosing
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100"
                }`}
            >
              <div className="relative p-5">
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

                    <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
                      {profileAlert.title}
                    </h3>

                    <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                      {profileAlert.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeProfileAlert}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 active:scale-[0.96]"
                  >
                    <X size={22} strokeWidth={2.8} />
                  </button>
                </div>
              </div>

              <div className="border-t border-white/60 bg-white/70 p-4">
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

export default function ProfilePage() {
  return <ProfilPageContent />;
}
