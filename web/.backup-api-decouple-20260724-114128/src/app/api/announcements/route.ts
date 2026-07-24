import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import type { UploadApiResponse } from "cloudinary";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireOwner } from "@/lib/api-auth";
import { jsonApiError } from "@/lib/api-response";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_SIZE = 10 * 1024 * 1024;
const PDF_MIME_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "application/acrobat",
  "applications/vnd.pdf",
  "text/pdf",
  "text/x-pdf",
]);

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

function getStringValue(value: unknown) {
  if (typeof value !== "string") return "";

  return value.trim();
}

function jsonError(error: unknown, fallback: string) {
  return jsonApiError(error, fallback);
}

type AnnouncementWithAuthor = {
  id: string;
  title: string;
  content: string;
  document_url: string | null;
  document_public_id: string | null;
  document_name: string | null;
  document_mime: string | null;
  document_size: number | null;
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
    document_url: item.document_url,
    document_public_id: item.document_public_id,
    document_name: item.document_name,
    document_mime: item.document_mime,
    document_size: item.document_size,
    documentUrl: item.document_url,
    documentName: item.document_name,
    documentMime: item.document_mime,
    documentSize: item.document_size,
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

type ParsedAnnouncementBody = {
  body: Record<string, unknown>;
  document: File | null;
};

async function parseAnnouncementBody(
  req: NextRequest,
): Promise<ParsedAnnouncementBody> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const body: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) continue;
      body[key] = value;
    }

    const document =
      formData.get("document") ||
      formData.get("pdf") ||
      formData.get("file") ||
      formData.get("attachment");

    return {
      body,
      document:
        document instanceof File && document.size > 0 ? document : null,
    };
  }

  if (!contentType.includes("application/json")) {
    return {
      body: {},
      document: null,
    };
  }

  return {
    body: (await req.json()) as Record<string, unknown>,
    document: null,
  };
}

function validatePdfDocument(file: File) {
  const mime = (file.type || "application/pdf").toLowerCase();
  const fileName = file.name || "dokumen-pengumuman.pdf";
  const isPdfMime = PDF_MIME_TYPES.has(mime);
  const isPdfName = fileName.toLowerCase().endsWith(".pdf");

  if (!isPdfMime && !isPdfName) {
    throw new Error("Dokumen pengumuman harus berformat PDF.");
  }

  if (file.size > MAX_PDF_SIZE) {
    throw new Error("Ukuran dokumen PDF maksimal 10MB.");
  }
}

async function uploadAnnouncementDocument(
  file: File,
  announcementId: string,
): Promise<UploadApiResponse> {
  validatePdfDocument(file);

  const cloudinary = getCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "presensi/announcements",
        public_id: `announcement-${announcementId}-${Date.now()}`,
        resource_type: "raw",
        overwrite: false,
        use_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary tidak mengembalikan hasil upload."));
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
}

