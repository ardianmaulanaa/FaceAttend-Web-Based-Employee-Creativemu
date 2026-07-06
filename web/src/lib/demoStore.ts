type DemoRole = "owner" | "admin" | "cs" | "employee";
type DemoStatus = "active" | "inactive";

export type DemoPayrollMethod = {
  id: string;
  bankName: string;
  cardType: string;
  accountNumber: string;
  accountHolderName: string;
  expiryMonth: string;
  expiryYear: string;
};

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: DemoRole;
  employee_category: "magang" | "tetap";
  department: string | null;
  position: string | null;
  phone: string | null;
  profile_photo_url: string | null;
  payout_label: string | null;
  account_holder_name: string | null;
  payout_contact_email: string | null;
  payout_phone_number: string | null;
  account_number: string | null;
  expiry_month: string | null;
  expiry_year: string | null;
  cvc: string | null;
  payroll_methods: DemoPayrollMethod[];
  payroll_status: "paid" | "unpaid";
  city_id: string | null;
  village_id: string | null;
  status: DemoStatus;
  must_change_password: boolean;
  created_at: Date;
};

export type DemoAttendance = {
  id: string;
  employee_id: string;
  attendance_date: string;
  check_in_time: Date | null;
  check_out_time: Date | null;
  check_in_photo_url: string | null;
  check_out_photo_url: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  work_mode: "onsite" | "wfh" | "cuti" | "office" | "visit" | "flexible";
  leave_type: "cuti" | "sakit" | null;
  leave_letter_url: string | null;
  work_location_name: string | null;
  notes: string | null;
  late_reason?: string | null;
  is_over_tolerance?: boolean | null;
  late_minutes?: number | null;
  late_seconds?: number | null;
  status?: string | null;
  scheduled_check_in?: Date | null;
  scheduled_check_out?: Date | null;
};

export type DemoAttendanceNotification = {
  id: string;
  type: "check-in" | "check-out" | "absent";
  employeeName: string;
  happenedAt: string;
  message: string;
};

export type DemoRoleNotification = {
  id: string;
  type: "check-in" | "check-out" | "absent" | "complaint" | "call";
  employeeName: string;
  happenedAt: string;
  message: string;
};

