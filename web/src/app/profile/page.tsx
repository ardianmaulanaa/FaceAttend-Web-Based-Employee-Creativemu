"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CreditCard,
  Gift,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

export default function ProfilePage() {
  const router = useRouter();
  const { authUser, updatePaymentProfile, claimEmployeeReward } = useAppData();
  const [saveMessage, setSaveMessage] = useState("");
  const [claimMessage, setClaimMessage] = useState("");
  const [form, setForm] = useState({
    accountHolderName: "",
    contactEmail: "",
    phoneNumber: "",
    payoutLabel: "",
    accountNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvc: "",
  });

  useEffect(() => {
    if (!authUser) {
      router.replace("/login");
      return;
    }

    setForm({
      accountHolderName:
        authUser.paymentProfile?.accountHolderName || authUser.name,
      contactEmail: authUser.paymentProfile?.contactEmail || authUser.email,
      phoneNumber: authUser.paymentProfile?.phoneNumber || "",
      payoutLabel: authUser.paymentProfile?.payoutLabel || "",
      accountNumber: authUser.paymentProfile?.accountNumber || "",
      expiryMonth: authUser.paymentProfile?.expiryMonth || "",
      expiryYear: authUser.paymentProfile?.expiryYear || "",
      cvc: authUser.paymentProfile?.cvc || "",
    });
  }, [authUser, router]);

  if (!authUser) return null;

  const claimableRewards = [
    {
      title: "Claim Kopi Pagi",
      amount: 5,
      message: "Claim hadiah kecil kopi pagi untuk karyawan aktif",
    },
    {
      title: "Claim Voucher Makan",
      amount: 8,
      message: "Claim hadiah umum voucher makan siang",
    },
    {
      title: "Claim Pulsa Kerja",
      amount: 6,
      message: "Claim pulsa kerja harian untuk kebutuhan komunikasi",
    },
    {
      title: "Claim Transport Lokal",
      amount: 7,
      message: "Claim transport lokal sebagai hadiah umum karyawan",
    },
  ];

  const handleSave = () => {
    const result = updatePaymentProfile(form);
    setSaveMessage(result.message);
  };

  const handleClaim = (reward: (typeof claimableRewards)[number]) => {
    const result = claimEmployeeReward(reward);
    setClaimMessage(result.message);
  };

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Profile"
        subtitle="Informasi akun karyawan"
        rightLabel={authUser.id}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-center text-white shadow-xl shadow-blue-900/20">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-4xl font-black text-[#123c8c]">
              {authUser.name
                .split(" ")
                .slice(0, 2)
                .map((part) => part[0])
                .join("")}
            </div>

            <h2 className="mt-5 text-2xl font-black">{authUser.name}</h2>

            <p className="mt-1 text-sm font-semibold text-blue-100">
              {authUser.id} • {authUser.department}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white">
              <BadgeCheck size={18} />
              Reward Member
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Employee ID
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {authUser.id}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Account Status
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {authUser.status}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Reward Points
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {authUser.rewardPoints}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <UserRound size={26} strokeWidth={2.6} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                  Employee Account
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                  Account Information
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-blue-100">
              Data akun digunakan untuk login, identifikasi karyawan, dan
              pencatatan absensi berbasis formulir dan lampiran bukti.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <Mail size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Email</p>
              <p className="mt-1 font-black text-slate-950">{authUser.email}</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <Building2 size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Department
              </p>
              <p className="mt-1 font-black text-slate-950">
                {authUser.department}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <ShieldCheck size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Role</p>
              <p className="mt-1 font-black text-slate-950">{authUser.role}</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <CalendarDays size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Work Schedule
              </p>
              <p className="mt-1 font-black text-slate-950">08:00 - 17:00</p>
            </div>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-white/90 p-5 shadow-xl shadow-slate-200/60 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <CreditCard size={24} strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">
                  Reward Payout Data
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  No Rekening / Kartu Reward
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Isi data atas nama, nama akun rekening poin, email, no hp, bulan,
              dan no rek untuk pendataan reward.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Atas Nama
                </label>
                <input
                  value={form.accountHolderName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      accountHolderName: event.target.value,
                    }))
                  }
                  placeholder="Atas nama"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Email
                </label>
                <input
                  value={form.contactEmail}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      contactEmail: event.target.value,
                    }))
                  }
                  placeholder="Email"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  No HP
                </label>
                <div className="relative">
                  <Phone
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-amber-700"
                  />
                  <input
                    value={form.phoneNumber}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        phoneNumber: event.target.value,
                      }))
                    }
                    placeholder="No HP"
                    className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Rekening Poin
                </label>
                <input
                  value={form.payoutLabel}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      payoutLabel: event.target.value,
                    }))
                  }
                  placeholder="Contoh: BCA Reward / Bank Lain"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  No Rek
                </label>
                <input
                  value={form.accountNumber}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      accountNumber: event.target.value,
                    }))
                  }
                  placeholder="No rekening / no kartu"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Bulan
                </label>
                <input
                  value={form.expiryMonth}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      expiryMonth: event.target.value,
                    }))
                  }
                  placeholder="Bulan berlaku"
                  className="w-full rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
                />
              </div>
              <input
                value={form.expiryYear}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    expiryYear: event.target.value,
                  }))
                }
                placeholder="Tahun berlaku"
                className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2"
              />
              <input
                value={form.cvc}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cvc: event.target.value }))
                }
                placeholder="CVC"
                className="rounded-2xl border border-amber-100 bg-amber-50/40 px-4 py-3 text-sm font-semibold text-slate-700 outline-none ring-amber-400 focus:ring-2 md:col-span-2"
              />
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-500">
                Poin reward saat ini:{" "}
                <span className="font-black text-amber-700">
                  {authUser.rewardPoints}
                </span>
              </p>

              <button
                onClick={handleSave}
                className="rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-200 transition active:scale-[0.98]"
              >
                Simpan Data Rekening
              </button>
            </div>

            <p className="mt-3 text-xs font-semibold text-slate-500">
              {saveMessage ||
                "Data ini dipakai sebagai label rekening reward untuk bank lain atau kartu lain yang ingin digunakan karyawan."}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5 shadow-lg shadow-emerald-100/50 md:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700">
                <Gift size={24} strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                  Employee Reward
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Claim Hadiah Kecil
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Karyawan bisa melakukan claim hadiah kecil dan umum. Setiap claim
              akan menambah poin reward ke akun Anda.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {claimableRewards.map((reward) => (
                <div
                  key={reward.title}
                  className="rounded-2xl border border-emerald-100 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {reward.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                        {reward.message}
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                      +{reward.amount} poin
                    </span>
                  </div>

                  <button
                    onClick={() => handleClaim(reward)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-lg shadow-emerald-100 transition active:scale-[0.98]"
                  >
                    <Sparkles size={16} />
                    Claim
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs font-semibold text-slate-500">
              {claimMessage ||
                "Setiap claim berhasil akan langsung menambah poin reward karyawan."}
            </p>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
