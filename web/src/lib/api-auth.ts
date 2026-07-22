import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AppRole = "owner" | "employee";

export type AuthUser = {
  id: string;
  email: string;
  role: AppRole | string;
};

export type DbAuthUser = {
  id: string;
  role: string;
  status: string | null;
};

export function getAuthToken(req: NextRequest) {
  return req.cookies.get("faceattend_token")?.value || "";
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const token = getAuthToken(req);

  if (!token) {
    throw new Error("Token login tidak ditemukan.");
  }

  const payload = await verifyToken(token);
  const id = String(payload.id || "");

  if (!id) {
    throw new Error("User ID tidak ditemukan di token.");
  }

  return {
    id,
    email: String(payload.email || ""),
    role: String(payload.role || "").toLowerCase(),
  };
}

export async function requireRole(req: NextRequest, roles: AppRole[]) {
  const user = await requireAuth(req);
  const allowedRoles = new Set(roles.map((role) => role.toLowerCase()));

  if (!allowedRoles.has(String(user.role).toLowerCase())) {
    throw new Error("Akses ditolak.");
  }

  return user;
}

export function requireOwner(req: NextRequest) {
  return requireRole(req, ["owner", "admin" as any]);
}

export function requireEmployee(req: NextRequest) {
  return requireRole(req, ["employee"]);
}

export async function requireDbUser(req: NextRequest, roles?: AppRole[]) {
  const authUser = await requireAuth(req);

  const user = await prisma.user.findUnique({
    where: {
      id: authUser.id,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  if (String(user.status || "").toLowerCase() !== "active") {
    throw new Error("Akun tidak aktif.");
  }

  if (roles?.length) {
    const allowedRoles = new Set(roles.map((role) => role.toLowerCase()));

    if (!allowedRoles.has(String(user.role || "").toLowerCase())) {
      throw new Error("Akses ditolak.");
    }
  }

  return user;
}

export function requireOwnerUser(req: NextRequest) {
  return requireDbUser(req, ["owner"]);
}

export function requireEmployeeUser(req: NextRequest) {
  return requireDbUser(req, ["employee"]);
}
