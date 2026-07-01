"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type UserRole = "admin" | "employee";

export type EmployeeCategory = "tetap" | "freelance" | "pengajar";

export type AttendanceStatus = "Present" | "Late" | "Absent" | "WFH" | "Cuti";

export type WorkMode = "onsite" | "wfh" | "cuti";

export interface City {
  id: string;
  name: string;
  region: string;
}

export interface Village {
  id: string;
  cityId: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
}

interface GeoPosition {
  latitude: number;
  longitude: number;
}

export interface PaymentCard {
  id: string;
  bankName: string;
  cardHolderName: string;
  accountNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
}

export interface PaymentProfile {
  accountHolderName: string;
  contactEmail: string;
  phoneNumber: string;
  bankName: string;
  payoutLabel: string;
  accountNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  cards: PaymentCard[];
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  employeeCategory: EmployeeCategory;
  cityId: string;
  villageId: string;
  department: string;
  faceRegistered: boolean;
  faceImageUrl?: string;
  rewardPoints: number;
  status: "active" | "inactive";
  paymentProfile?: PaymentProfile;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  cityId: string;
  villageId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  checkInPhotoUrl?: string;
  checkOutPhotoUrl?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  workMode?: WorkMode;
  leaveType?: "cuti" | "sakit";
  leaveLetterUrl?: string;
  workLocationName?: string;
  status: AttendanceStatus;
  lateMinutes: number;
  notes: string;
}

export interface RewardItem {
  id: string;
  employeeId: string;
  title: string;
  amount: number;
  message: string;
  createdAt: string;
}

export interface CreativityEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: "inovasi" | "efisiensi" | "kolaborasi" | "pelatihan";
  points: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  employeeId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface AttendanceOverrideRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  type: "check-in" | "check-out";
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  resolvedAt?: string;
  resolverId?: string;
}

interface AttendanceLocation {
  cityId: string;
  villageId: string;
}

interface AttendanceActionResult {
  success: boolean;
  message: string;
  record?: AttendanceRecord;
}

interface GeofenceUpdateResult {
  success: boolean;
  message: string;
}

interface OverrideActionResult {
  success: boolean;
  message: string;
}

interface ClaimRewardResult {
  success: boolean;
  message: string;
}

export interface AppState {
  cities: City[];
  villages: Village[];
  employees: AppUser[];
  attendance: AttendanceRecord[];
  rewards: RewardItem[];
  creativity: CreativityEntry[];
  notifications: NotificationItem[];
  overrideRequests: AttendanceOverrideRequest[];
}

interface AppDataContextValue {
  state: AppState;
  authUser: AppUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  markAttendance: (
    type: "check-in" | "check-out",
    options?: {
      imageDataUrl?: string;
      location?: AttendanceLocation;
      geo?: GeoPosition;
      workMode?: WorkMode;
      leaveType?: "cuti" | "sakit";
      leaveLetterDataUrl?: string;
      workLocationName?: string;
    },
  ) => AttendanceActionResult;
  registerFace: (employeeId: string, imageDataUrl?: string) => void;
  addEmployee: (
    employee: Omit<
      AppUser,
      "id" | "rewardPoints" | "faceRegistered" | "faceImageUrl" | "status"
    >,
  ) => void;
  addReward: (
    employeeId: string,
    title: string,
    amount: number,
    message: string,
  ) => void;
  submitCreativityEntry: (payload: {
    title: string;
    description: string;
    category: CreativityEntry["category"];
  }) => { success: boolean; message: string };
  updateVillageGeofence: (
    villageId: string,
    payload: {
      latitude: number;
      longitude: number;
      allowedRadiusMeters: number;
    },
  ) => GeofenceUpdateResult;
  submitAttendanceOverrideRequest: (payload: {
    type: "check-in" | "check-out";
    reason: string;
  }) => OverrideActionResult;
  resolveAttendanceOverrideRequest: (
    requestId: string,
    action: "approved" | "rejected",
  ) => OverrideActionResult;
  markNotificationRead: (notificationId: string) => void;
  updatePaymentProfile: (payload: PaymentProfile) => {
    success: boolean;
    message: string;
  };
  claimEmployeeReward: (payload: {
    title: string;
    amount: number;
    message: string;
  }) => ClaimRewardResult;
}

const STORAGE_KEY = "faceattend-state-v1";
const AUTH_KEY = "faceattend-auth-v1";

const emptyPaymentProfile = (): PaymentProfile => ({
  accountHolderName: "",
  contactEmail: "",
  phoneNumber: "",
  bankName: "",
  payoutLabel: "",
  accountNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cvc: "",
  cards: [],
});

const CATEGORY_RULES: Record<
  EmployeeCategory,
  {
    label: string;
    lateThresholdMinutes: number;
    onTimeRewardPoints: number;
    latePenaltyPerFiveMinutes: number;
    minimumLatePenalty: number;
    creativityRewardPoints: number;
  }
