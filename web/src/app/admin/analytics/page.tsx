"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertOctagon,
  Calendar,
  Building,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type DeptAnalytic = {
  id: string;
  name: string;
  totalEmployees: number;
  onTimeRate: number;
  avgLateMinutes: number;
  totalLateDays: number;
};

type MonthlyTrend = {
  month: string;
  onTimeRate: number;
  lateRate: number;
};

type Predictions = {
  nextMonth: string;
  predictedOnTimeRate: number;
  predictedLateRate: number;
  trendDirection: "improving" | "stable" | "declining";
  riskFactor: string;
};

type DayLateness = {
  day: string;
  rate: number;
  label: string;
};

type SanctionRecommendation = {
  id: string;
  name: string;
  code: string;
  department: string;
  lateCount: number;
};

type RewardRecommendation = {
  id: string;
  name: string;
  code: string;
  department: string;
  presentCount: number;
  lateCount: number;
};

type AnalyticsData = {
  period: { month: number; year: number };
  departmentAnalytics: DeptAnalytic[];
  monthlyTrends: MonthlyTrend[];
  predictions: Predictions;
  dayLatenessStats: DayLateness[];
  recommendations: {
    sanctions: SanctionRecommendation[];
    rewards: RewardRecommendation[];
  };
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadAnalytics() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/analytics", {
        method: "GET",
        cache: "no-store",
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        setErrorMessage(result.message || "Gagal memuat data analitik.");
      }
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  return (
    <MobileShell variant="admin">
      <main className="min-h-screen bg-[#f8fbff] pb-24">
        <AppHeader
          title="HR Analytics"
          subtitle="Beranda / Dashboard / Analytics"
          variant="admin"
        />

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="animate-spin text-[#123c8c]" size={38} />
          </div>
        ) : errorMessage ? (
          <div className="mx-auto mt-10 max-w-md rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm font-bold text-red-600">
            {errorMessage}
          </div>
        ) : data ? (
          <section className="mx-auto mt-6 max-w-7xl px-5 md:px-10 lg:px-16 space-y-6">
            
            {/* OVERALL STATS ROW */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Card 1: On-Time Rate Gauge */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50">
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Rata-rata On-Time Perusahaan
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-black text-slate-900">
                      {data.predictions.predictedOnTimeRate}%
                    </p>
                    <p className="mt-1.5 text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <TrendingUp size={14} /> Kehadiran sangat baik
                    </p>
                  </div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <UserCheck size={32} />
                  </div>
                </div>
              </div>

              {/* Card 2: Lateness Risk Prediction */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50">
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Prediksi Lateness Bulan Depan
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-black text-slate-900">
                      {data.predictions.predictedLateRate}%
                    </p>
                    <p className="mt-1.5 text-xs font-bold text-slate-500">
                      Turun dari bulan lalu
                    </p>
                  </div>
                  <div className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white bg-[#ff8a00]`}>
                    <TrendingDown size={32} />
                  </div>
                </div>
              </div>

              {/* Card 3: Risk Factor */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50 md:col-span-2 lg:col-span-1">
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Faktor Risiko Kedisiplinan
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-base font-black text-slate-900 leading-snug">
                      {data.predictions.riskFactor}
                    </p>
                    <p className="mt-2 text-xs font-bold text-blue-600">
                      Rekomendasi: Lanjutkan reward berkala
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN CHART & LEADERBOARD GRID */}
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* LEFT CARD: Department Discipline */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Building className="text-[#123c8c]" size={20} />
                    Kedisiplinan Per Departemen
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Berdasarkan tingkat persentase ketepatan waktu hadir (On-Time Rate)
                  </p>
                </div>

                <div className="space-y-4">
                  {data.departmentAnalytics.map((dept) => (
                    <div key={dept.id} className="space-y-2">
                      <div className="flex justify-between text-sm font-bold text-slate-700">
                        <span>{dept.name}</span>
                        <span>{dept.onTimeRate}% On-Time</span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-slate-100 p-0.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            dept.onTimeRate >= 90
                              ? "bg-emerald-500"
                              : dept.onTimeRate >= 75
                              ? "bg-[#ff8a00]"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${dept.onTimeRate}%` }}
                        />
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400">
                        {dept.totalEmployees} Karyawan · Rata-rata telat: {dept.avgLateMinutes} menit
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT CARD: Days Lateness Stats */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="text-[#123c8c]" size={20} />
                    Analisis Tingkat Lateness Mingguan
                  </h3>
                  <p className="text-xs font-bold text-slate-400 mt-1">
                    Hari yang paling rentan terhadap keterlambatan karyawan
                  </p>
                </div>

                <div className="space-y-4">
                  {data.dayLatenessStats.map((item) => (
                    <div key={item.day} className="flex items-center justify-between gap-4">
                      <div className="w-16 text-sm font-bold text-slate-800">{item.day}</div>
                      <div className="flex-1">
                        <div className="h-4 w-full rounded-xl bg-slate-100 p-0.5 overflow-hidden">
                          <div
                            className="h-full rounded-lg bg-[#123c8c] opacity-85"
                            style={{ width: `${item.rate * 4}%` }} // Scale multiplier for display
                          />
                        </div>
                      </div>
                      <div className="w-40 text-right text-xs font-bold text-slate-500">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RECOMMENDATIONS & SANCTIONS */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Rewards Recommendation Card */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50 space-y-4">
                <h3 className="text-base font-black text-emerald-700 flex items-center gap-2 border-b border-emerald-50 pb-3">
                  <Award size={20} />
                  Kandidat Penerima Reward
                </h3>

                {data.recommendations.rewards.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-400 py-4 text-center">
                    Tidak ada kandidat bulan ini.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.recommendations.rewards.map((rec) => (
                      <div key={rec.id} className="flex justify-between items-center py-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{rec.name}</p>
                          <p className="text-xs font-semibold text-slate-400">
                            {rec.code} · {rec.department}
                          </p>
                        </div>
                        <span className="rounded-xl bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 uppercase">
                          {rec.presentCount} Hari Hadir (0 Telat)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sanctions Alert Card */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50 space-y-4">
                <h3 className="text-base font-black text-red-700 flex items-center gap-2 border-b border-red-50 pb-3">
                  <AlertOctagon size={20} />
                  Peringatan Disiplin (Sanksi)
                </h3>

                {data.recommendations.sanctions.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-400 py-4 text-center">
                    Semua karyawan disiplin bulan ini!
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.recommendations.sanctions.map((rec) => (
                      <div key={rec.id} className="flex justify-between items-center py-3">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{rec.name}</p>
                          <p className="text-xs font-semibold text-slate-400">
                            {rec.code} · {rec.department}
                          </p>
                        </div>
                        <span className="rounded-xl bg-red-50 px-3 py-1 text-xs font-black text-red-700 uppercase">
                          {rec.lateCount}x Terlambat
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </section>
        ) : null}

        <BottomNav variant="admin" />
      </main>
    </MobileShell>
  );
}
