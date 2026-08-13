"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CreditCard,
  Download,
  IdCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Network,
  Phone,
  QrCode,
  RotateCw,
  ShieldCheck,
} from "lucide-react";

import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useSiteLogoSettings } from "@/hooks/useSiteLogo";
import { getBankOption } from "@/lib/bank-options";

type UserRelation = {
  id: string;
  name: string;
} | null;

type KartuIdentitasUser = {
  id: string;
  employee_code?: string | null;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: string;
  profile_photo: string | null;
  nik?: string | null;
  bank_code?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  employment_start_date?: string | null;
  employment_end_date?: string | null;
  employment_status?: string | null;
  department?: UserRelation;
  position?: UserRelation;
  jabatan?: UserRelation;
  registered_office?: { name?: string; address?: string } | null;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();
}

function formatRole(role: string) {
  const roleMap: Record<string, string> = {
    owner: "Pemilik",
    admin: "Admin",
    cs: "CS",
    employee: "Karyawan",
    OWNER: "Pemilik",
    ADMIN: "Admin",
    CS: "CS",
    EMPLOYEE: "Karyawan",
  };

  return roleMap[role] || role;
}

function formatStatus(status: string) {
  const statusMap: Record<string, string> = {
    active: "Aktif",
    inactive: "Nonaktif",
    ACTIVE: "Aktif",
    INACTIVE: "Nonaktif",
  };

  return statusMap[status] || status;
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatEmploymentPeriod(user: KartuIdentitasUser) {
  const startDate = formatDate(user.employment_start_date);
  const endDate = formatDate(user.employment_end_date);

  if (startDate === "-" && endDate === "-") return "-";
  if (startDate === "-") return `s/d ${endDate}`;
  if (endDate === "-") return `Mulai ${startDate}`;

  return `${startDate} - ${endDate}`;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function KartuIdentitasMotionStyles() {
  return (
    <style>{`
      @keyframes kartuIdentitasEnter {
        0% {
          opacity: 0;
          transform: translateY(8px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .kartu-identitas-enter {
        animation: kartuIdentitasEnter 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      @media (prefers-reduced-motion: reduce) {
        .kartu-identitas-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function KartuIdentitasPage() {
  const router = useRouter();
  const { logoSrc, siteTitle } = useSiteLogoSettings();
  const cardRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<KartuIdentitasUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const data = await readJsonResponse(response);

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.error || data.message || "Gagal mengambil data user.",
          );
        }

        setUser(data.user);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Gagal mengambil data user.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, []);

  const initials = user?.name ? getInitials(user.name) : "";

  // 1. FRONT SIDE (Public Office Data)
  const frontOfficeDetails = useMemo(() => {
    if (!user) return [];

    return [
      {
        label: "No Induk Karyawan",
        value: user.employee_code || "-",
        icon: IdCard,
      },
      {
        label: "Status Kepegawaian",
        value: user.employment_status || "Karyawan Tetap",
        icon: BadgeCheck,
      },
      {
        label: "Divisi",
        value: user.department?.name || "-",
        icon: Network,
      },
      {
        label: "Jabatan",
        value: user.jabatan?.name || "-",
        icon: BriefcaseBusiness,
      },
      {
        label: "Posisi",
        value: user.position?.name || "-",
        icon: BriefcaseBusiness,
      },
      {
        label: "Status Akun",
        value: formatStatus(user.status),
        icon: ShieldCheck,
      },
      {
        label: "Masa Kerja",
        value: formatEmploymentPeriod(user),
        icon: CalendarDays,
      },
      {
        label: "Kantor Terdaftar",
        value: user.registered_office?.name || "Kantor Pusat",
        icon: MapPin,
      },
    ];
  }, [user]);

  // 2. BACK SIDE (Personal & Bank Data)
  const backSensitiveDetails = useMemo(() => {
    if (!user) return [];

    return [
      {
        label: "NIK",
        value: user.nik || "-",
        icon: IdCard,
      },
      {
        label: "Email",
        value: user.email,
        icon: Mail,
      },
      {
        label: "Nomor Telepon",
        value: user.phone || "-",
        icon: Phone,
      },
      {
        label: "Bank",
        value: getBankOption(user.bank_code)?.name || user.bank_name || "-",
        icon: Building2,
      },
      {
        label: "No Rekening",
        value: user.bank_account_number || "-",
        icon: CreditCard,
      },
      {
        label: "Status Akun",
        value: formatStatus(user.status),
        icon: ShieldCheck,
      },
    ];
  }, [user]);

  async function handleDownloadPNG() {
    if (!user) return;
    try {
      setIsDownloading(true);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = 1200;
      const height = 1350;
      canvas.width = width;
      canvas.height = height;

      // Draw FRONT CARD (0 to 630)
      ctx.fillStyle = "#123c8c";
      ctx.fillRect(0, 0, 360, 630);
      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(360, 0, width - 360, 630);

      // Front Left Photo
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("PRESENSI", 180, 55);

      const photoSize = 180;
      const photoX = (360 - photoSize) / 2;
      const photoY = 85;

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.roundRect(photoX, photoY, photoSize, photoSize + 36, 20);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (user.profile_photo) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
            img.src = user.profile_photo!;
          });
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(photoX + 5, photoY + 5, photoSize - 10, photoSize + 26, 16);
          ctx.clip();
          ctx.drawImage(img, photoX + 5, photoY + 5, photoSize - 10, photoSize + 26);
          ctx.restore();
        } catch {
          ctx.fillStyle = "#123c8c";
          ctx.font = "bold 52px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(initials, 180, photoY + (photoSize + 36) / 2);
        }
      } else {
        ctx.fillStyle = "#123c8c";
        ctx.font = "bold 52px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(initials, 180, photoY + (photoSize + 36) / 2);
      }

      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(user.name, 180, 375);

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.beginPath();
      ctx.roundRect(80, 405, 200, 40, 20);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 16px sans-serif";
      ctx.fillText(formatRole(user.role).toUpperCase(), 180, 431);

      // Front Right Grid
      ctx.fillStyle = "#123c8c";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("KARTU KARYAWAN", 410, 50);

      ctx.fillStyle = "#123456";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("Identitas Pegawai (Tampak Depan)", 410, 92);

      ctx.strokeStyle = "rgba(18, 60, 140, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(410, 110);
      ctx.lineTo(width - 40, 110);
      ctx.stroke();

      const col1X = 410;
      const col2X = 800;
      const startY = 160;

      frontOfficeDetails.forEach((item, i) => {
        const isCol2 = i % 2 === 1;
        const curX = isCol2 ? col2X : col1X;
        const curY = startY + Math.floor(i / 2) * 95;

        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 13px sans-serif";
        ctx.fillText(item.label.toUpperCase(), curX, curY);

        ctx.fillStyle = "#123456";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(String(item.value), curX, curY + 26);
      });

      // Divider Line between Front and Back (630 to 720)
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(0, 630, width, 90);

      ctx.fillStyle = "#64748b";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("--- SISI BELAKANG (DETAIL PERSONAL & BANK) ---", width / 2, 683);

      // Draw BACK CARD (720 to 1350)
      ctx.fillStyle = "#123c8c";
      ctx.fillRect(0, 720, 360, 630);
      ctx.fillStyle = "#f8fbff";
      ctx.fillRect(360, 720, width - 360, 630);

      // Back Left QR
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("VERIFIKASI", 180, 775);

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(photoX, 805, photoSize, photoSize + 20, 20);
      ctx.fill();

      ctx.fillStyle = "#123c8c";
      ctx.font = "bold 22px sans-serif";
      ctx.fillText("QR CODE", 180, 915);

      ctx.fillStyle = "#ffffff";
      ctx.font = "italic 15px sans-serif";
      ctx.fillText("Presensi Digital", 180, 1100);

      // Back Right Grid
      ctx.fillStyle = "#123c8c";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("DETAIL PERSONAL", 410, 770);

      ctx.fillStyle = "#123456";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("Detail Personal & Bank", 410, 812);

      ctx.strokeStyle = "rgba(18, 60, 140, 0.15)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(410, 830);
      ctx.lineTo(width - 40, 830);
      ctx.stroke();

      let bStartY = 880;
      backSensitiveDetails.forEach((item, i) => {
        const isCol2 = i % 2 === 1;
        const curX = isCol2 ? col2X : col1X;
        const curY = bStartY + Math.floor(i / 2) * 105;

        ctx.fillStyle = "#94a3b8";
        ctx.font = "600 13px sans-serif";
        ctx.fillText(item.label.toUpperCase(), curX, curY);

        ctx.fillStyle = "#123456";
        ctx.font = "bold 18px sans-serif";
        ctx.fillText(String(item.value), curX, curY + 26);
      });

      // Download link
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Kartu_Identitas_${user.name.replace(/\s+/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("DOWNLOAD_ERROR:", err);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <KartuIdentitasMotionStyles />

      <div className="hidden md:block">
        <AppHeader title="Kartu Identitas" variant="employee" />
      </div>

      <main className="flex h-dvh max-h-dvh flex-col justify-between overflow-hidden bg-white pb-16 text-slate-950 md:bg-gradient-to-br md:from-[#f6f8ff] md:via-white md:to-[#eef4ff]">
        <section className="flex flex-1 flex-col overflow-hidden px-3 pt-2 md:px-8 md:pt-4">
          {/* Header Controls */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100/80 pb-2.5">
            <div className="order-1 flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-[#123456] shadow-sm shadow-slate-200/80 transition hover:bg-[#f8fbff] active:scale-[0.96] sm:h-10 sm:w-10"
              >
                <ArrowLeft size={19} strokeWidth={2.5} />
              </button>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#123c8c] md:text-xs">
                  Kembali
                </p>
              </div>
            </div>

            {/* Side Switcher Toggle */}
            <div className="order-2 flex w-full items-center justify-center gap-1 rounded-2xl border border-slate-200/60 bg-slate-100/80 p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveSide("front")}
                className={`flex-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition duration-200 sm:flex-initial sm:px-3.5 sm:text-xs ${
                  activeSide === "front"
                    ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sisi Depan
              </button>
              <button
                type="button"
                onClick={() => setActiveSide("back")}
                className={`flex-1 rounded-xl px-3 py-1.5 text-[11px] font-bold transition duration-200 sm:flex-initial sm:px-3.5 sm:text-xs ${
                  activeSide === "back"
                    ? "bg-[#123c8c] text-white shadow-md shadow-blue-900/20"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sisi Belakang
              </button>
            </div>
          </div>

          {/* Main Card Area */}
          <div className="flex flex-1 items-center justify-center py-2 overflow-hidden">
            {loading ? (
              <div className="flex items-center gap-3 rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 text-sm font-bold text-slate-500">
                <Loader2 size={20} className="animate-spin text-[#123c8c]" />
                Mengambil kartu identitas...
              </div>
            ) : errorMessage || !user ? (
              <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-6 text-center">
                <p className="text-xs font-bold text-red-700">
                  {errorMessage || "Kartu identitas tidak ditemukan."}
                </p>
              </div>
            ) : (
              <div className="w-full max-w-[840px] flex flex-col items-center">
                {/* Flip button */}
                <div className="mb-2 flex w-full justify-end px-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveSide((prev) => (prev === "front" ? "back" : "front"))
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#123c8c] transition hover:opacity-80 active:scale-95"
                  >
                    <RotateCw size={13} strokeWidth={2.5} /> Flip Sisi Kartu
                  </button>
                </div>
                <div
                  ref={cardRef}
                  className="kartu-identitas-enter w-full h-[270px] sm:h-[320px] md:h-[340px] overflow-hidden rounded-[1.75rem] border border-blue-900/20 bg-gradient-to-br from-[#123c8c] via-[#0f3478] to-[#0a2558] shadow-2xl shadow-blue-950/20"
                >
                  <div className="grid h-full grid-cols-[110px_1fr] sm:grid-cols-[180px_1fr] md:grid-cols-[210px_1fr]">
                    {/* LEFT BLUE SIDEBAR */}
                    <div className="relative flex h-full flex-col items-center justify-center border-r border-white/15 p-3 text-center text-white md:p-5">
                      <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-blue-200/90 md:text-xs">
                        {activeSide === "front" ? "PRESENSI" : "VERIFIKASI"}
                      </p>

                      {activeSide === "front" ? (
                        <div className="mt-2.5 flex h-22 w-18 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/40 bg-[#eaf1ff] text-2xl font-bold text-[#123c8c] shadow-md ring-2 ring-white/20 md:h-32 md:w-26 md:text-3xl">
                          {user.profile_photo ? (
                            <img
                              src={user.profile_photo}
                              alt={user.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                      ) : (
                        <div className="mt-2.5 flex h-22 w-18 flex-col items-center justify-center rounded-2xl border-2 border-white/40 bg-white text-[#123c8c] shadow-md ring-2 ring-white/20 md:h-32 md:w-26">
                          <QrCode size={36} strokeWidth={2.2} />
                          <span className="mt-1 text-[8px] font-bold uppercase tracking-wider text-[#123c8c]">
                            VERIFIED
                          </span>
                        </div>
                      )}

                      <p className="mt-2.5 max-w-full truncate text-xs font-bold text-white md:mt-3.5 md:text-lg tracking-tight">
                        {user.name}
                      </p>
                      <p className="mt-1 rounded-full bg-white/15 px-3 py-0.5 text-[8px] font-semibold tracking-wide text-blue-50 ring-1 ring-white/25 backdrop-blur-sm md:text-xs">
                        {formatRole(user.role)}
                      </p>
                    </div>

                    {/* RIGHT PANEL */}
                    <div className="relative flex h-full flex-col justify-between min-w-0 bg-gradient-to-br from-white via-[#f8fbff] to-[#f0f5ff] p-3.5 md:p-5">
                      {/* Panel Header */}
                      <div className="flex shrink-0 items-center justify-between border-b border-blue-900/10 pb-2">
                        <div className="min-w-0">
                          <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-[#123c8c] md:text-[9px]">
                            {activeSide === "front"
                              ? "Kartu Karyawan"
                              : "Kartu Karyawan"}
                          </p>
                          <h2 className="text-xs md:text-lg font-bold tracking-tight text-[#123456]">
                            {activeSide === "front"
                              ? "Identitas Pegawai"
                              : "Detail Personal"}
                          </h2>
                        </div>

                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c] border border-blue-100 md:h-9 md:w-9">
                          {activeSide === "front" ? (
                            <IdCard size={15} strokeWidth={2.4} />
                          ) : (
                            <Lock size={15} strokeWidth={2.4} />
                          )}
                        </div>
                      </div>

                      {/* FRONT SIDE CONTENT */}
                      {activeSide === "front" ? (
                        <div className="my-auto grid grid-cols-2 gap-x-3 gap-y-2 md:gap-x-5 md:gap-y-3">
                          {frontOfficeDetails.map((item) => (
                            <div key={item.label} className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c] border border-blue-100/60 md:h-7 md:w-7">
                                  <item.icon size={13} strokeWidth={2.4} />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-[7px] font-semibold uppercase tracking-wider text-slate-400 md:text-[8px]">
                                    {item.label}
                                  </p>
                                  <p className="truncate text-[11px] font-bold text-[#123456] md:text-xs">
                                    {item.value}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* BACK SIDE CONTENT */
                        <div className="my-auto grid grid-cols-2 gap-x-3 gap-y-2.5 md:gap-x-5 md:gap-y-3.5">
                          {backSensitiveDetails.map((item) => (
                            <div key={item.label} className="min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c] border border-blue-100/60 md:h-7 md:w-7">
                                  <item.icon size={13} strokeWidth={2.4} />
                                </div>

                                <div className="min-w-0">
                                  <p className="text-[7px] font-semibold uppercase tracking-wider text-slate-400 md:text-[8px]">
                                    {item.label}
                                  </p>
                                  <p className="truncate text-[11px] font-bold text-[#123456] md:text-xs">
                                    {item.value}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Footer Badge */}
                      <div className="flex shrink-0 items-center justify-between rounded-xl bg-gradient-to-r from-[#123c8c] to-[#0f3478] px-3 py-1.5 shadow-sm">
                        <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-blue-100 md:text-[10px]">
                          {siteTitle}
                        </p>
                        <BadgeCheck
                          size={14}
                          strokeWidth={2.5}
                          className="shrink-0 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}
