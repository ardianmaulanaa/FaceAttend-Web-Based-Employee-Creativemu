import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireOwner } from "@/lib/api-auth";
import { jsonApiError } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAdminUser(req: NextRequest) {
  const authUser = await requireOwner(req);

  const user = await prisma.user.findUnique({
    where: {
      id: authUser.id,
    },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  return user;
}

function normalizeTarget() {
  return "all";
}

function normalizeStatus(status: unknown) {
  const value = String(status || "").toLowerCase();

  if (value === "draft") return "draft";
  if (value === "archived") return "archived";
  if (value === "published") return "published";

  return "published";
}

function jsonError(error: unknown, fallback: string) {
  return jsonApiError(error, fallback);
}

type AnnouncementWithAuthor = {
  id: string;
  title: string;
  content: string;
  target: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  author: {
    id: string;
    name: string;
    email: string;
  } | null;
};

function formatAnnouncement(item: AnnouncementWithAuthor) {
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    target: item.target,
    status: item.status,

    author: item.author || null,
    authorName: item.author?.name || "-",
    authorEmail: item.author?.email || "-",

    created_at: item.created_at,
    updated_at: item.updated_at,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const audience = searchParams.get("audience") || "admin";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    const where: Prisma.AnnouncementWhereInput = {};

    if (audience === "employee") {
      await requireAuth(req);
      where.status = "published";
    } else {
      await getAdminUser(req);

      if (status !== "all") {
        where.status = normalizeStatus(status);
      }
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
          },
        },
        {
          content: {
            contains: search,
          },
        },
      ];
    }

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        target: true,
        status: true,
        created_at: true,
        updated_at: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedAnnouncements = announcements.map(formatAnnouncement);

    return NextResponse.json({
      success: true,
      data: formattedAnnouncements,
      announcements: formattedAnnouncements,
    });
  } catch (error) {
    console.error("GET_ANNOUNCEMENTS_ERROR:", error);

    return jsonError(error, "Gagal mengambil pengumuman.");
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);

    const body = (await req.json()) as Record<string, unknown>;

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const status = normalizeStatus(body.status);
    const target = normalizeTarget();

    if (!title) {
      return NextResponse.json(
        {
          success: false,
          error: "Judul pengumuman wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "Isi pengumuman wajib diisi.",
        },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        target,
        status,
        author_id: admin.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        target: true,
        status: true,
        created_at: true,
        updated_at: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedAnnouncement = formatAnnouncement(announcement);

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil disimpan.",
      data: formattedAnnouncement,
      announcement: formattedAnnouncement,
    });
  } catch (error) {
    console.error("POST_ANNOUNCEMENT_ERROR:", error);

    return jsonError(error, "Gagal menyimpan pengumuman.");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await getAdminUser(req);

    const body = await req.json();

    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID pengumuman wajib dikirim.",
        },
        { status: 400 }
      );
    }

    const data: Prisma.AnnouncementUpdateInput = {
      target: "all",
    };

    if (body.title !== undefined) {
      data.title = String(body.title || "").trim();
    }

    if (body.content !== undefined) {
      data.content = String(body.content || "").trim();
    }

    if (body.status !== undefined) {
      data.status = normalizeStatus(body.status);
    }

    const announcement = await prisma.announcement.update({
      where: {
        id,
      },
      data,
      select: {
        id: true,
        title: true,
        content: true,
        target: true,
        status: true,
        created_at: true,
        updated_at: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedAnnouncement = formatAnnouncement(announcement);

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil diperbarui.",
      data: formattedAnnouncement,
      announcement: formattedAnnouncement,
    });
  } catch (error) {
    console.error("PATCH_ANNOUNCEMENT_ERROR:", error);

    return jsonError(error, "Gagal memperbarui pengumuman.");
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await getAdminUser(req);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID pengumuman wajib dikirim.",
        },
        { status: 400 }
      );
    }

    await prisma.announcement.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE_ANNOUNCEMENT_ERROR:", error);

    return jsonError(error, "Gagal menghapus pengumuman.");
  }
}
