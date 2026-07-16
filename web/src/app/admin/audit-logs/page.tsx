"use client";

import { useEffect, useState, useMemo } from "react";
import { Search, ShieldAlert, Loader2, Calendar, Download } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { AppCard, AppInput } from "@/components/ui/AppUI";

type AuditLog = {
  id: string;
  actorEmail: string;
  actorName: string;
  action: string;
  details: string;
  timestamp: number;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function fetchLogs() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/audit-logs", {
        method: "GET",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  function handleExportCSV() {
    if (filteredLogs.length === 0) return;
    const headers = ["Waktu", "Aksi", "Nama Aktor", "Email Aktor", "Detail Perubahan"];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toLocaleString("id-ID"),
      log.action,
      log.actorName,
      log.actorEmail,
      log.details,
    ]);
    const csvContent = "\uFEFF" + "sep=,\n" + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Audit_Logs_FaceAttend_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  useEffect(() => {
    void fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const s = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.actorName.toLowerCase().includes(s) ||
        l.actorEmail.toLowerCase().includes(s) ||
        l.action.toLowerCase().includes(s) ||
        l.details.toLowerCase().includes(s)
    );
  }, [logs, search]);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <AppHeader
        title="Audit Logs"
        subtitle="Riwayat aktivitas dan log perubahan sistem"
        variant="admin"
      />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-28 text-slate-950">
        <section className="mx-auto max-w-7xl px-5 pt-6 md:px-8 lg:px-10">
          <AppCard className="mb-6 rounded-[2rem] border-white/80 bg-white/95 p-4 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Search size={18} />
                </span>
                <AppInput
                  type="text"
                  placeholder="Cari berdasarkan nama, email, aksi, atau detail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-11 h-12 md:h-13 rounded-2xl"
                />
              </div>
              <button
                onClick={handleExportCSV}
                disabled={filteredLogs.length === 0}
                className="h-12 md:h-13 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 shadow-md transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Ekspor CSV
              </button>
            </div>
          </AppCard>

          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[#123c8c]" size={36} />
              <p className="text-sm font-semibold text-slate-500">Memuat audit logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-[2rem] bg-white p-8 text-center shadow-sm">
              <ShieldAlert className="text-slate-300" size={48} />
              <h3 className="text-lg font-black text-slate-900">Tidak ada log aktivitas</h3>
              <p className="text-sm text-slate-500">
                Belum ada aktivitas tercatat atau pencarian Anda tidak membuahkan hasil.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <AppCard
                  key={log.id}
                  className="rounded-[1.6rem] border-blue-50 bg-white p-5 shadow-sm hover:shadow-md transition duration-200"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#123c8c]/10 px-3 py-1 text-xs font-black text-[#123c8c]">
                          {log.action}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          oleh <strong className="text-slate-800">{log.actorName}</strong> ({log.actorEmail})
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-700 leading-relaxed">
                        {log.details}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold shrink-0">
                      <Calendar size={14} />
                      {new Date(log.timestamp).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </div>
                  </div>
                </AppCard>
              ))}
            </div>
          )}
        </section>
        <BottomNav />
      </main>
    </MobileShell>
  );
}
