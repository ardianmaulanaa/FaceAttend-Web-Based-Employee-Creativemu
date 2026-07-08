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
  Eye,
  EyeOff,
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
  employee_code: string | null;
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

function getActiveScheduleText(schedules?: ShiftWorkSchedule[]) {
  if (!schedules || schedules.length === 0) return "";

  const activeSchedules = schedules.filter(
    (schedule) =>
      schedule.is_work_day &&
      schedule.check_in_time &&
      schedule.check_out_time
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
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf1ff] font-black text-[#123c8c] ring-4 ring-blue-100 ${sizeClass}`}
    >
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
  );
}

type SectionRowProps = {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  onClick?: () => void;
};

function SectionRow({ icon: Icon, title, subtitle, onClick }: SectionRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full border-b border-slate-100 transition active:scale-[0.99]"
    >
      <div className="flex w-full items-center gap-4 py-5">
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
  icon?: LucideIcon;
};

function DetailItem({ label, value, icon: Icon }: DetailItemProps) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm shadow-slate-200/40 md:p-6">
      <div className="flex items-start gap-4">
        {Icon ? (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eef5ff] text-[#123c8c]">
            <Icon size={22} strokeWidth={2.7} />
          </div>
        ) : null}

        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-400">{label}</p>
          <p className="mt-2 break-words text-lg font-black leading-7 text-[#123456]">
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
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 pr-12 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
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
      icon: Info,
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