> = {
  tetap: {
    label: "Karyawan Tetap",
    lateThresholdMinutes: 8 * 60 + 15,
    onTimeRewardPoints: 10,
    latePenaltyPerFiveMinutes: 2,
    minimumLatePenalty: 4,
    creativityRewardPoints: 10,
  },
  freelance: {
    label: "Freelance",
    lateThresholdMinutes: 9 * 60,
    onTimeRewardPoints: 8,
    latePenaltyPerFiveMinutes: 1,
    minimumLatePenalty: 3,
    creativityRewardPoints: 12,
  },
  pengajar: {
    label: "Pengajar",
    lateThresholdMinutes: 7 * 60 + 45,
    onTimeRewardPoints: 12,
    latePenaltyPerFiveMinutes: 3,
    minimumLatePenalty: 6,
    creativityRewardPoints: 14,
  },
};

const DEPARTMENT_REWARD_MULTIPLIER: Record<string, number> = {
  it: 1.2,
  finance: 1.1,
  marketing: 1.05,
  operations: 1,
  hr: 1,
};

const getDepartmentRewardPoint = (department: string, basePoint: number) => {
  const multiplier =
    DEPARTMENT_REWARD_MULTIPLIER[department.trim().toLowerCase()] ?? 1;
  return Math.max(1, Math.round(basePoint * multiplier));
};

const buildInitialState = (): AppState => ({
  cities: [
    { id: "city-1", name: "Bandung", region: "Kota" },
    { id: "city-2", name: "Surabaya", region: "Kota" },
  ],
  villages: [
    {
      id: "village-1",
      cityId: "city-1",
      name: "Cibeunying",
      type: "desa",
      latitude: -6.9004,
      longitude: 107.6207,
      allowedRadiusMeters: 800,
    },
    {
      id: "village-2",
      cityId: "city-1",
      name: "Kopo",
      type: "cabang",
      latitude: -6.9462,
      longitude: 107.5779,
      allowedRadiusMeters: 800,
    },
    {
      id: "village-3",
      cityId: "city-2",
      name: "Wonocolo",
      type: "desa",
      latitude: -7.3095,
      longitude: 112.7378,
      allowedRadiusMeters: 800,
    },
    {
      id: "village-4",
      cityId: "city-2",
      name: "Rungkut",
      type: "cabang",
      latitude: -7.3336,
      longitude: 112.7598,
      allowedRadiusMeters: 800,
    },
  ],
  employees: [
    {
      id: "EMP001",
      name: "Muhammad Ardian Maulana",
      email: "employee@company.com",
      password: "123456",
      role: "employee",
      employeeCategory: "tetap",
      cityId: "city-1",
      villageId: "village-1",
      department: "IT",
      faceRegistered: true,
      rewardPoints: 120,
      status: "active",
      paymentProfile: {
        accountHolderName: "Muhammad Ardian Maulana",
        contactEmail: "employee@company.com",
        phoneNumber: "081234567890",
        bankName: "BCA",
        payoutLabel: "BCA Payroll",
        accountNumber: "1234567890123456",
        expiryMonth: "12",
        expiryYear: "2028",
        cvc: "321",
        cards: [
          {
            id: "CARD-EMP001-1",
            bankName: "BCA",
            cardHolderName: "Muhammad Ardian Maulana",
            accountNumber: "1234567890123456",
            expiryMonth: "12",
            expiryYear: "2028",
            cvc: "321",
          },
        ],
      },
    },
    {
      id: "EMP002",
      name: "Budi Santoso",
      email: "budi@company.com",
      password: "123456",
      role: "employee",
      employeeCategory: "freelance",
      cityId: "city-1",
      villageId: "village-2",
      department: "Finance",
      faceRegistered: false,
      rewardPoints: 80,
      status: "active",
      paymentProfile: emptyPaymentProfile(),
    },
    {
      id: "EMP003",
      name: "Siti Rahma",
      email: "siti@company.com",
      password: "123456",
      role: "employee",
      employeeCategory: "pengajar",
      cityId: "city-2",
      villageId: "village-3",
      department: "Marketing",
      faceRegistered: true,
      rewardPoints: 95,
      status: "active",
      paymentProfile: emptyPaymentProfile(),
    },
    {
      id: "EMP004",
      name: "Dylan Hazael Raharja",
      email: "dylan@company.com",
      password: "123456",
      role: "employee",
      employeeCategory: "tetap",
      cityId: "city-1",
      villageId: "village-1",
      department: "IT",
      faceRegistered: false,
      rewardPoints: 0,
      status: "active",
      paymentProfile: emptyPaymentProfile(),
    },
    {
      id: "ADM001",
      name: "Admin Creativemu",
      email: "admin@company.com",
      password: "admin123",
      role: "admin",
      employeeCategory: "tetap",
      cityId: "city-1",
      villageId: "village-1",
      department: "Operations",
      faceRegistered: true,
      rewardPoints: 250,
      status: "active",
      paymentProfile: emptyPaymentProfile(),
    },
  ],
  attendance: [
    {
      id: "ATT-1",
      employeeId: "EMP001",
      employeeName: "Muhammad Ardian Maulana",
      cityId: "city-1",
      villageId: "village-1",
      date: "2026-06-30",
      checkIn: "08:02",
      checkOut: "17:04",
      checkInPhotoUrl: "",
      checkOutPhotoUrl: "",
      checkInLatitude: -6.9004,
      checkInLongitude: 107.6207,
      checkOutLatitude: -6.9001,
      checkOutLongitude: 107.6202,
      status: "Present",
      lateMinutes: 2,
      notes: "Masuk tepat waktu setelah verifikasi wajah",
    },
  ],
  rewards: [
    {
      id: "RWD-1",
      employeeId: "EMP001",
      title: "Kinerja Bulan Juni",
      amount: 25,
      message: "Reward langsung masuk setelah absensi konsisten",
      createdAt: "2026-06-30T09:00:00.000Z",
    },
  ],
  creativity: [],
  notifications: [
    {
      id: "NOT-1",
      employeeId: "EMP001",
      title: "Reward Diterima",
      message: "Anda menerima 25 poin reward untuk absensi konsisten",
      createdAt: "2026-06-30T09:00:00.000Z",
      read: false,
    },
  ],
  overrideRequests: [],
});