async function deleteAnnouncementDocument(publicId: string | null | undefined) {
  if (!publicId) return;

  try {
    const cloudinary = getCloudinary();

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
      invalidate: true,
    });
  } catch (error) {
    console.warn("DELETE_ANNOUNCEMENT_DOCUMENT_WARNING:", error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const audience = searchParams.get("audience") || "admin";
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const id = searchParams.get("id") || "";

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

    if (id) {
      const announcement = await prisma.announcement.findFirst({
        where: {
          ...where,
          id,
        },
        select: {
          id: true,
          title: true,
          content: true,
          document_url: true,
          document_public_id: true,
          document_name: true,
          document_mime: true,
          document_size: true,
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

      if (!announcement) {
        return NextResponse.json(
          {
            success: false,
            error: "Pengumuman tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      const formattedAnnouncement = formatAnnouncement(announcement);

      return NextResponse.json({
        success: true,
        data: formattedAnnouncement,
        announcement: formattedAnnouncement,
      });
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
        document_url: true,
        document_public_id: true,
        document_name: true,
        document_mime: true,
        document_size: true,
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
  let uploadedDocumentPublicId: string | null = null;

  try {
    const admin = await getAdminUser(req);

    const { body, document } = await parseAnnouncementBody(req);

    const title = getStringValue(body.title);
    const content = getStringValue(body.content);
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

    if (document) {
      validatePdfDocument(document);
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
        document_url: true,
        document_public_id: true,
        document_name: true,
        document_mime: true,
        document_size: true,
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

    let savedAnnouncement = announcement;

    if (document) {
      const uploadResult = await uploadAnnouncementDocument(
        document,
        announcement.id,
      );
      uploadedDocumentPublicId = uploadResult.public_id;

      savedAnnouncement = await prisma.announcement.update({
        where: {
          id: announcement.id,
        },
        data: {
          document_url: uploadResult.secure_url,
          document_public_id: uploadResult.public_id,
          document_name: document.name || "dokumen-pengumuman.pdf",
          document_mime: document.type || "application/pdf",
          document_size: document.size,
        },
        select: {
          id: true,
          title: true,
          content: true,
          document_url: true,
          document_public_id: true,
          document_name: true,
          document_mime: true,
          document_size: true,
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
    }

    const formattedAnnouncement = formatAnnouncement(savedAnnouncement);

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil disimpan.",
      data: formattedAnnouncement,
      announcement: formattedAnnouncement,
    });
  } catch (error) {
    console.error("POST_ANNOUNCEMENT_ERROR:", error);

    await deleteAnnouncementDocument(uploadedDocumentPublicId);

    return jsonError(error, "Gagal menyimpan pengumuman.");
  }
}

export async function PATCH(req: NextRequest) {
  let uploadedDocumentPublicId: string | null = null;
  let oldDocumentPublicId: string | null = null;

  try {
    await getAdminUser(req);

    const { body, document } = await parseAnnouncementBody(req);

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

    if (document) {
      validatePdfDocument(document);
    }

    const existingAnnouncement = await prisma.announcement.findUnique({
      where: {
        id,
      },
      select: {
        document_public_id: true,
      },
    });

    if (!existingAnnouncement) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengumuman tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const data: Prisma.AnnouncementUpdateInput = {
      target: "all",
    };

    if (body.title !== undefined) {
      data.title = getStringValue(body.title);
    }

    if (body.content !== undefined) {
      data.content = getStringValue(body.content);
    }

    if (body.status !== undefined) {
      data.status = normalizeStatus(body.status);
    }

    if (document) {
      const uploadResult = await uploadAnnouncementDocument(document, id);
      uploadedDocumentPublicId = uploadResult.public_id;
      oldDocumentPublicId = existingAnnouncement.document_public_id;

      data.document_url = uploadResult.secure_url;
      data.document_public_id = uploadResult.public_id;
      data.document_name = document.name || "dokumen-pengumuman.pdf";
      data.document_mime = document.type || "application/pdf";
      data.document_size = document.size;
    }

    if (body.removeDocument === "true" || body.remove_document === "true") {
      oldDocumentPublicId = existingAnnouncement.document_public_id;
      data.document_url = null;
      data.document_public_id = null;
      data.document_name = null;
      data.document_mime = null;
      data.document_size = null;
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
        document_url: true,
        document_public_id: true,
        document_name: true,
        document_mime: true,
        document_size: true,
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

    if (
      oldDocumentPublicId &&
      oldDocumentPublicId !== uploadedDocumentPublicId
    ) {
      await deleteAnnouncementDocument(oldDocumentPublicId);
    }

    const formattedAnnouncement = formatAnnouncement(announcement);

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil diperbarui.",
      data: formattedAnnouncement,
      announcement: formattedAnnouncement,
    });
  } catch (error) {
    console.error("PATCH_ANNOUNCEMENT_ERROR:", error);

    await deleteAnnouncementDocument(uploadedDocumentPublicId);

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

    const announcement = await prisma.announcement.findUnique({
      where: {
        id,
      },
      select: {
        document_public_id: true,
      },
    });

    if (!announcement) {
      return NextResponse.json(
        {
          success: false,
          error: "Pengumuman tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    await prisma.announcement.delete({
      where: {
        id,
      },
    });

    await deleteAnnouncementDocument(announcement.document_public_id);

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE_ANNOUNCEMENT_ERROR:", error);

    return jsonError(error, "Gagal menghapus pengumuman.");
  }
}