const demoUsers: DemoUser[] = [
  {
    id: "OWN-DEMO-001",
    name: "Owner Creativemu",
    email: "owner@creativemu.co.id",
    password: "123456",
    role: "owner",
    employee_category: "tetap",
    department: "Management",
    position: "Owner",
    phone: "081234000010",
    profile_photo_url: null,
    payout_label: "Payroll BCA",
    account_holder_name: "Owner Creativemu",
    payout_contact_email: "owner@creativemu.co.id",
    payout_phone_number: "081234000010",
    account_number: "1234500010",
    expiry_month: "12",
    expiry_year: "30",
    cvc: "***",
    payroll_methods: [
      {
        id: "PM-OWN-001",
        bankName: "BCA",
        cardType: "GPN",
        accountNumber: "1234500010",
        accountHolderName: "Owner Creativemu",
        expiryMonth: "12",
        expiryYear: "30",
      },
    ],
    payroll_status: "paid",
    city_id: "city-1",
    village_id: "village-1",
    status: "active",
    must_change_password: false,
    created_at: new Date("2026-06-01T07:00:00.000Z"),
  },
  {
    id: "ADM-DEMO-001",
    name: "Admin Creativemu",
    email: "admin@creativemu.co.id",
    password: "123456",
    role: "admin",
    employee_category: "tetap",
    department: "Operations",
    position: "HR Admin",
    phone: "081234000001",
    profile_photo_url: null,
    payout_label: "Payroll BCA",
    account_holder_name: "Admin Creativemu",
    payout_contact_email: "admin@creativemu.co.id",
    payout_phone_number: "081234000001",
    account_number: "1234567890",
    expiry_month: "12",
    expiry_year: "29",
    cvc: "***",
    payroll_methods: [
      {
        id: "PM-ADM-001",
        bankName: "BCA",
        cardType: "GPN",
        accountNumber: "1234567890",
        accountHolderName: "Admin Creativemu",
        expiryMonth: "12",
        expiryYear: "29",
      },
    ],
    payroll_status: "paid",
    city_id: "city-1",
    village_id: "village-1",
    status: "active",
    must_change_password: false,
    created_at: new Date("2026-06-01T08:00:00.000Z"),
  },
  {
    id: "CS-DEMO-001",
    name: "CS Creativemu",
    email: "cs@creativemu.co.id",
    password: "123456",
    role: "cs",
    employee_category: "tetap",
    department: "Customer Service",
    position: "Customer Service",
    phone: "081234000011",
    profile_photo_url: null,
    payout_label: "Payroll BNI",
    account_holder_name: "CS Creativemu",
    payout_contact_email: "cs@creativemu.co.id",
    payout_phone_number: "081234000011",
    account_number: "1234500011",
    expiry_month: "10",
    expiry_year: "29",
    cvc: "***",
    payroll_methods: [
      {
        id: "PM-CS-001",
        bankName: "BNI",
        cardType: "Debit",
        accountNumber: "1234500011",
        accountHolderName: "CS Creativemu",
        expiryMonth: "10",
        expiryYear: "29",
      },
    ],
    payroll_status: "paid",
    city_id: "city-1",
    village_id: "village-1",
    status: "active",
    must_change_password: false,
    created_at: new Date("2026-06-01T08:30:00.000Z"),
  },
  {
    id: "EMP-DEMO-001",
    name: "Employee Demo",
    email: "employee@company.com",
    password: "123456",
    role: "employee",
    employee_category: "magang",
    department: "IT",
    position: "Frontend Developer",
    phone: "081234000002",
    profile_photo_url: null,
    payout_label: "Payroll Mandiri",
    account_holder_name: "Employee Demo",
    payout_contact_email: "employee@company.com",
    payout_phone_number: "081234000002",
    account_number: "9876543210",
    expiry_month: "10",
    expiry_year: "30",
    cvc: "***",
    payroll_methods: [
      {
        id: "PM-EMP-001",
        bankName: "Mandiri",
        cardType: "Visa",
        accountNumber: "9876543210",
        accountHolderName: "Employee Demo",
        expiryMonth: "10",
        expiryYear: "30",
      },
    ],
    payroll_status: "unpaid",
    city_id: "city-1",
    village_id: "village-1",
    status: "active",
    must_change_password: false,
    created_at: new Date("2026-06-02T08:00:00.000Z"),
  },
];

export const attendanceStore = new Map<string, DemoAttendance>();

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function isDatabaseUnavailable(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("econnrefused") ||
    message.includes("pool timeout") ||
    message.includes("driveradaptererror")
  );
}

export function findDemoUserByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const legacyEmail = normalizedEmail.replace(
    "@creativemu.com",
    "@creativemu.co.id",
  );
  const employeeAliases = new Set([
    "employee@company.com",
    "employee@creativemu.co.id",
    "employee@creativemu.com",
  ]);

  if (employeeAliases.has(normalizedEmail)) {
    const employeeUser = demoUsers.find((item) => item.id === "EMP-DEMO-001");
    if (employeeUser) {
      return employeeUser;
    }
  }

  return demoUsers.find(
    (item) =>
      item.email.toLowerCase() === normalizedEmail ||
      item.email.toLowerCase() === legacyEmail,
  );
}

export function findDemoUserById(id: string) {
  return demoUsers.find((item) => item.id === id);
}

export function listDemoUsers() {
  return [...demoUsers].sort(
    (a, b) => b.created_at.getTime() - a.created_at.getTime(),
  );
}

