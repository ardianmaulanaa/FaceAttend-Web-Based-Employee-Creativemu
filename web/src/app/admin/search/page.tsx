"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, Suspense, useState, useEffect } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Clock3,
  CalendarClock,
  Building2,
  Network,
  UserRoundCog,
  UserPlus,
  FileImage,
  CalendarDays,
  UserRound,
  Search,
  ArrowRight,
  User,
  Phone,
  Mail,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useTheme } from "@/context/ThemeContext";
import Image from "next/image";

const adminSuggestions = [
  { href: "/admin/dashboard", label: "Dashboard Admin", icon: LayoutDashboard, category: "Menu Utama", keywords: ["dashboard", "beranda", "ringkasan", "summary", "admin"] },
  { href: "/admin/monitor_perusahaan", label: "Monitor Perusahaan", icon: BarChart3, category: "Menu Utama", keywords: ["monitor perusahaan", "pemantauan", "kehadiran real-time", "karyawan", "live", "pantau"] },
  { href: "/admin/pengumuman", label: "Pengumuman Admin", icon: Megaphone, category: "Menu Utama", keywords: ["pengumuman", "info", "buat pengumuman", "broadcast", "pengumuman baru"] },
  
  { href: "/admin/shifts", label: "Shift Kerja", icon: Clock3, category: "Master Data", keywords: ["shift", "jadwal", "piket", "jam kerja", "waktu", "pagi", "siang", "malam"] },
  { href: "/admin/work-schedules", label: "Jam Kerja Schedule", icon: CalendarClock, category: "Master Data", keywords: ["jam kerja", "jadwal kerja", "schedule", "work schedule", "hari kerja"] },
  { href: "/admin/kantor", label: "Kantor & Lokasi", icon: Building2, category: "Master Data", keywords: ["kantor", "lokasi", "gps", "koordinat", "cabang", "alamat", "radius"] },
  { href: "/admin/departments", label: "Divisi / Department", icon: Network, category: "Master Data", keywords: ["divisi", "department", "departemen", "bagian", "struktur"] },
  { href: "/admin/units", label: "Unit Kerja", icon: Building2, category: "Master Data", keywords: ["unit", "unit kerja", "bagian", "kelompok", "cabang"] },
  { href: "/admin/positions", label: "Jabatan Pekerjaan", icon: UserRoundCog, category: "Master Data", keywords: ["jabatan", "posisi", "role", "pangkat", "job", "title"] },
  
  { href: "/admin/employees", label: "Register Employee", icon: UserPlus, category: "Operasional", keywords: ["register employee", "tambah karyawan", "daftar karyawan baru", "pendaftaran", "buat akun"] },
  { href: "/admin/laporan-kehadiran", label: "Laporan Kehadiran", icon: FileImage, category: "Operasional", keywords: ["laporan kehadiran", "rekap", "excel", "kehadiran", "presensi", "export"] },
  { href: "/admin/cuti", label: "Laporan & Approval Cuti", icon: CalendarDays, category: "Operasional", keywords: ["laporan cuti", "persetujuan cuti", "approval cuti", "pengajuan", "izin"] },
  { href: "/admin/profil-karyawan", label: "Profil Karyawan", icon: UserRound, category: "Operasional", keywords: ["profil karyawan", "daftar karyawan", "data karyawan", "edit karyawan", "list user"] },
];

const DEFAULT_AVATAR = "/images/creativemu-logo/creativemu.png";

