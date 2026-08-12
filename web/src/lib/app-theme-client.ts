"use client";

import {
  DEFAULT_APP_THEME,
  type AppThemeSettings,
} from "@/lib/app-theme-defaults";

export const APP_THEME_STORAGE_KEY = "app_theme_colors";

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

function normalizeHexColor(value: unknown, fallback: string) {
  const color = String(value || "").trim();

  return HEX_COLOR_RE.test(color) ? color.toLowerCase() : fallback;
}

export function normalizeClientAppTheme(
  value: Partial<AppThemeSettings> | null | undefined,
): AppThemeSettings {
  return {
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
}

function hexToRgbTriplet(hexColor: string) {
  const normalizedColor = hexColor.replace("#", "");
  const red = parseInt(normalizedColor.slice(0, 2), 16);
  const green = parseInt(normalizedColor.slice(2, 4), 16);
  const blue = parseInt(normalizedColor.slice(4, 6), 16);

  return `${red} ${green} ${blue}`;
}

export function applyAppTheme(theme: AppThemeSettings) {
  const root = document.documentElement;

  root.style.setProperty("--primary", theme.primaryColor);
  root.style.setProperty("--app-primary", theme.primaryColor);
  root.style.setProperty("--app-primary-hover", theme.primaryHoverColor);
  root.style.setProperty("--app-primary-soft", theme.softColor);
  root.style.setProperty("--app-primary-subtle", theme.subtleColor);
  root.style.setProperty("--app-primary-text", theme.textColor);
  root.style.setProperty(
    "--app-primary-rgb",
    hexToRgbTriplet(theme.primaryColor),
  );
  root.style.setProperty(
    "--app-primary-text-rgb",
    hexToRgbTriplet(theme.textColor),
  );
}

export function readStoredAppTheme() {
  try {
    const rawTheme = localStorage.getItem(APP_THEME_STORAGE_KEY);
    return rawTheme
      ? normalizeClientAppTheme(JSON.parse(rawTheme) as Partial<AppThemeSettings>)
      : null;
  } catch {
    return null;
  }
}

export function storeAppTheme(theme: AppThemeSettings) {
  localStorage.setItem(
    APP_THEME_STORAGE_KEY,
    JSON.stringify(normalizeClientAppTheme(theme)),
  );
}

export function clearStoredAppTheme() {
  localStorage.removeItem(APP_THEME_STORAGE_KEY);
}

export function isDefaultAppTheme(theme: AppThemeSettings) {
  const normalizedTheme = normalizeClientAppTheme(theme);

  return (
    normalizedTheme.primaryColor === DEFAULT_APP_THEME.primaryColor &&
    normalizedTheme.primaryHoverColor === DEFAULT_APP_THEME.primaryHoverColor &&
    normalizedTheme.softColor === DEFAULT_APP_THEME.softColor &&
    normalizedTheme.subtleColor === DEFAULT_APP_THEME.subtleColor &&
    normalizedTheme.textColor === DEFAULT_APP_THEME.textColor
  );
}