export function addDemoEmployee(payload: {
  name: string;
  email: string;
  temporaryPassword?: string;
  department?: string;
  position?: string;
  phone?: string;
  role?: string;
  employeeCategory?: string;
  profilePhotoUrl?: string;
  payrollMethods?: Array<{
    bankName: string;
    cardType: string;
    accountNumber: string;
    accountHolderName: string;
    expiryMonth?: string;
    expiryYear?: string;
  }>;
  payrollStatus?: string;
  status?: string;
}) {
  const exists = findDemoUserByEmail(payload.email);
  if (exists) return null;

  const methods = (payload.payrollMethods || [])
    .filter((method) => method.bankName && method.accountNumber)
    .map((method, index) => ({
      id: `PM-${Date.now()}-${index}`,
      bankName: method.bankName,
      cardType: method.cardType || "Debit",
      accountNumber: method.accountNumber,
      accountHolderName: method.accountHolderName || payload.name,
      expiryMonth: method.expiryMonth || "",
      expiryYear: method.expiryYear || "",
    }));

  const primaryMethod = methods[0] || null;

  const normalizedRole: DemoRole =
    payload.role === "owner"
      ? "owner"
      : payload.role === "admin"
        ? "admin"
        : payload.role === "cs"
          ? "cs"
          : "employee";

  const nextUser: DemoUser = {
    id: `USR-DEMO-${Date.now()}`,
    name: payload.name,
    email: payload.email,
    password: payload.temporaryPassword || "Welcome123!",
    role: normalizedRole,
    employee_category:
      payload.employeeCategory === "magang" ? "magang" : "tetap",
    department: payload.department || null,
    position: payload.position || null,
    phone: payload.phone || null,
    profile_photo_url: payload.profilePhotoUrl || null,
    payout_label: primaryMethod ? `Payroll ${primaryMethod.bankName}` : null,
    account_holder_name: primaryMethod?.accountHolderName || null,
    payout_contact_email: payload.email,
    payout_phone_number: payload.phone || null,
    account_number: primaryMethod?.accountNumber || null,
    expiry_month: primaryMethod?.expiryMonth || null,
    expiry_year: primaryMethod?.expiryYear || null,
    cvc: null,
    payroll_methods: methods,
    payroll_status: payload.payrollStatus === "paid" ? "paid" : "unpaid",
    city_id: "city-1",
    village_id: "village-1",
    status: payload.status === "inactive" ? "inactive" : "active",
    must_change_password: true,
    created_at: new Date(),
  };

  demoUsers.unshift(nextUser);
  return nextUser;
}

export function updateDemoEmployee(
  userId: string,
  payload: {
    name?: string;
    email?: string;
    department?: string;
    position?: string;
    phone?: string;
    role?: string;
    employeeCategory?: string;
    profilePhotoUrl?: string;
    payrollMethods?: Array<{
      bankName: string;
      cardType: string;
      accountNumber: string;
      accountHolderName: string;
      expiryMonth?: string;
      expiryYear?: string;
    }>;
    payrollStatus?: string;
    status?: string;
  },
) {
  const user = demoUsers.find((item) => item.id === userId);
  if (!user) return null;

  const methods = (payload.payrollMethods || [])
    .filter((method) => method.bankName && method.accountNumber)
    .map((method, index) => ({
      id: `PM-${Date.now()}-${index}`,
      bankName: method.bankName,
      cardType: method.cardType || "Debit",
      accountNumber: method.accountNumber,
      accountHolderName: method.accountHolderName || payload.name || user.name,
      expiryMonth: method.expiryMonth || "",
      expiryYear: method.expiryYear || "",
    }));

  const primaryMethod = methods[0] || null;

  user.name = payload.name || user.name;
  user.email = payload.email || user.email;
  user.department = payload.department || null;
  user.position = payload.position || null;
  user.phone = payload.phone || null;
  user.role =
    payload.role === "owner"
      ? "owner"
      : payload.role === "admin"
        ? "admin"
        : payload.role === "cs"
          ? "cs"
          : "employee";
  user.employee_category =
    payload.employeeCategory === "magang" ? "magang" : "tetap";
  user.profile_photo_url = payload.profilePhotoUrl || null;
  user.status = payload.status === "inactive" ? "inactive" : "active";
  user.payroll_methods = methods;
  user.payroll_status = payload.payrollStatus === "paid" ? "paid" : "unpaid";
  user.payout_label = primaryMethod
    ? `Payroll ${primaryMethod.bankName}`
    : null;
  user.account_holder_name = primaryMethod?.accountHolderName || null;
  user.payout_contact_email = user.email;
  user.payout_phone_number = user.phone || null;
  user.account_number = primaryMethod?.accountNumber || null;
  user.expiry_month = primaryMethod?.expiryMonth || null;
  user.expiry_year = primaryMethod?.expiryYear || null;

  return user;
}