function Highlight({ text, search }: { text: string; search: string }) {
  if (!search.trim()) return <span>{text}</span>;
  const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800/80 text-[#123c8c] dark:text-[#58a6ff] rounded px-0.5 font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const query = searchParams.get("search") || "";

  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoadingEmployees(true);
        const res = await fetch("/api/employees", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.employees) {
          setEmployees(data.employees);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingEmployees(false);
      }
    }
    fetchEmployees();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return adminSuggestions;
    const cleanQuery = query.toLowerCase();
    return adminSuggestions.filter((item) =>
      item.label.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(cleanQuery))
    );
  }, [query]);

  const filteredEmployees = useMemo(() => {
    if (!query.trim()) return [];
    const cleanQuery = query.toLowerCase();
    return employees.filter((emp) =>
      emp.name.toLowerCase().includes(cleanQuery) ||
      emp.email.toLowerCase().includes(cleanQuery) ||
      (emp.phone && emp.phone.includes(cleanQuery)) ||
      (emp.position?.name && emp.position.name.toLowerCase().includes(cleanQuery)) ||
      (emp.department?.name && emp.department.name.toLowerCase().includes(cleanQuery)) ||
      (emp.unit?.name && emp.unit.name.toLowerCase().includes(cleanQuery))
    );
  }, [employees, query]);

  const hasNoResults = results.length === 0 && filteredEmployees.length === 0;

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
      <div className={`p-6 rounded-3xl border shadow-sm ${
        theme === 'dark' ? 'border-[#30363d] bg-[#161b22]' : 'border-blue-100 bg-white'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] dark:bg-[#21262d] dark:text-[#58a6ff]">
            <Search size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Hasil Pencarian</h2>
            <p className="text-xs font-semibold text-slate-500">
              {query.trim() ? (
                <>Menampilkan hasil untuk "{query}"</>
              ) : (
                <>Menampilkan semua menu utama admin</>
              )}
            </p>
          </div>
        </div>

        {hasNoResults ? (
          <div className="p-8 text-center text-slate-400">
            Tidak menemukan menu, data, atau karyawan yang cocok dengan pencarian Anda.
          </div>
        ) : (
          <div className="space-y-8">
            {/* Menu Matches */}
            {results.length > 0 && (
              <div>
                <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Menu & Fitur ({results.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.href}
                        onClick={() => router.push(item.href)}
                        className={`group flex items-start justify-between p-4 rounded-2xl border text-left transition-all duration-200 hover:scale-[1.02] ${
                          theme === 'dark'
                            ? 'border-[#30363d] bg-[#21262d]/30 hover:bg-[#21262d]/70 text-slate-200'
                            : 'border-slate-100 bg-[#f8fafc] hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 p-2 rounded-xl bg-[#eaf1ff] text-[#123c8c] dark:bg-[#161b22] dark:text-[#58a6ff]">
                            <Icon size={18} strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                              {item.category}
                            </span>
                            <h4 className="text-sm font-black leading-snug truncate group-hover:text-[#123c8c] dark:group-hover:text-[#58a6ff]">
                              <Highlight text={item.label} search={query} />
                            </h4>
                            <p className="mt-1 text-[11px] text-slate-400 truncate">
                              {item.keywords.map((kw, i) => (
                                <span key={kw} className="mr-1">
                                  #<Highlight text={kw} search={query} />
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={16} className="shrink-0 mt-1 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-[#123c8c] dark:text-[#58a6ff]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Employee Matches */}
            {filteredEmployees.length > 0 && (
              <div>
                <h3 className={`text-xs font-black uppercase tracking-wider mb-3 ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  Karyawan ({filteredEmployees.length})
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => router.push(`/admin/profil-karyawan?id=${emp.id}`)}
                      className={`group cursor-pointer flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02] ${
                        theme === 'dark'
                          ? 'border-[#30363d] bg-[#21262d]/30 hover:bg-[#21262d]/70 text-slate-200'
                          : 'border-slate-100 bg-[#f8fafc] hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-blue-50 bg-slate-100">
                        <Image
                          src={emp.profile_photo_url || DEFAULT_AVATAR}
                          alt={emp.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-[#123c8c] dark:group-hover:text-[#58a6ff] transition-all">
                          <Highlight text={emp.name} search={query} />
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-400 truncate">
                          <span>{emp.position?.name || "Karyawan"}</span>
                          <span>•</span>
                          <span>{emp.department?.name || "Divisi"}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 mt-2 text-[10px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Mail size={10} />
                            <Highlight text={emp.email} search={query} />
                          </span>
                          {emp.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={10} />
                              <Highlight text={emp.phone} search={query} />
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight size={16} className="shrink-0 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 text-[#123c8c] dark:text-[#58a6ff]" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminSearchPage() {
  return (
    <MobileShell variant="admin">
      <AppHeader title="Pencarian" variant="admin" />
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      }>
        <SearchResultsContent />
      </Suspense>
      <BottomNav variant="admin" />
    </MobileShell>
  );
}
