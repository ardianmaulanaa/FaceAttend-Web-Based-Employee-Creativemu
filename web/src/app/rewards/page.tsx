"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, Gift, Sparkles, Trophy } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

export default function RewardsPage() {
  const router = useRouter();
  const { authUser, state, markNotificationRead } = useAppData();

  useEffect(() => {
    if (!authUser) {
      router.replace("/login");
    }
  }, [authUser, router]);

  const rewardHistory = useMemo(() => {
    if (!authUser) return [];
    return state.rewards
      .filter((reward) => reward.employeeId === authUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [authUser, state.rewards]);

  const notifications = useMemo(() => {
    if (!authUser) return [];
    return state.notifications
      .filter((item) => item.employeeId === authUser.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [authUser, state.notifications]);

  const leaderboard = useMemo(
    () =>
      state.employees
        .filter((employee) => employee.role === "employee")
        .sort((a, b) => b.rewardPoints - a.rewardPoints),
    [state.employees],
  );

  if (!authUser) return null;

  const rewardTargetByCategory = {
    tetap: 250,
    freelance: 200,
    pengajar: 220,
  } as const;

  const rewardTarget = rewardTargetByCategory[authUser.employeeCategory] ?? 250;
  const progressPercent = Math.min(
    100,
    Math.round((authUser.rewardPoints / rewardTarget) * 100),
  );

  const rank =
    leaderboard.findIndex((item) => item.id === authUser.id) >= 0
      ? leaderboard.findIndex((item) => item.id === authUser.id) + 1
      : "-";
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Rewards"
        subtitle="Poin, leaderboard, dan notifikasi reward"
        rightLabel={authUser.id}
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-[1.6rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
            Poin Sesuai Bidang
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-600">
            Bidang:{" "}
            <span className="font-black text-slate-900">
              {authUser.department}
            </span>{" "}
            • Kategori:{" "}
            <span className="font-black text-slate-900">
              {authUser.employeeCategory}
            </span>
          </p>

          <div className="mt-3 h-2 w-full rounded-full bg-blue-100">
            <div
              className="h-2 rounded-full bg-[#123c8c]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="mt-2 text-xs font-semibold text-slate-500">
            Progress poin bidang: {progressPercent}% ({authUser.rewardPoints}/
            {rewardTarget})
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-5 shadow-lg shadow-emerald-100/50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-emerald-800">Total Poin</p>
              <Gift size={20} className="text-emerald-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-700">
              {authUser.rewardPoints}
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50/70 p-5 shadow-lg shadow-amber-100/50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-amber-800">Ranking</p>
              <Trophy size={20} className="text-amber-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-amber-700">#{rank}</p>
          </div>

          <div className="rounded-[1.75rem] border border-indigo-200 bg-indigo-50/70 p-5 shadow-lg shadow-indigo-100/50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-indigo-800">Notifikasi</p>
              <Bell size={20} className="text-indigo-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-indigo-700">
              {unreadCount}
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50 md:p-8">
          <div className="flex items-center gap-3">
            <Sparkles size={22} className="text-[#123c8c]" />
            <h2 className="text-xl font-black text-slate-950">
              Riwayat Reward Saya
            </h2>
          </div>

          {rewardHistory.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Belum ada reward.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {rewardHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-slate-950">{item.title}</p>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                      +{item.amount} poin
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-amber-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-xl font-black text-slate-950">Leaderboard</h2>
            <div className="mt-4 space-y-2">
              {leaderboard.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-slate-700">
                    #{index + 1} {item.name}
                  </p>
                  <p className="text-sm font-black text-amber-700">
                    {item.rewardPoints} poin
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-indigo-200 bg-white p-6 shadow-xl shadow-slate-200/50">
            <h2 className="text-xl font-black text-slate-950">
              Notifikasi Saya
            </h2>
            <div className="mt-4 space-y-3">
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500">Belum ada notifikasi.</p>
              ) : (
                notifications.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-black text-slate-950">
                        {item.title}
                      </p>
                      {!item.read ? (
                        <button
                          onClick={() => markNotificationRead(item.id)}
                          className="rounded-lg bg-indigo-600 px-2 py-1 text-xs font-black text-white"
                        >
                          Tandai dibaca
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
