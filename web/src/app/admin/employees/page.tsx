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
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit,
  Info,
  KeyRound,
  Mail,
  MapPin,
  Network,
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
import {
  AppAnimatedActionButton,
  AppFormReveal,
  AppModalMotion,
  AppModalPanel,
} from "@/components/ui/AppUI";

function getShortEmployeeId(id: string) {
  if (!id) return "";
  return id.substring(0, 8).toUpperCase();
}

type RelationItem = {
  id: string;
  name: string;
} | null;
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

type UnitOption = {
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
  unit_id: string | null;
  status: string;
  unit?: {
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
  employment_status?: "kartap" | "kontrak" | "magang" | "pkl" | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  uploaded_document_url?: string | null;
  base_salary?: number | string | null;
};

type EmployeeForm = {
  name: string;
  email: string;
  department_id: string;
  unit_id: string;
  position_id: string;
  shift_id: string;
  registered_office_id: string;
  temporaryPassword: string;
  confirmTemporaryPassword: string;
  status: "active" | "inactive";
  birth_place: string;
  birth_date: string;
  bank_account_number: string;
  nik: string;
  employment_status: "kartap" | "kontrak" | "magang" | "pkl" | "";
  contract_start_date: string;
  contract_end_date: string;
  uploaded_document_url: string;
  base_salary: string;
};

type EmployeeAlert = {
  type: "warning" | "success" | "error" | "info";
  title: string;
  message: string;
} | null;

const initialForm: EmployeeForm = {
  name: "",
  email: "",
  department_id: "",
  unit_id: "",
  position_id: "",
  shift_id: "shift-1",
  registered_office_id: "",
  temporaryPassword: "",
  confirmTemporaryPassword: "",
  status: "active",
  birth_place: "",
  birth_date: "",
  bank_account_number: "",
  nik: "",
  employment_status: "",
  contract_start_date: "",
  contract_end_date: "",
  uploaded_document_url: "",
  base_salary: "",
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isCreativemuEmail(email: string) {
  const normalized = email.toLowerCase();
  return normalized.endsWith("@creativemu.co.id") || normalized.endsWith(".co.id");
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

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const [imageError, setImageError] = useState(false);
  const profilePhoto = getEmployeeProfilePhoto(employee);

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
    | UnitRelation
    | DepartmentRelation
    | PositionRelation
    | ShiftRelation
    | OfficeRelation,
) {
  return item?.name || "-";
}

function getDepartmentOfficeId(
  department?: DepartmentOption | DepartmentRelation,
) {
  return department?.office_id || department?.office?.id || "";
}

function getUnitDepartmentId(unit?: UnitOption | UnitRelation) {
  return unit?.department_id || unit?.department?.id || "";
}

function getUnitOfficeId(unit?: UnitOption | UnitRelation) {
  return unit?.department?.office_id || unit?.department?.office?.id || "";
}

function getPositionUnitId(position?: PositionOption | PositionRelation) {
  return position?.unit_id || position?.unit?.id || "";
}

function getPositionDepartmentId(position?: PositionOption | PositionRelation) {
  return position?.unit?.department_id || position?.unit?.department?.id || "";
}

function getPositionOfficeId(position?: PositionOption | PositionRelation) {
  return (
    position?.unit?.department?.office_id ||
    position?.unit?.department?.office?.id ||
    ""
  );
}

function getAlertTheme(type: NonNullable<EmployeeAlert>["type"]) {
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
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [offices, setOffices] = useState<OfficeOption[]>([]);

  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState<EmployeeForm>(initialForm);

  type EmployeeSortKey =
    | "name"
    | "email"
    | "office"
    | "department"
    | "unit"
    | "position"
    | "shift"
    | "status";

  const [sortColumn, setSortColumn] = useState<EmployeeSortKey>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (key: EmployeeSortKey) => {
    if (sortColumn === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(key);
      setSortDirection("asc");
    }
  };

  const [employeeAlert, setEmployeeAlert] = useState<EmployeeAlert>(null);
  const [isAlertClosing, setIsAlertClosing] = useState(false);
  const alertCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const showEmployeeAlert = useCallback(
    (
      title: string,
      message: string,
      type: "warning" | "success" | "error" | "info" = "warning",
    ) => {
      if (alertCloseTimeoutRef.current) {
        clearTimeout(alertCloseTimeoutRef.current);
      }

      setIsAlertClosing(false);

      setEmployeeAlert({
        type,
        title,
        message,
      });
    },
    [],
  );

  const closeEmployeeAlert = useCallback(() => {
    setIsAlertClosing(true);

    alertCloseTimeoutRef.current = setTimeout(() => {
      setEmployeeAlert(null);
      setIsAlertClosing(false);
    }, 240);
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        showEmployeeAlert(
          "Gagal mengambil data employee",
          result.message || "Gagal mengambil data karyawan.",
          "error",
        );
        return;
      }

      setEmployees(result.employees || result.data || []);
      setDepartments(result.departments || []);
      setUnits(result.units || []);
      setPositions(result.positions || []);
      setShifts(result.shifts || []);
      setOffices(result.offices || result.officeLocations || []);
    } catch (error) {
      console.error("LOAD_EMPLOYEES_ERROR:", error);

      showEmployeeAlert(
        "Terjadi kesalahan",
        "Terjadi kesalahan saat mengambil data karyawan.",
        "error",
      );
    } finally {
      setIsLoading(false);
    }
  }, [showEmployeeAlert]);

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
    if (!form.registered_office_id) return [];

    return departments.filter((department) => {
      const officeId = getDepartmentOfficeId(department);

      return (
        department.status === "active" && officeId === form.registered_office_id
      );
    });
  }, [departments, form.registered_office_id]);

  const filteredUnits = useMemo(() => {
    if (!form.department_id) return [];

    return units.filter((unit) => {
      return (
        unit.status === "active" &&
        getUnitDepartmentId(unit) === form.department_id
      );
    });
  }, [units, form.department_id]);

  const filteredPositions = useMemo(() => {
    if (!form.department_id) return [];

    return positions.filter((position) => {
      return (
        position.status === "active" &&
        getPositionDepartmentId(position) === form.department_id
      );
    });
  }, [positions, form.department_id]);

  const activeShifts = useMemo(() => {
    return shifts.filter((shift) => shift.status === "active");
  }, [shifts]);

  const filteredEmployees = useMemo(() => {
    const list = employees.filter((employee) => {
      const text = `
        ${employee.id || ""}
        ${employee.name}
        ${employee.email}
        ${employee.registered_office?.name || ""}
        ${employee.registered_office?.address || ""}
        ${employee.department?.name || ""}
        ${employee.unit?.name || ""}
        ${employee.position?.name || ""}
        ${employee.shift?.name || ""}
        ${employee.status}
      `.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });

    return list.sort((a, b) => {
      let valA = "";
      let valB = "";

      switch (sortColumn) {
        case "name":
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case "email":
          valA = a.email.toLowerCase();
          valB = b.email.toLowerCase();
          break;
        case "office":
          valA = (a.registered_office?.name || "").toLowerCase();
          valB = (b.registered_office?.name || "").toLowerCase();
          break;
        case "department":
          valA = (a.department?.name || "").toLowerCase();
          valB = (b.department?.name || "").toLowerCase();
          break;
        case "unit":
          valA = (a.unit?.name || "").toLowerCase();
          valB = (b.unit?.name || "").toLowerCase();
          break;
        case "position":
          valA = (a.position?.name || "").toLowerCase();
          valB = (b.position?.name || "").toLowerCase();
          break;
        case "shift":
          valA = (a.shift?.name || "").toLowerCase();
          valB = (b.shift?.name || "").toLowerCase();
          break;
        case "status":
          valA = a.status.toLowerCase();
          valB = b.status.toLowerCase();
          break;
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [employees, keyword, sortColumn, sortDirection]);

  const activeEmployees = employees.filter(
    (employee) => employee.status === "active",
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status === "inactive",
  ).length;

  function openRegisterModal() {
    setEditingEmployee(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    const officeId =
      employee.registered_office?.id ||
      employee.department?.office_id ||
      employee.department?.office?.id ||
      getPositionOfficeId(employee.position) ||
      getUnitOfficeId(employee.unit) ||
      "";

    const departmentId =
      employee.department?.id ||
      employee.unit?.department_id ||
      employee.unit?.department?.id ||
      getPositionDepartmentId(employee.position) ||
      "";

    const unitId =
      employee.unit?.id ||
      employee.position?.unit_id ||
      employee.position?.unit?.id ||
      "";

    const positionId = employee.position?.id || "";

    setEditingEmployee(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      registered_office_id: officeId,
      department_id: departmentId,
      unit_id: unitId,
      position_id: positionId,
      shift_id: employee.shift?.id || "",
      temporaryPassword: "",
      confirmTemporaryPassword: "",
      status: employee.status,
      birth_place: employee.birth_place || "",
      birth_date: employee.birth_date ? new Date(employee.birth_date).toISOString().substring(0, 10) : "",
      bank_account_number: employee.bank_account_number || "",
      nik: employee.nik || "",
      employment_status: (employee.employment_status as any) || "",
      contract_start_date: employee.contract_start_date ? new Date(employee.contract_start_date).toISOString().substring(0, 10) : "",
      contract_end_date: employee.contract_end_date ? new Date(employee.contract_end_date).toISOString().substring(0, 10) : "",
      uploaded_document_url: employee.uploaded_document_url || "",
      base_salary: employee.base_salary ? String(employee.base_salary) : "",
    });
    setIsModalOpen(true);
  }

  function closeRegisterModal() {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isEditing = Boolean(editingEmployee);
    const email = form.email.trim().toLowerCase();
    const nameTrimmed = form.name.trim();

    if (/\d/.test(nameTrimmed)) {
      showEmployeeAlert(
        "Nama tidak valid",
        "Nama lengkap tidak boleh mengandung angka.",
        "warning"
      );
      return;
    }

    if (nameTrimmed.split(/\s+/).filter(Boolean).length < 2) {
      showEmployeeAlert(
        "Nama tidak lengkap",
        "Nama lengkap harus terdiri dari minimal 2 kata.",
        "warning"
      );
      return;
    }

    const temporaryPassword = form.temporaryPassword.trim();
    const confirmTemporaryPassword = form.confirmTemporaryPassword.trim();

    if (
      !nameTrimmed ||
      !email ||
      !form.registered_office_id ||
      !form.department_id ||
      !form.unit_id ||
      !form.position_id ||
      !form.shift_id
    ) {
      showEmployeeAlert(
        "Data belum lengkap",
        "Nama, email, kantor, divisi, unit, jabatan, dan shift wajib diisi.",
        "warning",
      );
      return;
    }

    if (!isValidEmail(email)) {
      showEmployeeAlert(
        "Format email tidak valid",
        "Masukkan email yang benar, contohnya employee@creativemu.co.id.",
        "warning",
      );
      return;
    }

    if (!isCreativemuEmail(email)) {
      showEmployeeAlert(
        "Email harus Creativemu",
        "Email employee wajib menggunakan domain @creativemu.co.id.",
        "warning",
      );
      return;
    }

    if (!isEditing && (!temporaryPassword || !confirmTemporaryPassword)) {
      showEmployeeAlert(
        "Data belum lengkap",
        "Password dan konfirmasi password wajib diisi untuk employee baru.",
        "warning",
      );
      return;
    }

    if (!isEditing && temporaryPassword.length < 8) {
      showEmployeeAlert(
        "Password terlalu pendek",
        "Password minimal 8 karakter agar akun employee lebih aman.",
        "warning",
      );
      return;
    }

    if (!isEditing && temporaryPassword !== confirmTemporaryPassword) {
      showEmployeeAlert(
        "Konfirmasi password tidak sama",
        "Password dan konfirmasi password harus sama sebelum employee dibuat.",
        "warning",
      );
      return;
    }

    if (form.nik && (!/^\d+$/.test(form.nik) || form.nik.length !== 12)) {
      showEmployeeAlert(
        "NIK tidak valid",
        "NIK harus berupa angka dan berjumlah tepat 12 digit.",
        "warning"
      );
      return;
    }

    if (form.bank_account_number && (!/^\d+$/.test(form.bank_account_number) || form.bank_account_number.length < 11 || form.bank_account_number.length > 13)) {
      showEmployeeAlert(
        "Nomor Rekening tidak valid",
        "Nomor rekening harus berupa angka dengan panjang antara 11 sampai 13 digit.",
        "warning"
      );
      return;
    }

    if (form.base_salary && (isNaN(Number(form.base_salary)) || Number(form.base_salary) < 0)) {
      showEmployeeAlert(
        "Gaji tidak valid",
        "Gaji harus berupa angka positif.",
        "warning"
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
          temporaryPassword: isEditing
            ? form.temporaryPassword
            : temporaryPassword,
          registered_office_id: form.registered_office_id,
          department_id: form.department_id,
          unit_id: form.unit_id,
          position_id: form.position_id,
          shift_id: form.shift_id,
          status: form.status,
          birth_place: form.birth_place,
          birth_date: form.birth_date || null,
          bank_account_number: form.bank_account_number,
          nik: form.nik,
          employment_status: form.employment_status,
          contract_start_date: form.contract_start_date || null,
          contract_end_date: form.contract_end_date || null,
          uploaded_document_url: form.uploaded_document_url,
          base_salary: form.base_salary ? Number(form.base_salary) : null,
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
        isEditing ? "Employee diperbarui" : "Employee berhasil dibuat",
        isEditing
          ? "Data employee berhasil diperbarui dan sudah tersimpan di database."
          : "Akun employee baru berhasil dibuat dan siap digunakan untuk login.",
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
    const confirmDelete = window.customConfirm
      ? await window.customConfirm(`Yakin ingin menghapus employee "${employee.name}"? Data yang dihapus tidak bisa dikembalikan.`)
      : window.confirm(`Yakin ingin menghapus employee "${employee.name}"? Data yang dihapus tidak bisa dikembalikan.`);

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
          result.message || "Gagal menghapus employee.",
          "error",
        );
        return;
      }

      await loadEmployees();

      showEmployeeAlert(
        "Employee berhasil dihapus",
        "Data employee berhasil dihapus dari database.",
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

      <AppHeader title="Kelola Karyawan" variant="admin" />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section
          style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '24px', paddingRight: '24px' }}
          className="employee-enter relative overflow-hidden rounded-[1.8rem] bg-[#123c8c] text-white shadow-2xl shadow-blue-900/25"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                <ShieldCheck size={15} />
                Manajemen Karyawan
              </div>

              <h2 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                Data Karyawan
              </h2>
            </div>

            <AppAnimatedActionButton
              icon={<Plus size={20} strokeWidth={3} />}
              title="Tambah Karyawan"
              loadingTitle="Membuka..."
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
                  {employees.length}
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
                <p className="text-sm font-bold text-slate-500">
                  Akun Aktif
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
          className="employee-enter mt-6 rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Daftar Karyawan
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Total {employees.length} karyawan terdaftar
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              {/* Mobile quick sort selector */}
              <div className="flex items-center gap-2 md:hidden">
                <span className="text-xs font-black text-slate-500 whitespace-nowrap">Urutkan:</span>
                <select
                  value={`${sortColumn}-${sortDirection}`}
                  onChange={(e) => {
                    const [col, dir] = e.target.value.split("-") as [EmployeeSortKey, "asc" | "desc"];
                    setSortColumn(col);
                    setSortDirection(dir);
                  }}
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 px-4 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="name-asc">Abjad Karyawan (A - Z)</option>
                  <option value="name-desc">Abjad Karyawan (Z - A)</option>
                  <option value="office-asc">Kantor (A - Z)</option>
                  <option value="department-asc">Divisi (A - Z)</option>
                  <option value="unit-asc">Posisi (A - Z)</option>
                  <option value="position-asc">Jabatan (A - Z)</option>
                  <option value="status-asc">Status (A - Z)</option>
                </select>
              </div>

              <div className="relative w-full md:w-[330px]">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Cari nama atau NIK..."
                  className="employee-field w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                onClick={loadEmployees}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
              >
                <RefreshCw size={18} />
                Muat Ulang
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-3xl border border-blue-100 bg-white">
            <div className="md:min-w-[1300px]">
              <div className="hidden grid-cols-[1.15fr_minmax(180px,1fr)_0.9fr_0.75fr_0.8fr_0.95fr_0.7fr_0.65fr_minmax(140px,1.2fr)] items-center bg-[#f6f8ff] px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#123c8c] md:grid select-none">
                {[
                  { key: "name", label: "Karyawan" },
                  { key: "email", label: "Email" },
                  { key: "office", label: "Kantor" },
                  { key: "department", label: "Divisi" },
                  { key: "unit", label: "Posisi" },
                  { key: "position", label: "Jabatan" },
                  { key: "shift", label: "Shift" },
                  { key: "status", label: "Status" },
                ].map((col) => {
                  const active = sortColumn === col.key;
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => handleSort(col.key as EmployeeSortKey)}
                      className={`flex items-center gap-1.5 font-black transition hover:text-blue-900 cursor-pointer ${
                        active ? "text-[#123c8c]" : "text-slate-500"
                      }`}
                    >
                      <span>{col.label}</span>
                      {active ? (
                        sortDirection === "asc" ? (
                          <ArrowUp size={13} className="text-[#123c8c] stroke-[3]" />
                        ) : (
                          <ArrowDown size={13} className="text-[#123c8c] stroke-[3]" />
                        )
                      ) : (
                        <ArrowUpDown size={11} className="opacity-30 hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
                <p className="text-center font-black text-slate-500">Aksi</p>
              </div>

              <div className="divide-y divide-blue-50">
                {isLoading && (
                  <div className="employee-row-enter px-5 py-10 text-center">
                    <p className="font-black text-slate-700">
                      Loading employee data...
                    </p>
                  </div>
                )}

                {!isLoading &&
                  filteredEmployees.map((employee, index) => (
                    <div
                      key={employee.id}
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        router.push(`/admin/employees/${employee.id}`)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/admin/employees/${employee.id}`);
                        }
                      }}
                      className="employee-row-enter grid cursor-pointer gap-4 px-5 py-4 transition duration-200 hover:bg-[#f8fbff] active:bg-[#eef4ff] md:min-h-[86px] md:grid-cols-[1.15fr_minmax(180px,1fr)_0.9fr_0.75fr_0.8fr_0.95fr_0.7fr_0.65fr_minmax(140px,1.2fr)] md:items-center md:gap-3"
                      style={{
                        animationDelay: `${index * 45}ms`,
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <EmployeeAvatar employee={employee} />

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-950">
                            {employee.name}
                          </p>
                          <p className="mt-1 truncate text-[11px] font-bold text-slate-400">
                            ID: {getShortEmployeeId(employee.id)}
                          </p>
                        </div>
                      </div>

                      <p className="min-w-0 truncate text-sm font-semibold text-slate-600">
                        {employee.email}
                      </p>

                      <div className="min-w-0 text-sm font-semibold text-slate-600">
                        <p className="truncate">
                          {getRelationName(employee.registered_office)}
                        </p>
                        <p className="mt-1 truncate text-[11px] font-bold text-slate-400">
                          {employee.registered_office?.address || "-"}
                        </p>
                      </div>

                      <p className="min-w-0 truncate text-sm font-semibold text-slate-600">
                        {getRelationName(employee.department)}
                      </p>

                      <p className="min-w-0 truncate text-sm font-semibold text-slate-600">
                        {getRelationName(employee.unit)}
                      </p>

                      <p className="min-w-0 line-clamp-2 text-sm font-semibold leading-5 text-slate-600">
                        {getRelationName(employee.position)}
                      </p>

                      <p className="min-w-0 truncate text-sm font-semibold text-slate-600">
                        {getRelationName(employee.shift)}
                      </p>

                      <div className="flex md:justify-start">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            employee.status === "active"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {formatStatus(employee.status)}
                        </span>
                      </div>

                      <div className="grid gap-2 whitespace-nowrap md:flex md:items-center md:justify-center md:gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditModal(employee);
                          }}
                          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-[#123c8c] px-4 text-xs font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.97] md:h-10 md:rounded-xl md:border md:border-blue-100 md:bg-white md:px-3 md:py-0 md:text-[#123c8c] md:shadow-none md:hover:bg-[#eaf1ff]"
                        >
                          <Edit size={15} />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteEmployee(employee);
                          }}
                          disabled={deletingId === employee.id}
                          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl border border-red-100 bg-red-50 px-4 text-xs font-black text-red-600 transition hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:rounded-xl md:px-3 md:py-0"
                        >
                          <Trash2 size={15} />
                          {deletingId === employee.id ? "..." : "Hapus"}
                        </button>
                      </div>
                    </div>
                  ))}

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
              </div>
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <AppModalMotion>
          <AppModalPanel>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  <Plus size={15} strokeWidth={3} />
                  {editingEmployee ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  {editingEmployee
                    ? "Update Data Karyawan"
                    : "Tambah Karyawan Baru"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeRegisterModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-6 grid gap-4"
            >
              <AppFormReveal delay={20}>
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Full Name
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
              </AppFormReveal>

              <AppFormReveal delay={40}>
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
                      placeholder="employee@creativemu.co.id"
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </AppFormReveal>

              <AppFormReveal delay={60} className="grid gap-4 md:grid-cols-5">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Kantor
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
                          department_id: "",
                          unit_id: "",
                          position_id: "",
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Pilih Kantor</option>
                      {activeOffices.map((office) => (
                        <option key={office.id} value={office.id}>
                          {office.name} - {office.address || "Tanpa alamat"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
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
                          unit_id: "",
                          position_id: "",
                        }))
                      }
                      disabled={!form.registered_office_id}
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {form.registered_office_id
                          ? "Pilih Divisi"
                          : "Pilih Kantor dulu"}
                      </option>
                      {filteredDepartments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Jabatan
                  </label>
                  <div className="app-field-smooth relative rounded-2xl">
                    <BriefcaseBusiness
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={form.position_id}
                      onChange={(event) => {
                        const val = event.target.value;
                        const posObj = positions.find((p) => p.id === val);
                        setForm((prev) => ({
                          ...prev,
                          position_id: val,
                          unit_id: posObj?.unit_id || "",
                        }));
                      }}
                      disabled={!form.department_id}
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {form.department_id ? "Pilih Jabatan" : "Pilih Divisi dulu"}
                      </option>
                      {filteredPositions.map((position) => (
                        <option key={position.id} value={position.id}>
                          {position.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Posisi
                  </label>
                  <div className="app-field-smooth relative rounded-2xl">
                    <Building2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={form.unit_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          unit_id: event.target.value,
                        }))
                      }
                      disabled={!form.department_id}
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {form.department_id
                          ? "Pilih Posisi"
                          : "Pilih Divisi dulu"}
                      </option>
                      {filteredUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Shift Posisi
                  </label>
                  <div className="app-field-smooth relative rounded-2xl">
                    <select
                      value={form.employment_status}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          employment_status: event.target.value as any,
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="">Pilih Shift Posisi</option>
                      <option value="kartap">Karyawan Tetap (Kartap)</option>
                      <option value="kontrak">Kontrak</option>
                      <option value="magang">Magang</option>
                      <option value="pkl">PKL</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </AppFormReveal>

              {form.registered_office_id && filteredDepartments.length === 0 ? (
                <AppFormReveal delay={80}>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-700">
                      Divisi belum tersedia untuk kantor ini
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-700/80">
                      Tambahkan Divisi terlebih dahulu dan hubungkan ke kantor
                      yang dipilih.
                    </p>
                  </div>
                </AppFormReveal>
              ) : null}

              {form.department_id && filteredUnits.length === 0 ? (
                <AppFormReveal delay={80}>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-700">
                      Posisi belum tersedia untuk divisi ini
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-700/80">
                      Tambahkan Posisi terlebih dahulu pada divisi yang dipilih.
                    </p>
                  </div>
                </AppFormReveal>
              ) : null}

              {form.unit_id && filteredPositions.length === 0 ? (
                <AppFormReveal delay={80}>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-700">
                      Jabatan belum tersedia untuk posisi ini
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-700/80">
                      Tambahkan Jabatan terlebih dahulu pada posisi yang dipilih.
                    </p>
                  </div>
                </AppFormReveal>
              ) : null}





                  <AppFormReveal delay={85} className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Tanggal Mulai {form.employment_status === "kartap" ? "Kerja" : "Magang / Kontrak / PKL"}
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <input
                          type="date"
                          value={form.contract_start_date}
                          onChange={(event) =>
                            setForm((prev) => ({
                              ...prev,
                              contract_start_date: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    {form.employment_status && form.employment_status !== "kartap" && (
                      <div>
                        <label className="mb-2 block text-sm font-black text-slate-700">
                          Tanggal Selesai Magang / Kontrak / PKL
                        </label>
                        <div className="app-field-smooth relative rounded-2xl">
                          <input
                            type="date"
                            value={form.contract_end_date}
                            onChange={(event) =>
                              setForm((prev) => ({
                                ...prev,
                                contract_end_date: event.target.value,
                              }))
                            }
                            className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                          />
                        </div>
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-black text-slate-700">
                        Upload SK / Surat Kerja / Surat Kontrak
                      </label>
                      <div className="app-field-smooth relative rounded-2xl">
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setForm((prev) => ({
                                  ...prev,
                                  uploaded_document_url: reader.result as string,
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-2.5 px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                        />
                        {form.uploaded_document_url && (
                          <p className="mt-1 text-xs text-emerald-600 font-bold">
                            ✓ File berhasil diproses
                          </p>
                        )}
                      </div>
                    </div>
                  </AppFormReveal>

              <AppFormReveal delay={100} className="grid gap-4 md:grid-cols-2">
                {!editingEmployee ? (
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Password
                    </label>
                    <div className="app-field-smooth relative rounded-2xl">
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
                        className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                ) : null}

                {!editingEmployee ? (
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Konfirmasi Password
                    </label>
                    <div className="app-field-smooth relative rounded-2xl">
                      <KeyRound
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="password"
                        value={form.confirmTemporaryPassword}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            confirmTemporaryPassword: event.target.value,
                          }))
                        }
                        placeholder="Ulangi password"
                        className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Status
                  </label>
                  <div className="app-field-smooth relative rounded-2xl">
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          status: event.target.value as "active" | "inactive",
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                  </div>
                </div>
              </AppFormReveal>

              <AppFormReveal delay={120}>
                <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                  <p className="text-sm font-black text-[#123c8c]">
                    Catatan Employee
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Kantor dipilih terlebih dahulu. Setelah itu sistem hanya
                    menampilkan Divisi milik kantor tersebut. Unit mengikuti
                    Divisi, Jabatan mengikuti Unit, sedangkan Shift tetap
                    global.
                  </p>
                </div>
              </AppFormReveal>

              <AppFormReveal
                delay={140}
                className="mt-2 flex flex-col-reverse gap-3 md:flex-row md:justify-end"
              >
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
                    : editingEmployee
                      ? "Update Employee"
                      : "Save Employee"}
                </button>
              </AppFormReveal>
            </form>
          </AppModalPanel>
        </AppModalMotion>
      )}

      {employeeAlert && alertTheme ? (
        <div
          className={`employee-alert-enter fixed right-4 top-4 z-[9999] w-[calc(100vw-2rem)] max-w-md transition-all duration-300 ease-out md:right-7 md:top-7 ${
            isAlertClosing
              ? "translate-x-8 scale-95 opacity-0"
              : "translate-x-0 scale-100 opacity-100"
          }`}
        >
          <div
            className={`overflow-hidden rounded-[2rem] border border-white/70 dark:border-[#21262d] bg-gradient-to-br ${alertTheme.shell} shadow-2xl shadow-slate-900/20 backdrop-blur-xl transition-all duration-300 ease-out ${
              isAlertClosing
                ? "translate-y-2 opacity-0"
                : "translate-y-0 opacity-100"
            }`}
          >
            <div className="relative p-5">
              <div className="absolute -left-12 -top-12 h-40 w-40 rounded-full bg-orange-200/30 blur-3xl" />
              <div className="absolute -right-12 -bottom-12 h-40 w-40 rounded-full bg-blue-300/30 blur-3xl" />

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

                  <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950 dark:text-white">
                    {employeeAlert.title}
                  </h3>

                  <p className="mt-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-400">
                    {employeeAlert.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEmployeeAlert}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 active:scale-[0.96]"
                >
                  <X size={22} strokeWidth={2.8} />
                </button>
              </div>
            </div>

            <div className="border-t border-white/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/90 p-4">
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
