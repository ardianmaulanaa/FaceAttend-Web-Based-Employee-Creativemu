import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type AppRole = "owner" | "employee";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole | string;
  status: string | null;
};

export type DbAuthUser = {
  id: string;
  role: string;
  status: string | null;
};

export function getAuthToken(req: NextRequest) {
  return req.cookies.get("faceattend_token")?.value || "";
}

async function getTokenUser(req: NextRequest) {
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

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  const authUser = await getTokenUser(req);

  const user = await prisma.user.findUnique({
    where: {
      id: authUser.id,
    },
    select: {
      id: true,
      name: true,
      email: true,
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

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: String(user.role || "").toLowerCase(),
    status: user.status,
  };
}

export async function requireRole(req: NextRequest, roles: AppRole[]) {
  return requireDbUser(req, roles);
}

export function requireOwner(req: NextRequest) {
  return requireRole(req, ["owner"]);
}

export function requireEmployee(req: NextRequest) {
  return requireRole(req, ["employee"]);
}

export async function requireDbUser(req: NextRequest, roles?: AppRole[]) {
  const authUser = await requireAuth(req);

  if (roles?.length) {
    const allowedRoles = new Set(roles.map((role) => role.toLowerCase()));

    if (!allowedRoles.has(String(authUser.role || "").toLowerCase())) {
      throw new Error("Akses ditolak.");
    }
  }

  return {
    id: authUser.id,
    role: String(authUser.role || "").toLowerCase(),
    status: authUser.status,
  };
}

export function requireOwnerUser(req: NextRequest) {
  return requireDbUser(req, ["owner"]);
}

export function requireEmployeeUser(req: NextRequest) {
  return requireDbUser(req, ["employee"]);
}
