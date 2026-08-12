"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CreditCard,
  Edit,
  Eye,
  EyeOff,
  IdCard,
  Info,
  KeyRound,
  Mail,
  MapPin,
  Network,
  Plus,
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
import { AppBankSelect } from "@/components/AppBankSelect";
import {
  AppAnimatedActionButton,
  AppModalMotion,
  AppModalPanel,
} from "@/components/ui/AppUI";
import {
  isValidBankAccountNumber,
  isValidNik,
  normalizeDigits,
} from "@/lib/identity-validation";
import {
  CREATIVEMU_EMAIL_EXAMPLE,
  isCreativemuEmail,
  isValidEmailFormat,
} from "@/lib/creativemu-email";
import { getBankOption } from "@/lib/bank-options";

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

type JabatanRelation = {
  id: string;
  name: string;
  department_id?: string | null;
  department?: DepartmentRelation;
} | null;

type PositionRelation = {
  id: string;
  name: string;
  jabatan_id?: string | null;
  jabatan?: JabatanRelation;
} | null;

type DepartmentOption = {
  id: string;
  name: string;
  office_id: string | null;
  status: string;
  office?: {
    id: string;
    name: string;
    address?: string | null;
    status?: string;
  } | null;
};

type JabatanOption = {
  id: string;
  name: string;
  department_id: string | null;
  status: string;
  department?: {
    id: string;
    name: string;
    office_id?: string | null;
    office?: {
      id: string;
      name: string;
      address?: string | null;
      status?: string;
    } | null;
  } | null;
};

type PositionOption = {
  id: string;
  name: string;
  jabatan_id: string | null;
  status: string;
  jabatan?: {
    id: string;
    name: string;
    department_id?: string | null;
    department?: {
      id: string;
      name: string;
      office_id?: string | null;
      office?: {
        id: string;
        name: string;
        address?: string | null;
        status?: string;
      } | null;
    } | null;
  } | null;
};

type ShiftOption = {
  id: string;
  name: string;
  status: string;
  tolerance_minutes: number;
};

type EmploymentStatusOption = {
  id: string;
  name: string;
  status: string;
};

type OfficeOption = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  status: string;
};

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
  employee_code: string | null;
  name: string;
  email: string;
  role: "admin" | "employee" | "owner" | string;
  jabatan: JabatanRelation;
  department: DepartmentRelation;
  position: PositionRelation;
  shift: ShiftRelation;
  registered_office: OfficeRelation;
  phone: string | null;
  status: "active" | "inactive";
  employment_status: string | null;
  employment_start_date: string | null;
  employment_end_date: string | null;
  birth_place: string | null;
  birth_date: string | null;
  bank_code: string | null;
  bank_account_number: string | null;
  nik: string | null;
  wfh_quota_monthly?: number | null;
  annual_leave_quota?: number | null;
  created_at: string;

  profile_photo?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
};

type EmployeeForm = {
  employee_code: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  department_id: string;
  jabatan_id: string;
  position_id: string;
  shift_id: string;
  registered_office_id: string;
  temporaryPassword: string;
  confirmTemporaryPassword: string;
  status: "active" | "inactive";
  employment_status: string;
  employment_start_date: string;
  employment_end_date: string;
  birth_place: string;
  birth_date: string;
  bank_code: string;
  bank_account_number: string;
  nik: string;
  wfh_quota_monthly: string;
  annual_leave_quota: string;
};

type EmployeeAlert = {
  type: "warning" | "success" | "error" | "info";
  title: string;
  message: string;
} | null;

const initialForm: EmployeeForm = {
  employee_code: "",
  name: "",
  email: "",
  role: "employee",
  department_id: "",
  jabatan_id: "",
  position_id: "",
  shift_id: "",
  registered_office_id: "",
  temporaryPassword: "",
  confirmTemporaryPassword: "",
  status: "active",
  employment_status: "",
  employment_start_date: "",
  employment_end_date: "",
  birth_place: "",
  birth_date: "",
  bank_code: "",
  bank_account_number: "",
  nik: "",
  wfh_quota_monthly: "0",
  annual_leave_quota: "12",
};

const EMPLOYEE_REQUEST_TIMEOUT_MS = 15_000;
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
  return status === "active" ? "Aktif" : "Nonaktif";
}

function formatRole(role?: string | null) {
  const normalizedRole = String(role || "").toLowerCase();

  if (normalizedRole === "admin" || normalizedRole === "owner") return "Admin";

  return "Employee";
}

