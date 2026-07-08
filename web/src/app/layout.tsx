import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { AppDataProvider } from "@/context/AppDataContext";
import ScrollReloadGuard from "@/components/ScrollReloadGuard";
import LateGuard from "@/components/LateGuard";
import GlobalAlert from "@/components/GlobalAlert";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FaceAttend",
  description: "Employee Attendance System for Creativemu",
  other: {
    google: "notranslate",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      translate="no"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} notranslate h-full antialiased`}
    >
      <body
        suppressHydrationWarning
        className="notranslate min-h-full flex flex-col"
      >
        <AppDataProvider>
          <ScrollReloadGuard />
          <LateGuard />
          <GlobalAlert />
          {/* Watermark Background Logo */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[-1] select-none overflow-hidden">
            <img
              src="/images/creativemu-logo/creativemu.png"
              alt="Creativemu Watermark"
              className="w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] md:w-[550px] md:h-[550px] object-contain opacity-[0.04] blur-[2px]"
            />
          </div>
          {children}
        </AppDataProvider>
      </body>
    </html>
  );
}
