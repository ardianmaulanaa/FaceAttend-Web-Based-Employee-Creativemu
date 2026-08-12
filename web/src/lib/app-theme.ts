import { prisma } from "@/lib/prisma";
import {
  DEFAULT_APP_THEME,
  type AppThemeSettings,
} from "@/lib/app-theme-defaults";

export { DEFAULT_APP_THEME, type AppThemeSettings };

export const APP_THEME_SETTING_KEY = "app_theme_colors";

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
const STALE_ALFABANK_RED_COLORS = new Set([
  "#b91c1c",
  "#dc2626",
  "#ef4444",
  "#e60000",
  "#ff0000",
]);

function normalizeHexColor(value: unknown, fallback: string) {
  const color = String(value || "").trim();

  return HEX_COLOR_RE.test(color) ? color.toLowerCase() : fallback;
}

export function normalizeAppThemeSettings(
  value: Partial<AppThemeSettings> | null | undefined,
): AppThemeSettings {
  const normalizedTheme = {
    primaryColor: normalizeHexColor(
      value?.primaryColor,
      DEFAULT_APP_THEME.primaryColor,
    ),
    primaryHoverColor: normalizeHexColor(
      value?.primaryHoverColor,
      DEFAULT_APP_THEME.primaryHoverColor,
    ),
    softColor: normalizeHexColor(value?.softColor, DEFAULT_APP_THEME.softColor),
    subtleColor: normalizeHexColor(
      value?.subtleColor,
      DEFAULT_APP_THEME.subtleColor,
    ),
    textColor: normalizeHexColor(value?.textColor, DEFAULT_APP_THEME.textColor),
  };

  if (STALE_ALFABANK_RED_COLORS.has(normalizedTheme.primaryColor)) {
    return DEFAULT_APP_THEME;
  }

  return normalizedTheme;
}

function parseThemeJson(value: string | null | undefined) {
  if (!value) return null;

  try {
    return JSON.parse(value) as Partial<AppThemeSettings>;
  } catch {
    return null;
  }
}

export async function getAppThemeSettings(): Promise<AppThemeSettings> {
  let setting: { setting_value: string } | null = null;

  try {
    setting = await prisma.appSetting.findUnique({
      where: {
        setting_key: APP_THEME_SETTING_KEY,
      },
      select: {
        setting_value: true,
      },
    });
  } catch (error) {
    console.error("getAppThemeSettings fallback:", error);
  }

  return normalizeAppThemeSettings(parseThemeJson(setting?.setting_value));
}

export async function updateAppThemeSettings(
  theme: Partial<AppThemeSettings>,
): Promise<AppThemeSettings> {
  const normalizedTheme = normalizeAppThemeSettings(theme);

  await prisma.appSetting.upsert({
    where: {
      setting_key: APP_THEME_SETTING_KEY,
    },
    create: {
      setting_key: APP_THEME_SETTING_KEY,
      setting_value: JSON.stringify(normalizedTheme),
    },
    update: {
      setting_value: JSON.stringify(normalizedTheme),
    },
  });

  return normalizedTheme;
}
