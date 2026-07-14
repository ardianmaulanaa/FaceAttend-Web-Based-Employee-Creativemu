"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useMemo, Suspense } from "react";
import {
  Home,
  ScanFace,
  History,
  CalendarDays,
  Megaphone,
  UserRound,
  Search,
  ArrowRight,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useTheme } from "@/context/ThemeContext";

const employeeSuggestions = [
  { href: "/home", label: "Home / Dashboard", icon: Home, category: "Menu Utama", keywords: ["home", "beranda", "dashboard", "utama"] },
  { href: "/attendance", label: "Attendance / Absen", icon: ScanFace, category: "Menu Utama", keywords: ["attendance", "absen", "kehadiran", "scan wajah", "face recognition", "masuk", "pulang"] },
  { href: "/history", label: "History Kehadiran", icon: History, category: "Menu Utama", keywords: ["history", "riwayat", "kehadiran", "presensi", "log", "daftar"] },
  { href: "/cuti", label: "Pengajuan Cuti / Izin", icon: CalendarDays, category: "Menu Utama", keywords: ["cuti", "izin", "sakit", "pengajuan", "leave", "sakit", "permohonan"] },
  { href: "/pengumuman", label: "Info Pengumuman", icon: Megaphone, category: "Menu Utama", keywords: ["pengumuman", "info", "informasi", "megafon", "announcement", "kabar"] },
  { href: "/profile", label: "Profile Saya", icon: UserRound, category: "Menu Utama", keywords: ["profile", "profil", "akun", "saya", "user", "pengaturan", "data diri"] },
];

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

  const results = useMemo(() => {
    if (!query.trim()) return employeeSuggestions;
    const cleanQuery = query.toLowerCase();
    return employeeSuggestions.filter((item) =>
      item.label.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery) ||
      item.keywords.some((kw) => kw.toLowerCase().includes(cleanQuery))
    );
  }, [query]);

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
                <>Menampilkan semua menu utama karyawan</>
              )}
            </p>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Tidak menemukan menu atau data yang cocok dengan pencarian Anda.
          </div>
        ) : (
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
                      <h3 className="text-sm font-black leading-snug truncate group-hover:text-[#123c8c] dark:group-hover:text-[#58a6ff]">
                        <Highlight text={item.label} search={query} />
                      </h3>
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
        )}
      </div>
    </section>
  );
}

export default function EmployeeSearchPage() {
  return (
    <MobileShell variant="employee">
      <AppHeader title="Pencarian" variant="employee" />
      <Suspense fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      }>
        <SearchResultsContent />
      </Suspense>
      <BottomNav variant="employee" />
    </MobileShell>
  );
}