export function removeDemoEmployee(userId: string) {
  const targetIndex = demoUsers.findIndex((item) => item.id === userId);
  if (targetIndex < 0) return false;

  if (demoUsers[targetIndex].role !== "employee") {
    return false;
  }

  demoUsers.splice(targetIndex, 1);

  for (const key of attendanceStore.keys()) {
    if (key.startsWith(`${userId}-`)) {
      attendanceStore.delete(key);
    }
  }

  return true;
}

export function updateDemoUserProfile(
  userId: string,
  payload: {
    name?: string;
    email?: string;
    phone?: string;
    profilePhotoUrl?: string;
  },
) {
  const user = demoUsers.find((item) => item.id === userId);
  if (!user) {
    return { ok: false as const, reason: "not-found" as const };
  }

  const nextEmail = String(payload.email || user.email)
    .trim()
    .toLowerCase();
  const conflict = demoUsers.find(
    (item) => item.id !== userId && item.email.toLowerCase() === nextEmail,
  );

  if (conflict) {
    return { ok: false as const, reason: "email-exists" as const };
  }

  user.name = String(payload.name || user.name).trim() || user.name;
  user.email = nextEmail || user.email;
  user.phone = String(payload.phone || "").trim() || null;
  user.profile_photo_url = String(payload.profilePhotoUrl || "").trim() || null;
  user.payout_contact_email = user.email;
  user.payout_phone_number = user.phone;

  return { ok: true as const, user };
}

export function getDemoAttendanceForToday(employeeId: string) {
  const key = `${employeeId}-${getDateKey(new Date())}`;
  return attendanceStore.get(key);
}

export function saveDemoCheckIn(payload: {
  employeeId: string;
  imageDataUrl?: string;
  latitude?: number;
  longitude?: number;
  workMode?: "onsite" | "wfh" | "cuti";
  leaveType?: "cuti" | "sakit";
  leaveLetterDataUrl?: string;
  workLocationName?: string;
  notes?: string;
}) {
  const dateKey = getDateKey(new Date());
  const key = `${payload.employeeId}-${dateKey}`;
  const existing = attendanceStore.get(key);
  const workMode = payload.workMode || "onsite";

  if (workMode !== "cuti" && existing?.check_in_time) {
    return { ok: false as const, reason: "already-checkin" };
  }

  if (workMode === "cuti") {
    if (!payload.leaveType || !payload.leaveLetterDataUrl) {
      return { ok: false as const, reason: "missing-leave-document" };
    }
  }

  const now = new Date();
  const nextRecord: DemoAttendance = {
    id: existing?.id || `ATT-DEMO-${Date.now()}`,
    employee_id: payload.employeeId,
    attendance_date: dateKey,
    check_in_time: workMode === "cuti" ? null : now,
    check_out_time:
      workMode === "cuti" ? null : existing?.check_out_time || null,
    check_in_photo_url:
      workMode === "cuti" ? null : payload.imageDataUrl || null,
    check_out_photo_url: existing?.check_out_photo_url || null,
    check_in_latitude: workMode === "onsite" ? payload.latitude || null : null,
    check_in_longitude:
      workMode === "onsite" ? payload.longitude || null : null,
    check_out_latitude: existing?.check_out_latitude || null,
    check_out_longitude: existing?.check_out_longitude || null,
    work_mode: workMode,
    leave_type: workMode === "cuti" ? payload.leaveType || null : null,
    leave_letter_url:
      workMode === "cuti" ? payload.leaveLetterDataUrl || null : null,
    work_location_name: payload.workLocationName || null,
    notes: payload.notes?.trim() ? payload.notes.trim().slice(0, 255) : null,
  };

  attendanceStore.set(key, nextRecord);
  return { ok: true as const, record: nextRecord };
}

