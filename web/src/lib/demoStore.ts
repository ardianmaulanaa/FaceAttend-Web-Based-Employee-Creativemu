type DemoRole = "admin" | "employee";
type DemoStatus = "active" | "inactive";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: DemoRole;
  department: string | null;
  position: string | null;
  phone: string | null;
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
  notes: string | null;
};

const demoUsers: DemoUser[] = [
  {
    id: "ADM-DEMO-001",
    name: "Admin Creativemu",
    email: "admin@creativemu.com",
    password: "admin123456",
    role: "admin",
    department: "Operations",
    position: "HR Admin",
    phone: "081234000001",
    city_id: "city-1",
    village_id: "village-1",
    status: "active",
    must_change_password: false,
    created_at: new Date("2026-06-01T08:00:00.000Z"),
  },
  {
    id: "EMP-DEMO-001",
    name: "Employee Demo",
    email: "employee@company.com",
    password: "123456",
    role: "employee",
    department: "IT",
    position: "Frontend Developer",
    phone: "081234000002",
    city_id: "city-1",
    village_id: "village-1",
    status: "active",
    must_change_password: false,
    created_at: new Date("2026-06-02T08:00:00.000Z"),
  },
];

const attendanceStore = new Map<string, DemoAttendance>();

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
  return demoUsers.find(
    (item) => item.email.toLowerCase() === email.toLowerCase(),
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
  temporaryPassword: string;
  department?: string;
  position?: string;
  phone?: string;
  role?: string;
  status?: string;
}) {
  const exists = findDemoUserByEmail(payload.email);
  if (exists) return null;

  const nextUser: DemoUser = {
    id: `USR-DEMO-${Date.now()}`,
    name: payload.name,
    email: payload.email,
    password: payload.temporaryPassword,
    role: payload.role === "admin" ? "admin" : "employee",
    department: payload.department || null,
    position: payload.position || null,
    phone: payload.phone || null,
    city_id: "city-1",
    village_id: "village-1",
    status: payload.status === "inactive" ? "inactive" : "active",
    must_change_password: true,
    created_at: new Date(),
  };

  demoUsers.unshift(nextUser);
  return nextUser;
}

export function getDemoAttendanceForToday(employeeId: string) {
  const key = `${employeeId}-${getDateKey(new Date())}`;
  return attendanceStore.get(key);
}

export function saveDemoCheckIn(payload: {
  employeeId: string;
  imageDataUrl: string;
  latitude: number;
  longitude: number;
  notes?: string;
}) {
  const dateKey = getDateKey(new Date());
  const key = `${payload.employeeId}-${dateKey}`;
  const existing = attendanceStore.get(key);

  if (existing?.check_in_time) {
    return { ok: false as const, reason: "already-checkin" };
  }

  const now = new Date();
  const nextRecord: DemoAttendance = {
    id: existing?.id || `ATT-DEMO-${Date.now()}`,
    employee_id: payload.employeeId,
    attendance_date: dateKey,
    check_in_time: now,
    check_out_time: existing?.check_out_time || null,
    check_in_photo_url: payload.imageDataUrl,
    check_out_photo_url: existing?.check_out_photo_url || null,
    check_in_latitude: payload.latitude,
    check_in_longitude: payload.longitude,
    check_out_latitude: existing?.check_out_latitude || null,
    check_out_longitude: existing?.check_out_longitude || null,
    notes: payload.notes?.trim() ? payload.notes.trim().slice(0, 255) : null,
  };

  attendanceStore.set(key, nextRecord);
  return { ok: true as const, record: nextRecord };
}

export function saveDemoCheckOut(payload: {
  employeeId: string;
  imageDataUrl: string;
  latitude: number;
  longitude: number;
  notes?: string;
}) {
  const dateKey = getDateKey(new Date());
  const key = `${payload.employeeId}-${dateKey}`;
  const existing = attendanceStore.get(key);

  if (!existing?.check_in_time) {
    return { ok: false as const, reason: "missing-checkin" };
  }

  if (existing.check_out_time) {
    return { ok: false as const, reason: "already-checkout" };
  }

  const nextRecord: DemoAttendance = {
    ...existing,
    check_out_time: new Date(),
    check_out_photo_url: payload.imageDataUrl,
    check_out_latitude: payload.latitude,
    check_out_longitude: payload.longitude,
    notes: payload.notes?.trim()
      ? payload.notes.trim().slice(0, 255)
      : existing.notes,
  };

  attendanceStore.set(key, nextRecord);
  return { ok: true as const, record: nextRecord };
}
