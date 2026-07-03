"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Eye,
  EyeOff,
  IdCard,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Network,
  Phone,
  ShieldCheck,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

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

type InfoCardItem = {
  label: string;
  value: string;
  description?: string;
  icon: LucideIcon;
};

type PasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

const initialPasswordForm: PasswordForm = {
  current_password: "",
  new_password: "",
  confirm_password: "",
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
      schedule.check_out_time,
  );

  if (activeSchedules.length === 0) return "";

  const firstSchedule = activeSchedules[0];

  return `${formatDay(firstSchedule.day_of_week)} • ${
    firstSchedule.check_in_time
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

function InfoCard({ item }: { item: InfoCardItem }) {
  const Icon = item.icon;

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
          <Icon size={22} strokeWidth={2.7} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {item.label}
          </p>

          <p className="mt-1 break-words text-base font-black text-slate-950">
            {item.value}
          </p>

          {item.description ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              {item.description}
            </p>
          ) : null}
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
          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 pr-12 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-[#123c8c]"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] =
    useState<PasswordForm>(initialPasswordForm);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  async function handleUploadProfilePhoto(file: File) {
    try {
      if (!file.type.startsWith("image/")) {
        alert("File harus berupa gambar.");
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB.");
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
        alert(data.error || data.message || "Gagal upload foto profil.");
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

      alert("Foto profil berhasil diperbarui.");
    } catch (error) {
      console.error("UPLOAD_PROFILE_PHOTO_ERROR:", error);
      alert("Gagal upload foto profil.");
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
      alert("Semua field password wajib diisi.");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      alert("Password baru minimal 8 karakter.");
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      alert("Konfirmasi password tidak sama.");
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

      alert("Password berhasil diperbarui.");
      closePasswordModal();
    } catch (error) {
      console.error("CHANGE_PASSWORD_ERROR:", error);

      alert(
        error instanceof Error ? error.message : "Gagal mengubah password.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  if (!authUser) return null;

  const subtitleInfo = useMemo(() => {
    if (!user) return "";

    return [
      cleanValue(user.employee_code),
      cleanValue(user.unit?.name),
      cleanValue(user.department?.name),
      cleanValue(user.position?.name),
    ]
      .filter(Boolean)
      .join(" • ");
  }, [user]);

  const workSchedule = useMemo(() => {
    return getActiveScheduleText(user?.shift?.work_schedules);
  }, [user?.shift?.work_schedules]);

  const infoCards = useMemo(() => {
    if (!user) return [];

    const items: InfoCardItem[] = [];

    if (cleanValue(user.employee_code)) {
      items.push({
        label: "Kode Karyawan",
        value: user.employee_code || "",
        icon: IdCard,
      });
    }

    if (cleanValue(user.email)) {
      items.push({
        label: "Email",
        value: user.email,
        icon: Mail,
      });
    }

    if (cleanValue(user.phone)) {
      items.push({
        label: "Nomor Telepon",
        value: user.phone || "",
        icon: Phone,
      });
    }

    if (cleanValue(user.unit?.name)) {
      items.push({
        label: "Unit",
        value: user.unit?.name || "",
        icon: Building2,
      });
    }

    if (cleanValue(user.department?.name)) {
      items.push({
        label: "Divisi",
        value: user.department?.name || "",
        icon: Network,
      });
    }

    if (cleanValue(user.position?.name)) {
      items.push({
        label: "Jabatan",
        value: user.position?.name || "",
        icon: BriefcaseBusiness,
      });
    }

    if (cleanValue(user.role)) {
      items.push({
        label: "Role Akun",
        value: formatRole(user.role),
        icon: ShieldCheck,
      });
    }

    if (cleanValue(user.shift?.name)) {
      items.push({
        label: "Shift",
        value: user.shift?.name || "",
        description:
          user.shift?.tolerance_minutes !== undefined
            ? `Toleransi telat ${user.shift.tolerance_minutes} menit`
            : "",
        icon: CalendarDays,
      });
    }

    if (workSchedule) {
      items.push({
        label: "Jam Kerja",
        value: workSchedule,
        description: "Jadwal aktif berdasarkan data shift.",
        icon: Clock3,
      });
    }

    if (cleanValue(user.registered_office?.name)) {
      items.push({
        label: "Kantor Terdaftar",
        value: user.registered_office?.name || "",
        description: cleanValue(user.registered_office?.address),
        icon: MapPin,
      });
    }

    return items;
  }, [user, workSchedule]);

  if (loading) {
    return (
      <MobileShell variant="employee">
        <AppHeader
          title="Profile"
          subtitle="Informasi akun karyawan"
          rightLabel="Loading"
        />

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

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Profile"
        subtitle="Informasi akun karyawan"
        rightLabel={user.employee_code || "Profile"}
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-xl shadow-slate-300/30">
          <div className="bg-[#123c8c] p-6 text-white md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] bg-white text-4xl font-black text-[#123c8c] shadow-xl shadow-blue-950/25 sm:mx-0">
                  {user.profile_photo ? (
                    <img
                      src={user.profile_photo}
                      alt={user.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}

                  <div className="absolute inset-0 ring-1 ring-inset ring-white/30" />
                </div>

                <div className="text-center sm:text-left">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                    Employee Profile
                  </p>

                  <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                    {user.name}
                  </h1>

                  {subtitleInfo ? (
                    <p className="mt-2 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
                      {subtitleInfo}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                      <BadgeCheck size={16} strokeWidth={2.7} />
                      {formatStatus(user.status)}
                    </span>

                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                      <ShieldCheck size={16} strokeWidth={2.7} />
                      {formatRole(user.role)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-auto">
                <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 active:scale-[0.98]">
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Mengupload...
                    </>
                  ) : (
                    <>
                      <Upload size={18} strokeWidth={2.7} />
                      Ubah Foto
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
                        handleUploadProfilePhoto(file);
                      }

                      event.target.value = "";
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={openPasswordModal}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-slate-900 active:scale-[0.98]"
                >
                  <LockKeyhole size={18} strokeWidth={2.7} />
                  Ubah Password
                </button>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-5">
                <p className="text-sm font-bold text-slate-500">
                  Kode Karyawan
                </p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {user.employee_code || "-"}
                </p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-5">
                <p className="text-sm font-bold text-slate-500">Status</p>
                <p className="mt-2 text-2xl font-black text-[#123c8c]">
                  {formatStatus(user.status)}
                </p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-5">
                <p className="text-sm font-bold text-slate-500">Unit</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {user.unit?.name || "-"}
                </p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-5">
                <p className="text-sm font-bold text-slate-500">Shift</p>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {user.shift?.name || "-"}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-[#f8fbff] p-5 md:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                  <UserRound size={23} strokeWidth={2.7} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                    Informasi Akun
                  </p>

                  <h2 className="text-xl font-black text-slate-950">
                    Detail Profil Karyawan
                  </h2>
                </div>
              </div>

              <p className="mt-4 text-sm font-semibold leading-7 text-slate-500">
                Data profil ini mengikuti informasi yang sudah didaftarkan oleh
                admin, termasuk unit, divisi, jabatan, shift, jam kerja, dan
                kantor terdaftar.
              </p>
            </div>

            {infoCards.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {infoCards.map((item) => (
                  <InfoCard key={item.label} item={item} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-blue-100 bg-white p-6 text-center shadow-lg shadow-slate-200/60">
                <p className="text-sm font-black text-slate-500">
                  Belum ada informasi akun tambahan.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {isPasswordModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Keamanan Akun
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Ubah Password
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Gunakan password baru minimal 8 karakter.
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
                label="Password Lama"
                value={passwordForm.current_password}
                placeholder="Masukkan password lama"
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
                label="Password Baru"
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
                label="Konfirmasi Password Baru"
                value={passwordForm.confirm_password}
                placeholder="Ulangi password baru"
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
                Setelah password berhasil diubah, gunakan password baru untuk
                login berikutnya.
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <LockKeyhole size={18} />
                      Simpan Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <BottomNav />
    </MobileShell>
  );
}
