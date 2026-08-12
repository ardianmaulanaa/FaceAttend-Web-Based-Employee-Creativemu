"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

import {
  DEFAULT_APP_THEME,
  type AppThemeSettings,
} from "@/lib/app-theme-defaults";
import {
  applyAppTheme,
  isDefaultAppTheme,
  readStoredAppTheme,
  storeAppTheme,
} from "@/lib/app-theme-client";

type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

async function loadAppTheme() {
  const storedTheme = readStoredAppTheme();

  if (storedTheme) {
    applyAppTheme(storedTheme);
  }

  try {
    const response = await fetch("/api/app-theme", {
      cache: "no-store",
    });
    const data = (await response.json()) as {
      success?: boolean;
      theme?: AppThemeSettings;
    };

    if (data.success && data.theme) {
      if (storedTheme && isDefaultAppTheme(data.theme)) {
        applyAppTheme(storedTheme);
        return;
      }

      applyAppTheme(data.theme);
      storeAppTheme(data.theme);
      return;
    }

    if (!storedTheme) {
      applyAppTheme(DEFAULT_APP_THEME);
    }
  } catch {
    if (!storedTheme) {
      applyAppTheme(DEFAULT_APP_THEME);
    }
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
      return;
    }

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    void loadAppTheme();

    window.addEventListener("app-theme-changed", loadAppTheme);

    return () => {
      window.removeEventListener("app-theme-changed", loadAppTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