const getTodayKey = () => new Date().toISOString().slice(0, 10);
const getNowTime = () =>
  new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
const getTimeValue = (time: string | null) => {
  if (!time) return 0;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
};

const getDistanceMeters = (from: GeoPosition, to: GeoPosition) => {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latitudeDiff = toRadians(to.latitude - from.latitude);
  const longitudeDiff = toRadians(to.longitude - from.longitude);
  const latitudeOne = toRadians(from.latitude);
  const latitudeTwo = toRadians(to.latitude);

  const a =
    Math.sin(latitudeDiff / 2) * Math.sin(latitudeDiff / 2) +
    Math.cos(latitudeOne) *
      Math.cos(latitudeTwo) *
      Math.sin(longitudeDiff / 2) *
      Math.sin(longitudeDiff / 2);

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const AppDataContext = createContext<AppDataContextValue | undefined>(
  undefined,
);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(buildInitialState);
  const [authUser, setAuthUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const savedState = window.localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState) as Partial<AppState>;
        const normalizeEmployee = (employee: AppUser): AppUser => ({
          ...employee,
          employeeCategory: employee.employeeCategory ?? "tetap",
          paymentProfile: {
            ...emptyPaymentProfile(),
            ...employee.paymentProfile,
            cards: Array.isArray(employee.paymentProfile?.cards)
              ? employee.paymentProfile.cards
              : [],
          },
        });
        setState({
          ...buildInitialState(),
          ...parsed,
          cities: parsed.cities ?? buildInitialState().cities,
          villages: parsed.villages ?? buildInitialState().villages,
          employees: (parsed.employees ?? buildInitialState().employees).map(
            normalizeEmployee,
          ),
          attendance: parsed.attendance ?? buildInitialState().attendance,
          rewards: parsed.rewards ?? buildInitialState().rewards,
          creativity: parsed.creativity ?? buildInitialState().creativity,
          notifications:
            parsed.notifications ?? buildInitialState().notifications,
          overrideRequests:
            parsed.overrideRequests ?? buildInitialState().overrideRequests,
        });
      }

      const savedAuth = window.localStorage.getItem(AUTH_KEY);
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth) as AppUser;
        setAuthUser({
          ...parsedAuth,
          employeeCategory: parsedAuth.employeeCategory ?? "tetap",
          paymentProfile: {
            ...emptyPaymentProfile(),
            ...parsedAuth.paymentProfile,
            cards: Array.isArray(parsedAuth.paymentProfile?.cards)
              ? parsedAuth.paymentProfile.cards
              : [],
          },
        });
      }
    } catch {
      // Ignore invalid stored data and continue with defaults.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (authUser) {
      window.localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    } else {
      window.localStorage.removeItem(AUTH_KEY);
    }
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const syncedEmployee = state.employees.find(
      (employee) => employee.id === authUser.id,
    );

    if (syncedEmployee && syncedEmployee !== authUser) {
      setAuthUser(syncedEmployee);
    }
  }, [state.employees, authUser]);

  const login = (email: string, password: string) => {
    const match = state.employees.find(
      (employee) => employee.email === email && employee.password === password,
    );

    if (!match) return false;
    setAuthUser(match);
    return true;
  };

  const logout = () => setAuthUser(null);

  const updateEmployeePoints = (
    employeeId: string,
    delta: number,
    title: string,
    message: string,
  ) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              rewardPoints: Math.max(0, employee.rewardPoints + delta),
            }
          : employee,
      ),
      notifications: [
        {
          id: `NOT-${Date.now()}`,
          employeeId,
          title,
          message,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev.notifications,
      ],
    }));
  };

  const markAttendance = (
    type: "check-in" | "check-out",
    options?: {
      imageDataUrl?: string;
      location?: AttendanceLocation;
      geo?: GeoPosition;
      workMode?: WorkMode;
      leaveType?: "cuti" | "sakit";
      leaveLetterDataUrl?: string;
      workLocationName?: string;
    },
  ): AttendanceActionResult => {
    if (!authUser) {
      return {
        success: false,
        message: "Silakan login dulu untuk melakukan absensi.",
      };
    }

    if (authUser.role !== "employee") {
      return {
        success: false,
        message: "Hanya akun karyawan yang dapat melakukan absensi.",
      };
    }

    const imageDataUrl = options?.imageDataUrl;
    const location = options?.location;
    const geo = options?.geo;
    const workMode: WorkMode = options?.workMode || "onsite";
    const leaveType = options?.leaveType;
    const leaveLetterDataUrl = options?.leaveLetterDataUrl;
    const workLocationName = options?.workLocationName;
    const today = getTodayKey();
    const employeeRules = CATEGORY_RULES[authUser.employeeCategory ?? "tetap"];

    const approvedOverride = state.overrideRequests.find(
      (request) =>
        request.employeeId === authUser.id &&
        request.date === today &&
        request.type === type &&
        request.status === "approved",
    );

    if (workMode === "cuti" && type === "check-out") {
      return {
        success: false,
        message: "Cuti/sakit tidak memerlukan check-out.",
      };
    }

    if (workMode === "cuti" && (!leaveType || !leaveLetterDataUrl)) {
      return {
        success: false,
        message: "Surat cuti/sakit wajib dilampirkan.",
      };
    }

    if (workMode === "onsite" && !location) {
      return {
        success: false,
        message: "Pilih lokasi kerja saat ini sebelum absensi.",
      };
    }

    if (
      workMode === "onsite" &&
      location &&
      (location.cityId !== authUser.cityId ||
        location.villageId !== authUser.villageId)
    ) {
      return {
        success: false,
        message:
          "Lokasi tidak sesuai penempatan kerja Anda. Gunakan lokasi yang terdaftar.",
      };
    }

    const assignedVillage =
      workMode === "onsite"
        ? state.villages.find((village) => village.id === authUser.villageId)
        : undefined;

    if (workMode === "onsite" && !assignedVillage) {
      return {
        success: false,
        message: "Lokasi penempatan tidak ditemukan. Hubungi admin.",
      };
    }

    if (
      workMode === "onsite" &&
      assignedVillage &&
      (typeof assignedVillage.latitude !== "number" ||
        typeof assignedVillage.longitude !== "number")
    ) {
      return {
        success: false,
        message: "Koordinat penempatan belum diatur oleh admin.",
      };
    }

    const distanceMeters =
      workMode === "onsite" && geo && assignedVillage
        ? getDistanceMeters(geo, {
            latitude: assignedVillage.latitude,
            longitude: assignedVillage.longitude,
          })
        : 0;

    if (
      !approvedOverride &&
      workMode === "onsite" &&
      geo &&
      assignedVillage &&
      distanceMeters > assignedVillage.allowedRadiusMeters
    ) {
      return {
        success: false,
        message: `Anda berada di luar radius kantor (${Math.round(distanceMeters)} m).`,
      };
    }

    const now = getNowTime();
    const existing = state.attendance.find(
      (record) => record.employeeId === authUser.id && record.date === today,
    );

    if (type === "check-in" && existing?.checkIn) {
      return {
        success: false,
        message: "Check-in hari ini sudah tercatat.",
      };
    }

    if (type === "check-out" && !existing?.checkIn) {
      return {
        success: false,
        message: "Anda belum check-in hari ini.",
      };
    }

    if (type === "check-out" && existing?.checkOut) {
      return {
        success: false,
        message: "Check-out hari ini sudah tercatat.",
      };
    }

    const lateMinutes =
      type === "check-in"
        ? Math.max(0, getTimeValue(now) - employeeRules.lateThresholdMinutes)
        : 0;
    const status: AttendanceStatus =
      workMode === "cuti"
        ? "Cuti"
        : workMode === "wfh"
          ? "WFH"
          : type === "check-in" && lateMinutes > 0
            ? "Late"
            : "Present";

    let nextRecord: AttendanceRecord | undefined;

    const attendanceNote = imageDataUrl
      ? "Attendance recorded • Bukti foto terkirim"
      : "Attendance recorded";
    const attendanceNoteWithGps =
      workMode === "cuti"
        ? `Cuti/Sakit • ${leaveType || "cuti"} • Surat terlampir`
        : workMode === "wfh"
          ? `${attendanceNote} • Mode WFH`
          : approvedOverride
            ? `${attendanceNote} • Override approved`
            : geo
              ? `${attendanceNote} • GPS ${Math.round(distanceMeters)}m`
              : `${attendanceNote} • GPS unavailable`;

    if (existing) {
      setState((prev) => ({
        ...prev,
        attendance: prev.attendance.map((record) => {
          if (record.id !== existing.id) return record;

          const checkInUpdate =
            type === "check-in"
              ? {
                  checkInPhotoUrl: imageDataUrl ?? record.checkInPhotoUrl,
                  checkInLatitude: geo?.latitude ?? record.checkInLatitude,
                  checkInLongitude: geo?.longitude ?? record.checkInLongitude,
                }
              : {};

          const checkOutUpdate =
            type === "check-out"
              ? {
                  checkOutPhotoUrl: imageDataUrl ?? record.checkOutPhotoUrl,
                  checkOutLatitude: geo?.latitude ?? record.checkOutLatitude,
                  checkOutLongitude: geo?.longitude ?? record.checkOutLongitude,
                }
              : {};

          nextRecord = {
            ...record,
            [type === "check-in" ? "checkIn" : "checkOut"]:
              workMode === "cuti" ? null : now,
            status:
              workMode === "cuti"
                ? "Cuti"
                : type === "check-out"
                  ? record.status
                  : status,
            lateMinutes: type === "check-in" ? lateMinutes : record.lateMinutes,
            workMode,
            leaveType,
            leaveLetterUrl: leaveLetterDataUrl || record.leaveLetterUrl,
            workLocationName:
              workLocationName ||
              record.workLocationName ||
              (workMode === "onsite" ? assignedVillage?.name : undefined),
            ...checkInUpdate,
            ...checkOutUpdate,
            notes: attendanceNoteWithGps,
          };
          return {
            ...nextRecord,
          };
        }),
        notifications: [
          {
            id: `NOT-${Date.now()}`,
            employeeId: authUser.id,
            title: `Absensi ${type === "check-in" ? "Masuk" : "Pulang"}`,
            message: `Absensi ${type === "check-in" ? "masuk" : "pulang"} berhasil dicatat untuk ${authUser.name}`,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    } else {
      const createdRecord: AttendanceRecord = {
        id: `ATT-${Date.now()}`,
        employeeId: authUser.id,
        employeeName: authUser.name,
        cityId: authUser.cityId,
        villageId: authUser.villageId,
        date: today,
        checkIn: type === "check-in" && workMode !== "cuti" ? now : null,
        checkOut: type === "check-out" && workMode !== "cuti" ? now : null,
        checkInPhotoUrl: type === "check-in" ? imageDataUrl : undefined,
        checkOutPhotoUrl: type === "check-out" ? imageDataUrl : undefined,
        checkInLatitude: type === "check-in" ? geo?.latitude : undefined,
        checkInLongitude: type === "check-in" ? geo?.longitude : undefined,
        checkOutLatitude: type === "check-out" ? geo?.latitude : undefined,
        checkOutLongitude: type === "check-out" ? geo?.longitude : undefined,
        workMode,
        leaveType,
        leaveLetterUrl: leaveLetterDataUrl,
        workLocationName:
          workLocationName ||
          (workMode === "onsite" ? assignedVillage?.name : undefined),
        status,
        lateMinutes: type === "check-in" ? lateMinutes : 0,
        notes: attendanceNoteWithGps,
      };

      nextRecord = createdRecord;

      setState((prev) => ({
        ...prev,
        attendance: [createdRecord, ...prev.attendance],
        notifications: [
          {
            id: `NOT-${Date.now()}`,
            employeeId: authUser.id,
            title: `Absensi ${type === "check-in" ? "Masuk" : "Pulang"}`,
            message: `Absensi ${type === "check-in" ? "masuk" : "pulang"} berhasil dicatat untuk ${authUser.name}`,
            createdAt: new Date().toISOString(),
            read: false,
          },
          ...prev.notifications,
        ],
      }));
    }

    if (type === "check-in" && lateMinutes === 0 && workMode === "onsite") {
      const adjustedPoint = getDepartmentRewardPoint(
        authUser.department,
        employeeRules.onTimeRewardPoints,
      );

      addReward(
        authUser.id,
        `Absensi Tepat Waktu • ${employeeRules.label}`,
        adjustedPoint,
        `Reward absensi otomatis untuk kategori ${authUser.employeeCategory}`,
      );
    }

    if (type === "check-in" && lateMinutes > 0 && workMode === "onsite") {
      const penalty = Math.max(
        employeeRules.minimumLatePenalty,
        Math.ceil(lateMinutes / 5) * employeeRules.latePenaltyPerFiveMinutes,
      );

      updateEmployeePoints(
        authUser.id,
        -penalty,
        "Poin Dikurangi",
        `Terlambat ${lateMinutes} menit. Poin dikurangi ${penalty} untuk kategori ${authUser.employeeCategory}.`,
      );
    }

    return {
      success: true,
      message:
        workMode === "cuti"
          ? "Pengajuan cuti/sakit berhasil dicatat."
          : `Absensi ${type === "check-in" ? "masuk" : "pulang"} berhasil dicatat.`,
      record: nextRecord,
    };
  };

  const registerFace = (employeeId: string, imageDataUrl?: string) => {
    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              faceRegistered: true,
              faceImageUrl: imageDataUrl ?? employee.faceImageUrl,
            }
          : employee,
      ),
      notifications: [
        {
          id: `NOT-${Date.now()}`,
          employeeId,
          title: "Wajah Terdaftar",
          message: "Data wajah berhasil disimpan untuk karyawan ini",
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev.notifications,
      ],
    }));
  };

  const addEmployee = (
    employee: Omit<
      AppUser,
      "id" | "rewardPoints" | "faceRegistered" | "faceImageUrl" | "status"
    >,
  ) => {
    const nextEmployee: AppUser = {
      id: `EMP${String(Date.now()).slice(-3)}`,
      rewardPoints: 0,
      faceRegistered: false,
      faceImageUrl: undefined,
      status: "active",
      paymentProfile: emptyPaymentProfile(),
      ...employee,
    };

    setState((prev) => ({
      ...prev,
      employees: [nextEmployee, ...prev.employees],
    }));
  };

  const addReward = (
    employeeId: string,
    title: string,
    amount: number,
    message: string,
  ) => {
    const reward: RewardItem = {
      id: `RWD-${Date.now()}`,
      employeeId,
      title,
      amount,
      message,
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      rewards: [reward, ...prev.rewards],
      employees: prev.employees.map((employee) =>
        employee.id === employeeId
          ? { ...employee, rewardPoints: employee.rewardPoints + amount }
          : employee,
      ),
      notifications: [
        {
          id: `NOT-${Date.now()}`,
          employeeId,
          title: "Reward Baru",
          message,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev.notifications,
      ],
    }));
  };

  const submitCreativityEntry = (payload: {
    title: string;
    description: string;
    category: CreativityEntry["category"];
  }) => {
    if (!authUser || authUser.role !== "employee") {
      return {
        success: false,
        message: "Hanya karyawan yang dapat menginput kreativitas.",
      };
    }

    if (!payload.title.trim() || !payload.description.trim()) {
      return {
        success: false,
        message: "Judul dan deskripsi kreativitas wajib diisi.",
      };
    }

    const rewardPoints = getDepartmentRewardPoint(
      authUser.department,
      CATEGORY_RULES[authUser.employeeCategory].creativityRewardPoints,
    );
    const createdAt = new Date().toISOString();
    const entry: CreativityEntry = {
      id: `CRT-${Date.now()}`,
      employeeId: authUser.id,
      employeeName: authUser.name,
      title: payload.title.trim(),
      description: payload.description.trim(),
      category: payload.category,
      points: rewardPoints,
      createdAt,
    };

    setState((prev) => ({
      ...prev,
      creativity: [entry, ...prev.creativity],
      employees: prev.employees.map((employee) =>
        employee.id === authUser.id
          ? { ...employee, rewardPoints: employee.rewardPoints + rewardPoints }
          : employee,
      ),
      rewards: [
        {
          id: `RWD-${Date.now()}`,
          employeeId: authUser.id,
          title: `Reward Kreativitas • ${payload.title.trim()}`,
          amount: rewardPoints,
          message: `Kreativitas berhasil dicatat untuk kategori ${authUser.employeeCategory}`,
          createdAt,
        },
        ...prev.rewards,
      ],
      notifications: [
        {
          id: `NOT-${Date.now()}`,
          employeeId: authUser.id,
          title: "Reward Kreativitas",
          message: `Kreativitas \"${payload.title.trim()}\" mendapat ${rewardPoints} poin.`,
          createdAt,
          read: false,
        },
        ...prev.notifications,
      ],
    }));

    return {
      success: true,
      message: `Kreativitas berhasil dicatat dan mendapat ${rewardPoints} poin reward.`,
    };
  };

  const updateVillageGeofence = (
    villageId: string,
    payload: {
      latitude: number;
      longitude: number;
      allowedRadiusMeters: number;
    },
  ): GeofenceUpdateResult => {
    if (!authUser || authUser.role !== "admin") {
      return {
        success: false,
        message: "Hanya admin yang dapat mengubah pengaturan geofence.",
      };
    }

    const latitude = Number(payload.latitude);
    const longitude = Number(payload.longitude);
    const allowedRadiusMeters = Number(payload.allowedRadiusMeters);

    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return {
        success: false,
        message: "Latitude tidak valid. Gunakan rentang -90 sampai 90.",
      };
    }

    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return {
        success: false,
        message: "Longitude tidak valid. Gunakan rentang -180 sampai 180.",
      };
    }

    if (
      !Number.isFinite(allowedRadiusMeters) ||
      allowedRadiusMeters < 50 ||
      allowedRadiusMeters > 5000
    ) {
      return {
        success: false,
        message: "Radius harus di antara 50 dan 5000 meter.",
      };
    }

    const targetVillage = state.villages.find(
      (village) => village.id === villageId,
    );
    if (!targetVillage) {
      return {
        success: false,
        message: "Lokasi cabang tidak ditemukan.",
      };
    }

    setState((prev) => ({
      ...prev,
      villages: prev.villages.map((village) =>
        village.id === villageId
          ? {
              ...village,
              latitude,
              longitude,
              allowedRadiusMeters,
            }
          : village,
      ),
    }));

    return {
      success: true,
      message: `Geofence ${targetVillage.name} berhasil diperbarui.`,
    };
  };

  const submitAttendanceOverrideRequest = (payload: {
    type: "check-in" | "check-out";
    reason: string;
  }): OverrideActionResult => {
    if (!authUser || authUser.role !== "employee") {
      return {
        success: false,
        message: "Hanya karyawan yang dapat mengajukan override absensi.",
      };
    }

    if (!payload.reason.trim()) {
      return {
        success: false,
        message: "Alasan override wajib diisi.",
      };
    }

    const today = getTodayKey();
    const existingPending = state.overrideRequests.find(
      (request) =>
        request.employeeId === authUser.id &&
        request.date === today &&
        request.type === payload.type &&
        request.status === "pending",
    );

    if (existingPending) {
      return {
        success: false,
        message:
          "Pengajuan override untuk aksi ini masih menunggu persetujuan.",
      };
    }

    const nextRequest: AttendanceOverrideRequest = {
      id: `OVR-${Date.now()}`,
      employeeId: authUser.id,
      employeeName: authUser.name,
      date: today,
      type: payload.type,
      reason: payload.reason.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setState((prev) => ({
      ...prev,
      overrideRequests: [nextRequest, ...prev.overrideRequests],
      notifications: [
        {
          id: `NOT-${Date.now()}`,
          employeeId: authUser.id,
          title: "Pengajuan Override Dikirim",
          message: `Pengajuan override ${payload.type} berhasil dikirim ke admin.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev.notifications,
      ],
    }));

    return {
      success: true,
      message: "Pengajuan override berhasil dikirim. Tunggu persetujuan admin.",
    };
  };

  const resolveAttendanceOverrideRequest = (
    requestId: string,
    action: "approved" | "rejected",
  ): OverrideActionResult => {
    if (!authUser || authUser.role !== "admin") {
      return {
        success: false,
        message: "Hanya admin yang dapat memproses override.",
      };
    }

    const current = state.overrideRequests.find(
      (request) => request.id === requestId,
    );

    if (!current) {
      return {
        success: false,
        message: "Permintaan override tidak ditemukan.",
      };
    }

    if (current.status !== "pending") {
      return {
        success: false,
        message: "Permintaan override ini sudah diproses.",
      };
    }

    const resolvedAt = new Date().toISOString();

    setState((prev) => ({
      ...prev,
      overrideRequests: prev.overrideRequests.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status: action,
              resolvedAt,
              resolverId: authUser.id,
            }
          : request,
      ),
      notifications: [
        {
          id: `NOT-${Date.now()}`,
          employeeId: current.employeeId,
          title: `Override ${action === "approved" ? "Disetujui" : "Ditolak"}`,
          message:
            action === "approved"
              ? `Override ${current.type} Anda disetujui admin.`
              : `Override ${current.type} Anda ditolak admin.`,
          createdAt: resolvedAt,
          read: false,
        },
        ...prev.notifications,
      ],
    }));

    return {
      success: true,
      message:
        action === "approved"
          ? "Override berhasil disetujui."
          : "Override berhasil ditolak.",
    };
  };

  const markNotificationRead = (notificationId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((item) =>
        item.id === notificationId ? { ...item, read: true } : item,
      ),
    }));
  };

  const updatePaymentProfile = (payload: PaymentProfile) => {
    if (!authUser || authUser.role !== "employee") {
      return {
        success: false,
        message: "Hanya karyawan yang dapat memperbarui rekening reward.",
      };
    }

    if (
      !payload.accountHolderName.trim() ||
      !payload.contactEmail.trim() ||
      !payload.phoneNumber.trim() ||
      !payload.bankName.trim() ||
      !payload.payoutLabel.trim() ||
      !payload.accountNumber.trim()
    ) {
      return {
        success: false,
        message:
          "Nama, email, no hp, bank asal, label rekening, dan no rekening wajib diisi.",
      };
    }

    const isValidPrimaryAccount = /^\d{16}$/.test(payload.accountNumber.trim());
    if (!isValidPrimaryAccount) {
      return {
        success: false,
        message: "No rekening utama harus tepat 16 digit angka.",
      };
    }

    const hasInvalidCard = (payload.cards || []).some(
      (card) =>
        !card.bankName.trim() ||
        !card.cardHolderName.trim() ||
        !/^\d{16}$/.test(card.accountNumber.trim()),
    );

    if (hasInvalidCard) {
      return {
        success: false,
        message:
          "Semua kartu tambahan wajib punya bank asal, atas nama, dan no rekening 16 digit.",
      };
    }

    const nextProfile: PaymentProfile = {
      accountHolderName: payload.accountHolderName.trim(),
      contactEmail: payload.contactEmail.trim(),
      phoneNumber: payload.phoneNumber.trim(),
      bankName: payload.bankName.trim(),
      payoutLabel: payload.payoutLabel.trim(),
      accountNumber: payload.accountNumber.trim(),
      expiryMonth: payload.expiryMonth.trim(),
      expiryYear: payload.expiryYear.trim(),
      cvc: payload.cvc.trim(),
      cards: (payload.cards || []).map((card) => ({
        id: card.id,
        bankName: card.bankName.trim(),
        cardHolderName: card.cardHolderName.trim(),
        accountNumber: card.accountNumber.trim(),
        expiryMonth: card.expiryMonth.trim(),
        expiryYear: card.expiryYear.trim(),
        cvc: card.cvc.trim(),
      })),
    };

    setState((prev) => ({
      ...prev,
      employees: prev.employees.map((employee) =>
        employee.id === authUser.id
          ? {
              ...employee,
              paymentProfile: nextProfile,
            }
          : employee,
      ),
      notifications: [
        {
          id: `NOT-${Date.now()}`,
          employeeId: authUser.id,
          title: "Rekening Reward Diperbarui",
          message: `Data rekening reward untuk ${nextProfile.payoutLabel} berhasil disimpan.`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev.notifications,
      ],
    }));

    return {
      success: true,
      message: "Data rekening reward berhasil diperbarui.",
    };
  };

  const claimEmployeeReward = (payload: {
    title: string;
    amount: number;
    message: string;
  }): ClaimRewardResult => {
    if (!authUser || authUser.role !== "employee") {
      return {
        success: false,
        message: "Hanya karyawan yang dapat melakukan claim reward.",
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    const alreadyClaimed = state.rewards.some(
      (reward) =>
        reward.employeeId === authUser.id &&
        reward.title === payload.title &&
        reward.createdAt.slice(0, 10) === today,
    );

    if (alreadyClaimed) {
      return {
        success: false,
        message: `Reward ${payload.title} sudah di-claim hari ini.`,
      };
    }

    const createdAt = new Date().toISOString();
    const adjustedAmount = getDepartmentRewardPoint(
      authUser.department,
      payload.amount,
    );

    setState((prev) => ({
      ...prev,
      rewards: [
        {
          id: `RWD-${Date.now()}`,
          employeeId: authUser.id,
          title: payload.title,
          amount: adjustedAmount,
          message: payload.message,
          createdAt,
        },
        ...prev.rewards,
      ],
      employees: prev.employees.map((employee) =>
        employee.id === authUser.id
          ? {
              ...employee,
              rewardPoints: employee.rewardPoints + adjustedAmount,
            }
          : employee,
      ),
      notifications: [
        {
          id: `NOT-${Date.now()}`,
          employeeId: authUser.id,
          title: `Claim Reward • ${payload.title}`,
          message: `${payload.message} (+${adjustedAmount} poin)`,
          createdAt,
          read: false,
        },
        ...prev.notifications,
      ],
    }));

    return {
      success: true,
      message: `${payload.title} berhasil di-claim dan mendapat +${adjustedAmount} poin (bidang ${authUser.department}).`,
    };
  };

  const value = useMemo(
    () => ({
      state,
      authUser,
      login,
      logout,
      markAttendance,
      registerFace,
      addEmployee,
      addReward,
      submitCreativityEntry,
      updateVillageGeofence,
      submitAttendanceOverrideRequest,
      resolveAttendanceOverrideRequest,
      markNotificationRead,
      updatePaymentProfile,
      claimEmployeeReward,
    }),
    [state, authUser],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used inside AppDataProvider");
  }
  return context;
}
