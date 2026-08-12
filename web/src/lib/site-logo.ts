import { prisma } from "@/lib/prisma";
import {
  DEFAULT_SITE_LOGO_SRC,
  type SiteLogoSettings,
} from "@/lib/site-logo-defaults";

export const SITE_LOGO_SETTING_KEY = "site_logo_src";

function normalizeLogoSrc(value: string | null | undefined) {
  const logoSrc = String(value || "").trim();

  if (!logoSrc) return DEFAULT_SITE_LOGO_SRC;
  if (logoSrc.startsWith("/uploads/")) return DEFAULT_SITE_LOGO_SRC;
  if (logoSrc.startsWith("/")) return logoSrc;
  if (logoSrc.startsWith("https://")) return logoSrc;

  return DEFAULT_SITE_LOGO_SRC;
}

export async function getSiteLogoSettings(): Promise<SiteLogoSettings> {
  let setting: { setting_value: string } | null = null;

  try {
    setting = await prisma.appSetting.findUnique({
      where: {
        setting_key: SITE_LOGO_SETTING_KEY,
      },
      select: {
        setting_value: true,
      },
    });
  } catch (error) {
    console.error("getSiteLogoSettings fallback:", error);
  }

  return {
    logoSrc: normalizeLogoSrc(setting?.setting_value),
    fallbackLogoSrc: DEFAULT_SITE_LOGO_SRC,
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
    },
    update: {
      setting_value: normalizedLogoSrc,
    },
  });

  return normalizedLogoSrc;
}
