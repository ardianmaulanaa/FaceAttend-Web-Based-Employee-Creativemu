import { prisma } from "@/lib/prisma";
import {
  DEFAULT_APP_THEME,
  type AppThemeSettings,
} from "@/lib/app-theme-defaults";

export { DEFAULT_APP_THEME, type AppThemeSettings };

export const APP_THEME_SETTING_KEY = "app_theme_colors";

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;
function normalizeHexColor(value: unknown, fallback: string) {
  const color = String(value || "").trim();

  return HEX_COLOR_RE.test(color) ? color.toLowerCase() : fallback;
}

function isRedThemeColor(hexColor: string) {
  const normalizedColor = hexColor.replace("#", "");
  const red = parseInt(normalizedColor.slice(0, 2), 16);
  const green = parseInt(normalizedColor.slice(2, 4), 16);
  const blue = parseInt(normalizedColor.slice(4, 6), 16);

  return red >= 150 && red > green * 1.45 && red > blue * 1.45;
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

  if (
    isRedThemeColor(normalizedTheme.primaryColor) ||
    isRedThemeColor(normalizedTheme.textColor)
  ) {
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