export default function ProfilePage() {
  const router = useRouter();

  const [activeView, setActiveView] = useState<ProfileView>("menu");

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] =
    useState<EditProfileForm>(initialEditProfileForm);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(initialPasswordForm);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileAlert, setProfileAlert] = useState<ProfileAlert>(null);
  const [isAlertClosing, setIsAlertClosing] = useState(false);
  const alertCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showProfileAlert = useCallback(
    (
      title: string,
      message: string,
      type: "warning" | "success" | "error" | "info" = "warning"
    ) => {
      if (alertCloseTimeoutRef.current) {
        clearTimeout(alertCloseTimeoutRef.current);
      }

      setIsAlertClosing(false);

      setProfileAlert({
        type,
        title,
        message,
      });
    },
    []
  );

  const closeProfileAlert = useCallback(() => {
    setIsAlertClosing(true);

    alertCloseTimeoutRef.current = setTimeout(() => {
      setProfileAlert(null);
      setIsAlertClosing(false);
    }, 200);
  }, []);

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
          data.error || data.message || "Gagal mengambil profil."
        );
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

  function openEditProfileModal() {
    if (!user) return;

    setEditProfileForm({
      name: user.name || "",
      phone: user.phone || "",
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

    if (!name) {
      showProfileAlert("Data belum lengkap", "Nama lengkap wajib diisi.", "warning");
      return;
    }

    if (name.split(/\s+/).filter(Boolean).length < 2) {
      showProfileAlert("Nama tidak lengkap", "Nama lengkap harus terdiri dari minimal 2 kata.", "warning");
      return;
    }

    if (phone && (phone.length !== 12 || !/^\d+$/.test(phone))) {
      showProfileAlert("Nomor telepon tidak valid", "Nomor telepon harus terdiri dari tepat 12 digit angka dan tidak ada spasi.", "warning");
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
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        showProfileAlert("Gagal", data.message || data.error || "Gagal memperbarui profil.", "error");
        return;
      }

      setUser((currentUser) =>
        currentUser
          ? {
            ...currentUser,
            name: data.user?.name || name,
            phone: data.user?.phone || phone || null,
          }
          : currentUser
      );

      showProfileAlert("Sukses", "Profil berhasil diperbarui.", "success");
      closeEditProfileModal();
    } catch (error) {
      console.error("UPDATE_PROFILE_ERROR:", error);
      showProfileAlert("Gagal", "Gagal memperbarui profil.", "error");
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
        showProfileAlert("Format file salah", "File harus berupa gambar.", "warning");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        showProfileAlert("File terlalu besar", "Ukuran foto maksimal 2MB.", "warning");
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
        showProfileAlert("Gagal", data.error || data.message || "Gagal upload foto profil.", "error");
        return;
      }

      if (data.user?.profile_photo) {
        setUser((currentUser) =>
          currentUser
            ? {
              ...currentUser,
              profile_photo: data.user.profile_photo,
            }
            : currentUser
        );
      }

      showProfileAlert("Sukses", "Foto profil berhasil diperbarui.", "success");
    } catch (error) {
      console.error("UPLOAD_PROFILE_PHOTO_ERROR:", error);
      showProfileAlert("Gagal", "Gagal upload foto profil.", "error");
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
      showProfileAlert("Data belum lengkap", "Semua field password wajib diisi.", "warning");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      showProfileAlert("Password terlalu pendek", "Password baru minimal 8 karakter.", "warning");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showProfileAlert("Password tidak cocok", "Konfirmasi password tidak sama.", "warning");
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
          data.error || data.message || "Gagal mengubah password."
        );
      }

      showProfileAlert("Sukses", "Password berhasil diperbarui.", "success");
      closePasswordModal();
    } catch (error) {
      console.error("CHANGE_PASSWORD_ERROR:", error);

      showProfileAlert("Gagal", error instanceof Error ? error.message : "Gagal mengubah password.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  }

  useEffect(() => {
    loadProfile();
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

  const headerRightLabel = user?.employee_code || user?.shift?.name || undefined;

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
        label: "Kode Karyawan",
        value: user.employee_code || "-",
        icon: IdCard,
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
        label: "Unit Kerja",
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

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <div className="hidden md:block">
        <AppHeader
          title={activeView === "personal-detail" ? "Detail Personal" : "Profile"}
          subtitle={
            activeView === "personal-detail"
              ? "Informasi lengkap data karyawan"
              : "Pengaturan akun dan data pribadi"
          }
          rightLabel={headerRightLabel}
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-white pb-28 text-slate-950 md:bg-gradient-to-br md:from-[#f6f8ff] md:via-white md:to-[#eef4ff]">
        {loading ? (
          <section className="mx-auto max-w-5xl px-5 pt-8 md:px-10">
            <div className="flex items-center gap-3 rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 text-sm font-bold text-slate-500">
              <Loader2 size={20} className="animate-spin text-[#123c8c]" />
              Mengambil data profil...
            </div>
          </section>
        ) : errorMessage || !user ? (
          <section className="mx-auto max-w-5xl px-5 pt-8 md:px-10">
            <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-8 text-center">
              <p className="text-sm font-black text-red-700">
                {errorMessage || "Profil tidak ditemukan."}
              </p>
            </div>
          </section>
        ) : activeView === "personal-detail" ? (
          <section className="mx-auto max-w-5xl px-5 pt-5 md:px-10 md:pt-8">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5 md:hidden">
              <button
                type="button"
                onClick={() => setActiveView("menu")}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#123456] transition active:scale-[0.96]"
              >
                <ArrowLeft size={25} strokeWidth={2.8} />
              </button>

              <h1 className="text-xl font-black text-[#123456]">
                Detail Personal
              </h1>
            </div>

            <div className="hidden items-center gap-4 md:flex">
              <button
                type="button"
                onClick={() => setActiveView("menu")}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#123456] shadow-sm shadow-slate-200 transition active:scale-[0.96]"
              >
                <ArrowLeft size={25} strokeWidth={2.8} />
              </button>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Data Pribadi
                </p>

                <h1 className="mt-1 text-3xl font-black text-[#123456]">
                  Detail Personal
                </h1>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center md:mt-8">
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
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98]"
              >
                <Pencil size={17} strokeWidth={2.7} />
                Edit Detail
              </button>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {detailItems.map((item) => (
                <DetailItem
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="mx-auto max-w-5xl px-5 pt-5 md:px-10 md:pt-8">
            <div className="rounded-[1.7rem] border border-blue-100 bg-[#f8fbff] p-5 shadow-sm shadow-blue-100/60 md:rounded-[2rem] md:bg-white md:p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-white">
                  <UserRound size={24} strokeWidth={2.7} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                    Profile
                  </p>

                  <h1 className="mt-1 text-2xl font-black tracking-tight text-[#123456] md:text-3xl">
                    Akun
                  </h1>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-5 rounded-[2rem] bg-white md:border md:border-blue-100 md:p-6 md:shadow-xl md:shadow-slate-200/50">
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

            <div className="mt-12 md:mt-10">
              <h3 className="text-xl font-black text-slate-950">
                Data Pribadi
              </h3>

              <div className="mt-5 overflow-hidden rounded-[1.8rem] bg-white md:border md:border-blue-100 md:p-2 md:shadow-xl md:shadow-slate-200/50">
                <SectionRow
                  icon={UserRound}
                  title="Info Pribadi"
                  subtitle="Lihat detail personal dan data karyawan"
                  onClick={() => setActiveView("personal-detail")}
                />

                <label
                  className={`block w-full border-b border-slate-100 transition active:scale-[0.99] ${isUploadingPhoto
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer"
                    }`}
                >
                  <div className="flex w-full items-center gap-4 py-5">
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
                        handleUploadProfilePhoto(file);
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
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-20 flex h-14 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white text-base font-black text-[#123456] shadow-sm transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:mx-auto md:mt-12 md:max-w-sm"
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
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
            <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition active:scale-[0.96]"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="mt-6 space-y-4">
                <div>
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
                      className="w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                      value={editProfileForm.phone}
                      onChange={(event) =>
                        setEditProfileForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="Contoh: 081234567890"
                      className="w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 text-xs font-semibold leading-6 text-slate-500">
                  Email, kode karyawan, status, role, unit, divisi, jabatan,
                  shift, dan kantor terdaftar hanya dapat diubah oleh admin.
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={closeEditProfileModal}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
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
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
            <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 md:p-7">
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition active:scale-[0.96]"
                >
                  ×
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

                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 text-xs font-semibold leading-6 text-slate-500">
                  Setelah kata sandi berhasil diubah, gunakan kata sandi baru
                  untuk login berikutnya.
                </div>

                <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={closePasswordModal}
                    className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
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

      {profileAlert ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-all duration-300 ${
            isAlertClosing ? "animate-fadeOut" : "animate-fadeIn"
          }`}
        >
          <div
            className={`w-full max-w-md overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br p-0 shadow-2xl transition-all duration-300 md:max-w-lg ${
              isAlertClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
            } ${getAlertTheme(profileAlert.type).shell}`}
          >
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                    getAlertTheme(profileAlert.type).iconWrap
                  }`}
                >
                  {(() => {
                    const AlertIcon = getAlertTheme(profileAlert.type).icon;
                    return <AlertIcon size={32} strokeWidth={3} />;
                  })()}
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div
                    className={`inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] ${
                      getAlertTheme(profileAlert.type).badge
                    }`}
                  >
                    {getAlertTheme(profileAlert.type).label}
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
                className={`w-full rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition active:scale-[0.98] ${
                  getAlertTheme(profileAlert.type).button
                }`}
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