export function saveDemoCheckOut(payload: {
  employeeId: string;
  imageDataUrl: string;
  latitude?: number;
  longitude?: number;
  workMode?: "onsite" | "wfh";
  workLocationName?: string;
  notes?: string;
}) {
  const dateKey = getDateKey(new Date());
  const key = `${payload.employeeId}-${dateKey}`;
  const existing = attendanceStore.get(key);
  const workMode = payload.workMode || existing?.work_mode || "onsite";

  if (!existing?.check_in_time) {
    return { ok: false as const, reason: "missing-checkin" };
  }

  if (existing.work_mode === "cuti") {
    return { ok: false as const, reason: "leave-day" };
  }

  if (existing.check_out_time) {
    return { ok: false as const, reason: "already-checkout" };
  }

  const nextRecord: DemoAttendance = {
    ...existing,
    check_out_time: new Date(),
    check_out_photo_url: payload.imageDataUrl,
    check_out_latitude: workMode === "onsite" ? payload.latitude || null : null,
    check_out_longitude:
      workMode === "onsite" ? payload.longitude || null : null,
    work_mode: workMode,
    work_location_name: payload.workLocationName || existing.work_location_name,
    notes: payload.notes?.trim()
      ? payload.notes.trim().slice(0, 255)
      : existing.notes,
  };

  attendanceStore.set(key, nextRecord);
  return { ok: true as const, record: nextRecord };
}

export function listDemoAttendanceNotifications() {
  const notifications: DemoAttendanceNotification[] = [];

  for (const record of attendanceStore.values()) {
    const employee = demoUsers.find((item) => item.id === record.employee_id);
    const employeeName = employee?.name || "Karyawan";

    if (record.check_in_time) {
      notifications.push({
        id: `${record.id}-check-in`,
        type: "check-in",
        employeeName,
        happenedAt: record.check_in_time.toISOString(),
        message: `${employeeName} melakukan check-in`,
      });
    }

    if (record.check_out_time) {
      notifications.push({
        id: `${record.id}-check-out`,
        type: "check-out",
        employeeName,
        happenedAt: record.check_out_time.toISOString(),
        message: `${employeeName} melakukan check-out`,
      });
    }
  }

  return notifications.sort((a, b) => b.happenedAt.localeCompare(a.happenedAt));
}

export function listDemoCustomerServiceNotifications() {
  const now = Date.now();
  const nowIso = (offsetMinutes: number) =>
    new Date(now - offsetMinutes * 60 * 1000).toISOString();

  const csItems: DemoRoleNotification[] = [
    {
      id: "CS-DEMO-NOTIF-1",
      type: "complaint",
      employeeName: "Customer A",
      happenedAt: nowIso(7),
      message: "Keluhan: Aplikasi sulit login, mohon ditindaklanjuti.",
    },
    {
      id: "CS-DEMO-NOTIF-2",
      type: "call",
      employeeName: "Customer B",
      happenedAt: nowIso(19),
      message: "Panggilan masuk: Permintaan update status tiket #CS-091.",
    },
    {
      id: "CS-DEMO-NOTIF-3",
      type: "complaint",
      employeeName: "Customer C",
      happenedAt: nowIso(38),
      message: "Keluhan: Verifikasi pembayaran belum terkonfirmasi.",
    },
  ];

  return csItems;
}

export function listDemoRoleNotifications(
  role: string,
): DemoRoleNotification[] {
  if (role === "cs") {
    return listDemoCustomerServiceNotifications();
  }

  return listDemoAttendanceNotifications();
}

export function setDemoAttendanceLateReason(payload: {
  employeeId: string;
  reason: string;
}) {
  const key = `${payload.employeeId}-${getDateKey(new Date())}`;
  const existing = attendanceStore.get(key);

  if (!existing?.check_in_time) {
    return { ok: false as const, reason: "missing-checkin" as const };
  }

  const reason = payload.reason.trim();
  if (!reason) {
    return { ok: false as const, reason: "missing-reason" as const };
  }

  existing.notes = `Late reason: ${reason}`.slice(0, 255);
  attendanceStore.set(key, existing);
  return { ok: true as const, record: existing };
}
