import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SITE_LOGO_SRC,
  DEFAULT_SITE_TITLE,
  type SiteLogoSettings,
} from "@/lib/site-logo-defaults";

export const SITE_LOGO_SETTING_KEY = "site_logo_src";
export const SITE_TITLE_SETTING_KEY = "site_title";
const SITE_LOGO_UPLOAD_PUBLIC_DIR = "/uploads/site-logo";
const SITE_LOGO_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "site-logo");

function versionedLogoImageSrc(logoSrc: string, updatedAt: Date | null | undefined) {
  if (!updatedAt || logoSrc === DEFAULT_SITE_LOGO_SRC) return logoSrc;

  const separator = logoSrc.includes("?") ? "&" : "?";
  return `${logoSrc}${separator}v=${updatedAt.getTime()}`;
}

function normalizeLogoSrc(value: string | null | undefined) {
  const logoSrc = String(value || "").trim();

  if (!logoSrc) return DEFAULT_SITE_LOGO_SRC;
  if (logoSrc.startsWith("/api/site-logo")) return DEFAULT_SITE_LOGO_SRC;
  if (logoSrc.startsWith("/uploads/")) return DEFAULT_SITE_LOGO_SRC;
  if (logoSrc.startsWith("/")) return logoSrc;
  if (logoSrc.startsWith("http://") || logoSrc.startsWith("https://")) return logoSrc;

  return DEFAULT_SITE_LOGO_SRC;
}

export function normalizeSiteTitle(value: string | null | undefined) {
  const title = String(value || "").trim();
  return title || DEFAULT_SITE_TITLE;
}

export async function getSiteLogoSettings(): Promise<SiteLogoSettings> {
  let logoSetting: {
    setting_value: string;
    setting_file: Uint8Array | null;
    updated_at: Date;
  } | null = null;
  let titleSetting: { setting_value: string } | null = null;

  try {
    const settings = await prisma.appSetting.findMany({
      where: {
        setting_key: {
          in: [SITE_LOGO_SETTING_KEY, SITE_TITLE_SETTING_KEY],
        },
      },
      select: {
        setting_key: true,
        setting_value: true,
        setting_file: true,
        updated_at: true,
      },
    });

    logoSetting = settings.find((s) => s.setting_key === SITE_LOGO_SETTING_KEY) || null;
    titleSetting = settings.find((s) => s.setting_key === SITE_TITLE_SETTING_KEY) || null;
  } catch (error) {
    console.error("getSiteLogoSettings fallback:", error);
  }

  return {
    logoSrc: versionedLogoImageSrc(
      normalizeLogoSrc(logoSetting?.setting_value),
      logoSetting?.updated_at,
    ),
    fallbackLogoSrc: DEFAULT_SITE_LOGO_SRC,
    siteTitle: normalizeSiteTitle(titleSetting?.setting_value),
    fallbackSiteTitle: DEFAULT_SITE_TITLE,
  };
}

export async function updateSiteLogoSrc(logoSrc: string) {
  const normalizedLogoSrc = normalizeLogoSrc(logoSrc);

  await prisma.appSetting.upsert({
    where: {
      setting_key: SITE_LOGO_SETTING_KEY,
    },
    create: {
      setting_key: SITE_LOGO_SETTING_KEY,
      setting_value: normalizedLogoSrc,
      setting_file: null,
      setting_mime: null,
    },
    update: {
      setting_value: normalizedLogoSrc,
      setting_file: null,
      setting_mime: null,
    },
  });

  return normalizedLogoSrc;
}

export async function updateSiteLogoFile(
  buffer: Uint8Array<ArrayBuffer>,
  mime: string,
  fileName = "",
) {
  const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
  const extension = ["svg", "webp", "jpg", "jpeg", "png"].includes(fileExtension)
    ? fileExtension === "jpeg"
      ? "jpg"
      : fileExtension
    : mime.includes("svg")
    ? "svg"
    : mime.includes("webp")
      ? "webp"
      : mime.includes("jpeg") || mime.includes("jpg")
        ? "jpg"
        : "png";
  const publicPath = `${SITE_LOGO_UPLOAD_PUBLIC_DIR}/logo.${extension}`;
  const filePath = path.join(SITE_LOGO_UPLOAD_DIR, `logo.${extension}`);

  await mkdir(SITE_LOGO_UPLOAD_DIR, { recursive: true });
  await writeFile(filePath, buffer);

  await prisma.appSetting.upsert({
    where: {
      setting_key: SITE_LOGO_SETTING_KEY,
    },
    create: {
      setting_key: SITE_LOGO_SETTING_KEY,
      setting_value: publicPath,
      setting_file: null,
      setting_mime: null,
    },
    update: {
      setting_value: publicPath,
      setting_file: null,
      setting_mime: null,
    },
  });

  return publicPath;
}

export async function resetSiteLogoFileToDefault() {
  await updateSiteLogoSrc(DEFAULT_SITE_LOGO_SRC);

  return DEFAULT_SITE_LOGO_SRC;
}

export async function updateSiteTitle(title: string) {
  const normalizedTitle = normalizeSiteTitle(title);

  await prisma.appSetting.upsert({
    where: {
      setting_key: SITE_TITLE_SETTING_KEY,
    },
    create: {
      setting_key: SITE_TITLE_SETTING_KEY,
      setting_value: normalizedTitle,
    },
    update: {
      setting_value: normalizedTitle,
    },
    select: {
      setting_key: true,
      setting_value: true,
    },
  });

  return normalizedTitle;
}