function formatDateInput(value?: string | null) {
  if (!value) return "";

  return String(value).slice(0, 10);
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

function normalizeNumericInput(value: string) {
  return normalizeDigits(value);
}

function formatWfhQuota(value?: number | string | null) {
  const quota = Number(value || 0);

  return String(Number.isFinite(quota) ? Math.max(0, quota) : 0);
}

function formatLeaveQuota(value?: number | string | null) {
  const quota = Math.max(0, Number(value ?? 12));
  return `${quota} Hari`;
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

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const [imageError, setImageError] = useState(false);
  const profilePhoto = getEmployeeProfilePhoto(employee);

  useEffect(() => {
    setImageError(false);
  }, [profilePhoto]);

  if (profilePhoto && !imageError) {
    return (
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-[#eaf1ff] ring-1 ring-blue-100">
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
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-sm font-black text-[#123c8c]">
      {getInitialName(employee.name)}
    </div>
  );
}

function getRelationName(
  item:
    | JabatanRelation
    | DepartmentRelation
    | PositionRelation
    | ShiftRelation
    | OfficeRelation,
) {
  return item?.name || "-";
}

function getAlertTheme(type: NonNullable<EmployeeAlert>["type"]) {
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

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function EmployeeMotionStyles() {
  return (
    <style>{`
      @keyframes employeeEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes employeeRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes employeeAlertEnter {
        0% {
          opacity: 0;
          transform: translateX(20px) scale(0.98);
        }

        100% {
          opacity: 1;
          transform: translateX(0) scale(1);
        }
      }

      .employee-enter {
        animation: employeeEnter 320ms ease-out both;
      }

      .employee-row-enter {
        opacity: 0;
        animation: employeeRowEnter 300ms ease-out both;
      }

      .employee-alert-enter {
        animation: employeeAlertEnter 260ms ease-out both;
      }

      .employee-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .employee-enter,
        .employee-row-enter,
        .employee-alert-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminEmployeesPage() {
  const router = useRouter();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [jabatans, setJabatans] = useState<JabatanOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [employmentStatuses, setEmploymentStatuses] = useState<
    EmploymentStatusOption[]
  >([]);
  const [offices, setOffices] = useState<OfficeOption[]>([]);

  const [keyword, setKeyword] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<
    "account" | "structure" | "employment" | "payroll"
  >("account");
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState<EmployeeForm>(initialForm);
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [showConfirmTemporaryPassword, setShowConfirmTemporaryPassword] =
    useState(false);

  const [employeeAlert, setEmployeeAlert] = useState<EmployeeAlert>(null);
  const [isAlertClosing, setIsAlertClosing] = useState(false);
  const alertCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const activeAlertKeyRef = useRef("");

  const showEmployeeAlert = useCallback(
    (
      title: string,
      message: string,
      type: "warning" | "success" | "error" | "info" = "warning",
    ) => {
      const alertKey = `${type}:${title}:${message}`;

      if (activeAlertKeyRef.current === alertKey && employeeAlert) {
        return;
      }

      if (alertCloseTimeoutRef.current) {
        clearTimeout(alertCloseTimeoutRef.current);
      }

      activeAlertKeyRef.current = alertKey;
      setIsAlertClosing(false);

      setEmployeeAlert({
        type,
        title,
        message,
      });

      alertCloseTimeoutRef.current = setTimeout(
        () => {
          setIsAlertClosing(true);

          alertCloseTimeoutRef.current = setTimeout(() => {
            setEmployeeAlert(null);
            setIsAlertClosing(false);
            activeAlertKeyRef.current = "";
          }, 240);
        },
        type === "error" ? 5000 : 3200,
      );
    },
    [employeeAlert],
  );

  const closeEmployeeAlert = useCallback(() => {
    if (alertCloseTimeoutRef.current) {
      clearTimeout(alertCloseTimeoutRef.current);
    }

    setIsAlertClosing(true);

    alertCloseTimeoutRef.current = setTimeout(() => {
      setEmployeeAlert(null);
      setIsAlertClosing(false);
      activeAlertKeyRef.current = "";
    }, 240);
  }, []);

  const loadEmployees = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      EMPLOYEE_REQUEST_TIMEOUT_MS,
    );

    try {
      setIsLoading(true);

      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          showEmployeeAlert(
            "Sesi admin tidak valid",
            "Silakan login ulang memakai akun admin.",
            "error",
          );

          await fetch("/api/auth/logout", {
            method: "POST",
          }).catch(() => undefined);

          window.setTimeout(() => {
            router.replace("/login?redirect=/admin/daftar-karyawan");
          }, 700);
          return;
        }

        showEmployeeAlert(
          "Gagal mengambil data employee",
          result.message || "Gagal mengambil data karyawan.",
          "error",
        );
        return;
      }

      const employeeList = (result.employees || result.data || []).filter(
        (employee: Employee) =>
          String(employee.role || "").toLowerCase() === "employee",
      );

      setEmployees(employeeList);
      setDepartments(result.departments || []);
      setJabatans(result.jabatans || []);
      setPositions(result.positions || []);
      setShifts(result.shifts || []);
      setEmploymentStatuses(result.employmentStatuses || []);
      setOffices(result.offices || result.officeLocations || []);
    } catch (error) {
      console.error("LOAD_EMPLOYEES_ERROR:", error);

      showEmployeeAlert(
        error instanceof DOMException && error.name === "AbortError"
          ? "Koneksi terlalu lama"
          : "Terjadi kesalahan",
        error instanceof DOMException && error.name === "AbortError"
          ? "Server terlalu lama merespons data karyawan. Coba refresh halaman."
          : "Terjadi kesalahan saat mengambil data karyawan.",
        "error",
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [router, showEmployeeAlert]);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    return () => {
      if (alertCloseTimeoutRef.current) {
        clearTimeout(alertCloseTimeoutRef.current);
      }
    };
  }, []);

  const activeOffices = useMemo(() => {
    return offices.filter((office) => office.status === "active");
  }, [offices]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => department.status === "active");
  }, [departments]);

  const filteredJabatans = useMemo(() => {
    return jabatans.filter((jabatan) => jabatan.status === "active");
  }, [jabatans]);

  const filteredPositions = useMemo(() => {
    return positions.filter((position) => position.status === "active");
  }, [positions]);

  const activeShifts = useMemo(() => {
    return shifts.filter((shift) => shift.status === "active");
  }, [shifts]);

  const selectedShift = useMemo(() => {
    return activeShifts.find((shift) => shift.id === form.shift_id) || null;
  }, [activeShifts, form.shift_id]);

  const isSelectedPrimaryShift =
    selectedShift?.name.trim().toLowerCase() === "utama";

  const finalEmploymentStatus = form.employment_status.trim();

  const activeEmploymentStatuses = useMemo(() => {
    const list = employmentStatuses.filter(
      (item) =>
        item.status === "active" && item.name.trim().toLowerCase() !== "utama",
    );
    const currentVal = form.employment_status;
    if (
      currentVal &&
      currentVal.trim().toLowerCase() !== "utama" &&
      !list.some((item) => item.name === currentVal)
    ) {
      const found = employmentStatuses.find((item) => item.name === currentVal);
      if (found) {
        list.push(found);
      } else {
        list.push({
          id: `legacy-${currentVal}`,
          name: currentVal,
          status: "legacy",
        });
      }
    }
    return list;
  }, [employmentStatuses, form.employment_status]);

  const employeeAccounts = useMemo(() => {
    return employees.filter(
      (employee) => String(employee.role || "").toLowerCase() === "employee",
    );
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const list = employeeAccounts.filter((employee) => {
      const text = `
        ${employee.id || ""}
        ${employee.employee_code || ""}
        ${employee.name}
        ${employee.email}
        ${employee.role || ""}
        ${employee.registered_office?.name || ""}
        ${employee.registered_office?.address || ""}
        ${employee.department?.name || ""}
        ${employee.jabatan?.name || ""}
        ${employee.position?.name || ""}
        ${employee.shift?.name || ""}
        ${employee.status}
        ${employee.employment_status || ""}
        ${employee.employment_start_date || ""}
        ${employee.employment_end_date || ""}
        ${employee.birth_place || ""}
        ${employee.birth_date || ""}
        ${getBankOption(employee.bank_code)?.name || ""}
        ${getBankOption(employee.bank_code)?.shortName || ""}
        ${employee.bank_account_number || ""}
        ${employee.nik || ""}
        ${employee.wfh_quota_monthly ?? ""}
      `.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });

    return list.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      return sortOrder === "asc"
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });
  }, [employeeAccounts, keyword, sortOrder]);

  const activeEmployees = employeeAccounts.filter(
    (employee) => employee.status === "active",
  ).length;

  const inactiveEmployees = employeeAccounts.filter(
    (employee) => employee.status === "inactive",
  ).length;

  function openRegisterModal() {
    setEditingEmployee(null);
    setForm(initialForm);
    setShowTemporaryPassword(false);
    setShowConfirmTemporaryPassword(false);
    setActiveModalTab("account");
    setIsModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    setEditingEmployee(employee);
    setShowTemporaryPassword(false);
    setShowConfirmTemporaryPassword(false);
    setActiveModalTab("account");
    setForm({
      employee_code: employee.employee_code || "",
      name: employee.name,
      email: employee.email,
      role:
        String(employee.role || "").toLowerCase() === "admin" ||
        String(employee.role || "").toLowerCase() === "owner"
          ? "admin"
          : "employee",
      registered_office_id: employee.registered_office?.id || "",
      department_id: employee.department?.id || "",
      jabatan_id: employee.jabatan?.id || "",
      position_id: employee.position?.id || "",
      shift_id: employee.shift?.id || "",
      temporaryPassword: "",
      confirmTemporaryPassword: "",
      status: employee.status,
      employment_status:
        employee.employment_status?.trim().toLowerCase() === "utama"
          ? ""
          : employee.employment_status || "",
      employment_start_date: formatDateInput(employee.employment_start_date),
      employment_end_date: formatDateInput(employee.employment_end_date),
      birth_place: employee.birth_place || "",
      birth_date: formatDateInput(employee.birth_date),
      bank_code: employee.bank_code || "",
      bank_account_number: employee.bank_account_number || "",
      nik: employee.nik || "",
      wfh_quota_monthly: String(employee.wfh_quota_monthly ?? 0),
      annual_leave_quota: String(employee.annual_leave_quota ?? 12),
    });
    setIsModalOpen(true);
  }

  function closeRegisterModal() {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setForm(initialForm);
    setShowTemporaryPassword(false);
    setShowConfirmTemporaryPassword(false);
  }

  function handleNumericFormChange(
    field: "bank_account_number" | "nik" | "wfh_quota_monthly" | "annual_leave_quota",
    value: string,
  ) {
    const maxLength = field === "wfh_quota_monthly" || field === "annual_leave_quota" ? 3 : 16;
    const normalizedValue = normalizeNumericInput(value).slice(0, maxLength);

    setForm((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isEditing = Boolean(editingEmployee);
    const email = form.email.trim().toLowerCase();
    const temporaryPassword = form.temporaryPassword.trim();
    const confirmTemporaryPassword = form.confirmTemporaryPassword.trim();
    const passwordForSave = temporaryPassword;
    const confirmPasswordForSave = confirmTemporaryPassword;

    if (!form.name.trim() || !email) {
      setActiveModalTab("account");
      showEmployeeAlert(
        "Data Akun Belum Lengkap",
        "Nama lengkap dan email wajib diisi.",
        "warning",
      );
      return;
    }

    if (
      !form.registered_office_id ||
      !form.department_id ||
      !form.jabatan_id ||
      !form.position_id ||
      !form.shift_id
    ) {
      setActiveModalTab("structure");
      showEmployeeAlert(
        "Struktur Organisasi Belum Lengkap",
        "Kantor, divisi, jabatan, posisi, dan shift kerja wajib dipilih.",
        "warning",
      );
      return;
    }

    if (!isValidEmailFormat(email)) {
      setActiveModalTab("account");
      showEmployeeAlert(
        "Format email tidak valid",
        `Masukkan email yang benar, contohnya ${CREATIVEMU_EMAIL_EXAMPLE}.`,
        "warning",
      );
      return;
    }

    if (!isCreativemuEmail(email)) {
      setActiveModalTab("account");
      showEmployeeAlert(
        "Email harus Creativemu",
        "Email akun wajib menggunakan domain resmi Creativemu.",
        "warning",
      );
      return;
    }

    if (passwordForSave && passwordForSave.length < 8) {
      showEmployeeAlert(
        "Password terlalu pendek",
        "Password minimal 8 karakter agar akun employee lebih aman.",
        "warning",
      );
      return;
    }

    if (!isEditing && (!temporaryPassword || !confirmTemporaryPassword)) {
      setActiveModalTab("account");
      showEmployeeAlert(
        "Password belum lengkap",
        "Password dan konfirmasi password wajib diisi saat membuat employee baru.",
        "warning",
      );
      return;
    }

    if (
      isEditing &&
      (passwordForSave || confirmPasswordForSave) &&
      !passwordForSave
    ) {
      showEmployeeAlert(
        "Password belum diisi",
        "Isi password baru sebelum konfirmasi.",
        "warning",
      );
      return;
    }

    if (
      isEditing &&
      (passwordForSave || confirmPasswordForSave) &&
      !confirmPasswordForSave
    ) {
      showEmployeeAlert(
        "Konfirmasi belum diisi",
        "Ulangi password baru sebelum menyimpan.",
        "warning",
      );
      return;
    }

    if (
      (!isEditing || temporaryPassword || confirmTemporaryPassword) &&
      passwordForSave !== confirmPasswordForSave
    ) {
      showEmployeeAlert(
        "Konfirmasi password tidak sama",
        isEditing
          ? "Password baru dan konfirmasi harus sama."
          : "Password dan konfirmasi harus sama sebelum employee dibuat.",
        "warning",
      );
      return;
    }

    if (form.nik && !isValidNik(form.nik)) {
      showEmployeeAlert(
        "NIK tidak valid",
        "NIK harus berupa angka dan berjumlah tepat 16 digit.",
        "warning",
      );
      return;
    }

    if (
      form.bank_account_number &&
      !isValidBankAccountNumber(form.bank_account_number)
    ) {
      showEmployeeAlert(
        "No rekening tidak valid",
        "No rekening harus berupa angka dengan panjang 10 sampai 16 digit.",
        "warning",
      );
      return;
    }

    const wfhQuotaMonthly = Number(form.wfh_quota_monthly || 0);
    const annualLeaveQuota = Number(form.annual_leave_quota || 12);

    if (
      !Number.isInteger(wfhQuotaMonthly) ||
      wfhQuotaMonthly < 0 ||
      wfhQuotaMonthly > 999
    ) {
      showEmployeeAlert(
        "Kuota WFH tidak valid",
        "Kuota WFH harus angka 0 sampai 999.",
        "warning",
      );
      return;
    }

    if (
      !Number.isInteger(annualLeaveQuota) ||
      annualLeaveQuota < 0 ||
      annualLeaveQuota > 365
    ) {
      showEmployeeAlert(
        "Kuota Cuti Tahunan tidak valid",
        "Kuota Cuti Tahunan harus angka 0 sampai 365.",
        "warning",
      );
      return;
    }

    const employmentEndDateForSave = isSelectedPrimaryShift
      ? ""
      : form.employment_end_date;

    if (
      form.employment_start_date &&
      employmentEndDateForSave &&
      form.employment_start_date > employmentEndDateForSave
    ) {
      showEmployeeAlert(
        "Masa kerja tidak valid",
        "Tanggal mulai masa kerja tidak boleh melewati tanggal akhir.",
        "warning",
      );
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/employees", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingEmployee?.id,
          name: form.name.trim(),
          email,
          role: form.role,
          temporaryPassword: isEditing ? passwordForSave : temporaryPassword,
          registered_office_id: form.registered_office_id,
          department_id: form.department_id,
          jabatan_id: form.jabatan_id,
          position_id: form.position_id,
          shift_id: form.shift_id,
          status: form.status,
          employment_status: finalEmploymentStatus,
          employment_start_date: form.employment_start_date,
          employment_end_date: employmentEndDateForSave,
          birth_place: form.birth_place.trim(),
          birth_date: form.birth_date,
          bank_code: form.bank_code,
          bank_account_number: form.bank_account_number,
          nik: form.nik,
          employee_code: form.employee_code.trim(),
          wfh_quota_monthly: wfhQuotaMonthly,
          annual_leave_quota: annualLeaveQuota,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        showEmployeeAlert(
          "Gagal menyimpan employee",
          result.message ||
            (isEditing
              ? "Gagal memperbarui karyawan."
              : "Gagal menambahkan karyawan."),
          "error",
        );
        return;
      }

      closeRegisterModal();
      await loadEmployees();

      showEmployeeAlert(
        isEditing ? "Karyawan diperbarui" : "Karyawan berhasil dibuat",
        isEditing
          ? "Data akun berhasil diperbarui dan sudah tersimpan."
          : "Akun baru berhasil dibuat dengan password yang diisi.",
        "success",
      );
    } catch (error) {
      console.error("SAVE_EMPLOYEE_ERROR:", error);

      showEmployeeAlert(
        "Terjadi kesalahan",
        "Terjadi kesalahan saat menyimpan karyawan.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEmployee(employee: Employee) {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus akun "${employee.name}"? Data presensi, cuti, kunjungan, dan payroll milik akun ini ikut terhapus dan angka monitor perusahaan akan berubah.`,
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(employee.id);

      const response = await fetch(`/api/employees?id=${employee.id}`, {
        method: "DELETE",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        showEmployeeAlert(
          "Gagal menghapus employee",
          result.message ||
            result.error ||
            "Gagal menghapus employee. Coba refresh halaman lalu ulangi.",
          "error",
        );
        return;
      }

      setEmployees((prev) => prev.filter((item) => item.id !== employee.id));
      void loadEmployees();

      showEmployeeAlert(
        "Karyawan berhasil dihapus",
        "Data akun dan data terkait berhasil dihapus dari database.",
        "success",
      );
    } catch (error) {
      console.error("DELETE_EMPLOYEE_ERROR:", error);

      showEmployeeAlert(
        "Terjadi kesalahan",
        "Terjadi kesalahan saat menghapus employee.",
        "error",
      );
    } finally {
      setDeletingId("");
    }
  }

  const alertTheme = employeeAlert ? getAlertTheme(employeeAlert.type) : null;
  const AlertIcon = alertTheme?.icon || AlertTriangle;

  return (
    <MobileShell variant="admin">
      <EmployeeMotionStyles />

      <AppHeader title="Karyawan" variant="admin" />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="employee-enter relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-6 text-white shadow-2xl shadow-blue-900/25 md:p-8">
          <div className="relative z-10 flex flex-col items-center text-center gap-7 md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                <ShieldCheck size={15} />
                Manajemen Karyawan
              </div>

              <h2 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                Data Karyawan
              </h2>
            </div>

            <AppAnimatedActionButton
              icon={<Plus size={27} strokeWidth={3} />}
              title="Daftar Karyawan"
              loadingTitle="Opening..."
              onClick={openRegisterModal}
            />
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div
            className="employee-row-enter rounded-[1.7rem] border border-blue-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30"
            style={{ animationDelay: "70ms" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Total Karyawan
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {employeeAccounts.length}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                <UsersRound size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div
            className="employee-row-enter rounded-[1.7rem] border border-emerald-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30"
            style={{ animationDelay: "110ms" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">Akun Aktif</p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {activeEmployees}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BadgeCheck size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div
            className="employee-row-enter rounded-[1.7rem] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-300/30"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Akun Nonaktif
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {inactiveEmployees}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <UserRound size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>
        </section>

        <section
          className="employee-enter mt-6 rounded-[1.75rem] border border-white/70 bg-white/90 p-3 sm:p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Daftar Karyawan
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Total {employeeAccounts.length} karyawan terdaftar
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-[300px]">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Cari karyawan..."
                  className="employee-field w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                className="employee-field rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-xs font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="asc">Nama: A - Z</option>
                <option value="desc">Nama: Z - A</option>
              </select>
            </div>
          </div>

          <div className="mt-5 space-y-3 md:hidden">
            {isLoading && (
              <div className="rounded-3xl border border-blue-100 bg-white p-8 text-center font-black text-slate-700">
                Loading employee data...
              </div>
            )}

            {!isLoading &&
              filteredEmployees.map((employee, index) => (
                <div
                  key={employee.id}
                  onClick={() =>
                    router.push(`/admin/daftar-karyawan/${employee.id}`)
                  }
                  className="employee-row-enter rounded-3xl border border-blue-100 bg-white p-4 shadow-sm transition active:bg-blue-50"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <EmployeeAvatar employee={employee} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-950 leading-snug break-words sm:text-sm">
                          {employee.name}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold text-slate-500 leading-snug break-all sm:text-xs">
                          {employee.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                        employee.status === "active"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {formatStatus(employee.status)}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl bg-[#f6f8ff] p-3 text-center">
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Kantor</p>
                      <p className="mt-0.5 truncate text-xs font-black text-slate-700">
                        {getRelationName(employee.registered_office)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-slate-400">Shift</p>
                      <p className="mt-0.5 truncate text-xs font-black text-slate-700">
                        {getRelationName(employee.shift)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-[#123c8c]">WFH</p>
                      <p className="mt-0.5 text-xs font-black text-[#123c8c]">
                        {formatWfhQuota(employee.wfh_quota_monthly)} Hari
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(employee);
                      }}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-blue-100 bg-white px-3 text-xs font-black text-[#123c8c]"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEmployee(employee);
                      }}
                      disabled={deletingId === employee.id}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3 text-xs font-black text-red-600"
                    >
                      <Trash2 size={14} />
                      {deletingId === employee.id ? "..." : "Hapus"}
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="mt-5 hidden overflow-hidden rounded-3xl border border-blue-100 bg-white md:block">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-[#f6f8ff] text-[11px] font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  <th className="w-[22%] px-4 py-4">Karyawan</th>
                  <th className="w-[20%] px-4 py-4">Email</th>
                  <th className="w-[12%] px-3 py-4">Kantor</th>
                  <th className="w-[11%] px-3 py-4">Shift</th>
                  <th className="w-[7%] px-2 py-4 text-center">WFH</th>
                  <th className="w-[8%] px-2 py-4 text-center">Status</th>
                  <th className="w-[20%] px-2 py-4 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-50">
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center font-black text-slate-700">
                      Loading employee data...
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  filteredEmployees.map((employee, index) => (
                    <tr
                      key={employee.id}
                      onClick={() =>
                        router.push(`/admin/daftar-karyawan/${employee.id}`)
                      }
                      className="employee-row-enter cursor-pointer transition duration-200 hover:bg-[#f8fbff] active:bg-[#eef4ff]"
                      style={{
                        animationDelay: `${index * 45}ms`,
                      }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <EmployeeAvatar employee={employee} />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">
                              {employee.name}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] font-black uppercase tracking-[0.12em] text-[#123c8c]">
                              {employee.employee_code ? `${employee.employee_code} • ` : ""}
                              {getRelationName(employee.department) !== "-"
                                ? getRelationName(employee.department)
                                : getRelationName(employee.jabatan)}
                            </p>
                            <span
                              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black ${
                                String(employee.role || "").toLowerCase() ===
                                  "admin" ||
                                String(employee.role || "").toLowerCase() ===
                                  "owner"
                                  ? "bg-blue-50 text-[#123c8c]"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              {formatRole(employee.role)}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm font-semibold text-slate-600">
                        <p className="truncate">{employee.email}</p>
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-slate-600">
                        <p className="truncate">{getRelationName(employee.registered_office)}</p>
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-slate-600">
                        <p className="truncate">{getRelationName(employee.shift)}</p>
                      </td>

                      <td className="px-2 py-4 text-center text-sm font-black text-[#123c8c]">
                        {formatWfhQuota(employee.wfh_quota_monthly)}
                      </td>

                      <td className="px-2 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${
                            employee.status === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {formatStatus(employee.status)}
                        </span>
                      </td>

                      <td className="px-2 py-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEditModal(employee);
                            }}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-blue-100 bg-white px-2.5 text-xs font-black text-[#123c8c] shadow-none transition hover:bg-[#eaf1ff]"
                          >
                            <Edit size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteEmployee(employee);
                            }}
                            disabled={deletingId === employee.id}
                            className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-50 px-2.5 text-xs font-black text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 size={14} />
                            {deletingId === employee.id ? "..." : "Hapus"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

            {!isLoading && filteredEmployees.length === 0 && (
              <div className="employee-row-enter px-5 py-10 text-center">
                <p className="font-black text-slate-700">
                  Data tidak ditemukan
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Coba gunakan keyword pencarian lain.
                </p>
              </div>
            )}
        </section>
      </main>

      {isModalOpen && (
        <AppModalMotion>
          <AppModalPanel>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  <UserRound size={15} strokeWidth={3} />
                  {editingEmployee ? "Perbarui Karyawan" : "Tambah Karyawan"}
                </div>

                <h2 className="mt-1 text-xl font-black text-slate-950 md:text-2xl">
                  {editingEmployee
                    ? "Perbarui Data Karyawan"
                    : "Tambah Karyawan Baru"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Isi & perbarui data karyawan melalui 4 tab terstruktur di
                  bawah.
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

            {/* TAB BAR NAVIGATION */}
            <div className="mt-5 border-b border-slate-100 pb-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveModalTab("account")}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                    activeModalTab === "account"
                      ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20"
                      : "bg-[#f6f8ff] text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  <UserRound size={15} />
                  1. Akun & Password
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab("structure")}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                    activeModalTab === "structure"
                      ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20"
                      : "bg-[#f6f8ff] text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  <Building2 size={15} />
                  2. Struktur & Shift
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab("employment")}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                    activeModalTab === "employment"
                      ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20"
                      : "bg-[#f6f8ff] text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  <BadgeCheck size={15} />
                  3. Status & Masa Kerja
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab("payroll")}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition ${
                    activeModalTab === "payroll"
                      ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20"
                      : "bg-[#f6f8ff] text-slate-600 hover:bg-blue-50"
                  }`}
                >
                  <CreditCard size={15} />
                  4. Identitas & Bank
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  (event.target as HTMLElement).tagName === "INPUT"
                ) {
                  event.preventDefault();
                }
              }}
              noValidate
              className="mt-5 grid gap-4"
            >
              {/* TAB 1: AKUN & PASSWORD */}
              {activeModalTab === "account" && (
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Nama Lengkap
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
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
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Email
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <Mail
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          inputMode="email"
                          autoComplete="email"
                          value={form.email}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              email: event.target.value,
                            }))
                          }
                          placeholder={CREATIVEMU_EMAIL_EXAMPLE}
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        No Induk Karyawan
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <IdCard
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={form.employee_code}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              employee_code: event.target.value,
                            }))
                          }
                          maxLength={30}
                          placeholder="Contoh: CR-001"
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Role Akun
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <ShieldCheck
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                          value={form.role}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              role: event.target.value as "admin" | "employee",
                            }))
                          }
                          className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        {editingEmployee ? "Password Baru (Opsional)" : "Password"}
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <KeyRound
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type={showTemporaryPassword ? "text" : "password"}
                          value={form.temporaryPassword}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              temporaryPassword: event.target.value,
                            }))
                          }
                          placeholder={
                            editingEmployee
                              ? "Biarkan kosong jika tidak diubah"
                              : "Minimal 8 karakter"
                          }
                          autoComplete="new-password"
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-12 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowTemporaryPassword((prev) => !prev)
                          }
                          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-[#123c8c]"
                          aria-label={
                            showTemporaryPassword
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                        >
                          {showTemporaryPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        {editingEmployee
                          ? "Konfirmasi Password Baru"
                          : "Konfirmasi Password"}
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <KeyRound
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type={
                            showConfirmTemporaryPassword ? "text" : "password"
                          }
                          value={form.confirmTemporaryPassword}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              confirmTemporaryPassword: event.target.value,
                            }))
                          }
                          placeholder={
                            editingEmployee
                              ? "Ulangi password baru"
                              : "Ulangi password"
                          }
                          autoComplete="new-password"
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-12 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmTemporaryPassword((prev) => !prev)
                          }
                          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-[#123c8c]"
                          aria-label={
                            showConfirmTemporaryPassword
                              ? "Sembunyikan konfirmasi password"
                              : "Tampilkan konfirmasi password"
                          }
                        >
                          {showConfirmTemporaryPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: STRUKTUR & SHIFT */}
              {activeModalTab === "structure" && (
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Kantor Terdaftar
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <MapPin
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                          value={form.registered_office_id}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              registered_office_id: event.target.value,
                            }))
                          }
                          className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Pilih Kantor</option>
                          {activeOffices.map((office) => (
                            <option key={office.id} value={office.id}>
                              {office.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Divisi
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <Network
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                          value={form.department_id}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              department_id: event.target.value,
                            }))
                          }
                          className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Pilih Divisi</option>
                          {filteredDepartments.map((department) => (
                            <option key={department.id} value={department.id}>
                              {department.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Jabatan
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <Building2
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                          value={form.jabatan_id}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              jabatan_id: event.target.value,
                            }))
                          }
                          className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Pilih Jabatan</option>
                          {filteredJabatans.map((jabatan) => (
                            <option key={jabatan.id} value={jabatan.id}>
                              {jabatan.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Posisi
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <BriefcaseBusiness
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                          value={form.position_id}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              position_id: event.target.value,
                            }))
                          }
                          className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Pilih Posisi</option>
                          {filteredPositions.map((position) => (
                            <option key={position.id} value={position.id}>
                              {position.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Shift Kerja
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <Clock3
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                          value={form.shift_id}
                          onChange={(event) => {
                            const nextShift = activeShifts.find(
                              (shift) => shift.id === event.target.value,
                            );
                            setForm((prev) => ({
                              ...prev,
                              shift_id: event.target.value,
                              employment_end_date:
                                nextShift?.name.trim().toLowerCase() === "utama"
                                  ? ""
                                  : prev.employment_end_date,
                            }));
                          }}
                          className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Pilih Shift</option>
                          {activeShifts.map((shift) => (
                            <option key={shift.id} value={shift.id}>
                              {shift.name} - Toleransi {shift.tolerance_minutes}{" "}
                              m
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: STATUS & MASA KERJA */}
              {activeModalTab === "employment" && (
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Status Akun
                      </label>
                      <div className="app-field-smooth rounded-2xl">
                        <select
                          value={form.status}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              status: event.target.value as
                                | "active"
                                | "inactive",
                            }))
                          }
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="active">Aktif</option>
                          <option value="inactive">Nonaktif</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Status Kepegawaian
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <select
                          value={form.employment_status}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              employment_status: event.target.value,
                            }))
                          }
                          className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 pr-12 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">Pilih Status Kepegawaian</option>
                          {activeEmploymentStatuses.map((status) => (
                            <option key={status.id} value={status.name}>
                              {status.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={18}
                          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid gap-4 ${
                      isSelectedPrimaryShift ? "" : "md:grid-cols-2"
                    }`}
                  >
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Mulai Masa Kerja
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <CalendarDays
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="date"
                          value={form.employment_start_date}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              employment_start_date: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {!isSelectedPrimaryShift ? (
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Akhir Masa Kerja
                        </label>
                        <div className="app-field-smooth relative rounded-2xl">
                          <CalendarDays
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="date"
                            value={form.employment_end_date}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                employment_end_date: event.target.value,
                              }))
                            }
                            min={form.employment_start_date || undefined}
                            className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Kuota WFH (hari/bulan)
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <Clock3
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={form.wfh_quota_monthly}
                          onChange={(event) =>
                            handleNumericFormChange(
                              "wfh_quota_monthly",
                              event.target.value,
                            )
                          }
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={3}
                          placeholder="0"
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Kuota Cuti Tahunan (hari/tahun)
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <CalendarDays
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={form.annual_leave_quota}
                          onChange={(event) =>
                            handleNumericFormChange(
                              "annual_leave_quota",
                              event.target.value,
                            )
                          }
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={3}
                          placeholder="12"
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: IDENTITAS & BANK */}
              {activeModalTab === "payroll" && (
                <div className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Tempat Lahir
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <MapPin
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={form.birth_place}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              birth_place: event.target.value,
                            }))
                          }
                          placeholder="Contoh: Jakarta"
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Tanggal Lahir
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <CalendarDays
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="date"
                          value={form.birth_date}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              birth_date: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      NIK (16 Digit)
                    </label>
                    <div className="app-field-smooth relative rounded-2xl">
                      <IdCard
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        value={form.nik}
                        onChange={(event) =>
                          handleNumericFormChange("nik", event.target.value)
                        }
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={16}
                        placeholder="Masukkan NIK"
                        className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <AppBankSelect
                      label="Nama Bank"
                      value={form.bank_code}
                      onChange={(val) =>
                        setForm((prev) => ({ ...prev, bank_code: val }))
                      }
                    />

                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        No Rekening
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <CreditCard
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          value={form.bank_account_number}
                          onChange={(event) =>
                            handleNumericFormChange(
                              "bank_account_number",
                              event.target.value,
                            )
                          }
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={16}
                          placeholder="Masukkan no rekening"
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="mt-4 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 md:flex-row md:justify-between md:items-center">
                <button
                  type="button"
                  onClick={closeRegisterModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-[#123c8c] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingEmployee
                      ? "Perbarui Karyawan"
                      : "Tambah Karyawan"}
                </button>
              </div>
            </form>
          </AppModalPanel>
        </AppModalMotion>
      )}

      {employeeAlert && alertTheme ? (
        <div
          className={`employee-alert-enter fixed right-4 top-4 z-[140] w-[calc(100vw-2rem)] max-w-md transition-all duration-300 ease-out md:right-7 md:top-7 ${
            isAlertClosing
              ? "translate-x-8 scale-95 opacity-0"
              : "translate-x-0 scale-100 opacity-100"
          }`}
        >
          <div
            className={`overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br ${alertTheme.shell} shadow-2xl shadow-slate-900/20 backdrop-blur-xl transition-all duration-300 ease-out ${
              isAlertClosing
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <div className="relative p-5">
              <div className="relative flex items-start gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.5rem] ${alertTheme.iconWrap} shadow-lg shadow-slate-300/40`}
                >
                  <AlertIcon size={32} strokeWidth={3} />
                </div>

                <div className="min-w-0 flex-1 pt-1">
                  <div
                    className={`inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] ${alertTheme.badge}`}
                  >
                    {alertTheme.label}
                  </div>

                  <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950">
                    {employeeAlert.title}
                  </h3>

                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                    {employeeAlert.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEmployeeAlert}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 active:scale-[0.96]"
                >
                  <X size={22} strokeWidth={2.8} />
                </button>
              </div>
            </div>

            <div className="border-t border-white/60 bg-white/70 p-4">
              <button
                type="button"
                onClick={closeEmployeeAlert}
                className={`w-full rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition active:scale-[0.98] ${alertTheme.button}`}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
