"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Award,
  AlertOctagon,
  Calendar,
  Building,
  UserCheck,
  TrendingDown,
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
          subtitle="Dashboard Analitik"
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
            
            {/* STATS OVERVIEW CARDS */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Card 1: On-Time Rate */}
              <div className="rounded-[1.75rem] border border-blue-100/50 bg-white/80 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-md">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Rata-rata On-Time
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-black text-slate-900">
                      {data.predictions.predictedOnTimeRate}%
                    </p>
                    <p className="mt-1 text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <TrendingUp size={14} /> Kehadiran Sangat Baik
                    </p>
                  </div>
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <UserCheck size={28} />
                  </div>
                </div>
              </div>

              {/* Card 2: Lateness Rate */}
              <div className="rounded-[1.75rem] border border-blue-100/50 bg-white/80 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-md">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Prediksi Lateness
                </h3>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-black text-slate-900">
                      {data.predictions.predictedLateRate}%
                    </p>
                    <p className="mt-1 text-xs font-bold text-orange-500 flex items-center gap-1">
                      <TrendingDown size={14} /> Mengalami Penurunan
                    </p>
                  </div>
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <TrendingDown size={28} />
                  </div>
                </div>
              </div>

              {/* Card 3: Risk Factor */}
              <div className="rounded-[1.75rem] border border-blue-100/50 bg-white/80 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-md md:col-span-2 lg:col-span-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Status Risiko
                </h3>
                <div className="mt-4">
                  <p className="text-lg font-black text-slate-800 leading-snug">
                    {data.predictions.riskFactor.split(" (")[0]}
                  </p>
                  <span className="mt-2 inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-600">
                    Saran: Pertahankan Reward
                  </span>
                </div>
              </div>
            </div>

            {/* GRAPHS SECTION */}
            <div className="grid gap-6 lg:grid-cols-2">
              
              {/* DEPT DISCIPLINE GRAPH */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/30">
                <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
                  <Building className="text-[#123c8c]" size={20} />
                  <h3 className="text-base font-black text-slate-800">
                    Kedisiplinan Per Divisi
                  </h3>
                </div>

                <div className="mt-6 space-y-5">
                  {data.departmentAnalytics.map((dept) => (
                    <div key={dept.id} className="space-y-2">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-slate-800">{dept.name}</span>
                        <span className="text-blue-900 bg-blue-50 px-2 py-0.5 rounded-lg text-xs font-black">
                          {dept.onTimeRate}% On-Time
                        </span>
                      </div>
                      <div className="h-4 w-full rounded-full bg-slate-50 p-1 overflow-hidden shadow-inner border border-slate-100/50">
                        <div
                          className={`h-full rounded-full transition-all duration-700 shadow-md ${
                            dept.onTimeRate >= 90
                              ? "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-emerald-400/20"
                              : dept.onTimeRate >= 75
                              ? "bg-gradient-to-r from-amber-400 to-[#ff8a00] shadow-orange-400/20"
                              : "bg-gradient-to-r from-red-400 to-red-500 shadow-red-400/20"
                          }`}
                          style={{ width: `${dept.onTimeRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WEEKLY TRENDS GRAPH */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/30">
                <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
                  <Calendar className="text-[#123c8c]" size={20} />
                  <h3 className="text-base font-black text-slate-800">
                    Persentase Lateness Harian
                  </h3>
                </div>

                <div className="mt-6 space-y-4">
                  {data.dayLatenessStats.map((item) => (
                    <div key={item.day} className="flex items-center gap-4">
                      <div className="w-16 text-sm font-bold text-slate-700">{item.day}</div>
                      <div className="flex-1">
                        <div className="h-5 w-full rounded-xl bg-slate-50 p-1 overflow-hidden shadow-inner border border-slate-100/50">
                          <div
                            className="h-full rounded-lg bg-gradient-to-r from-blue-500 to-[#123c8c] shadow-md shadow-blue-500/10 transition-all duration-700"
                            style={{ width: `${item.rate * 4}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right text-xs font-black text-slate-500">
                        {item.rate}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION CENTER - EMPLOYEE RECOMMENDATIONS */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Rewards Recommendation Card */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/30 space-y-4">
                <h3 className="text-sm font-black text-emerald-700 flex items-center gap-2 border-b border-emerald-50 pb-3">
                  <Award size={18} />
                  Rekomendasi Reward (100% On-Time)
                </h3>

                {data.recommendations.rewards.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                    Tidak ada kandidat bulan ini.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.recommendations.rewards.map((rec) => (
                      <div key={rec.id} className="flex justify-between items-center py-2.5">
                        <div>
                          <p className="text-sm font-black text-slate-800">{rec.name}</p>
                          <p className="text-[11px] font-bold text-slate-400">
                            {rec.code} · {rec.department}
                          </p>
                        </div>
                        <span className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                          {rec.presentCount} Hari Hadir
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sanctions Alert Card */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/30 space-y-4">
                <h3 className="text-sm font-black text-red-700 flex items-center gap-2 border-b border-red-50 pb-3">
                  <AlertOctagon size={18} />
                  Peringatan Sanksi ({`>= 3x Telat`})
                </h3>

                {data.recommendations.sanctions.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 py-4 text-center">
                    Semua karyawan disiplin!
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {data.recommendations.sanctions.map((rec) => (
                      <div key={rec.id} className="flex justify-between items-center py-2.5">
                        <div>
                          <p className="text-sm font-black text-slate-800">{rec.name}</p>
                          <p className="text-[11px] font-bold text-slate-400">
                            {rec.code} · {rec.department}
                          </p>
                        </div>
                        <span className="rounded-xl bg-red-50 px-2.5 py-1 text-xs font-black text-red-700">
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
