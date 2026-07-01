"use client";

import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, WalletCards } from "lucide-react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type SalaryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  amount: number;
  note: string;
  createdAt: string;
  createdByAdminId: string;
};

export default function SalaryPage() {
  const router = useRouter();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSalaryData() {
      try {
        const response = await fetch("/api/salary", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          if (response.status === 401 && isMounted) {
            router.replace("/login");
            return;
          }

          if (isMounted) {
            setMessage(result.message || "Gagal mengambil data gaji.");
          }
          return;
        }

        if (isMounted) {
          setRecords(result.records || []);
        }
      } catch {
        if (isMounted) {
          setMessage("Terjadi kesalahan saat mengambil data gaji.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadSalaryData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const totalSalary = useMemo(
    () => records.reduce((sum, item) => sum + item.amount, 0),
    [records],
  );

  const latestSalary = records[0];

  return (
    <MobileShell variant="employee">
      <AppHeader title="Salary" subtitle="Halaman penerimaan gaji karyawan" />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-[2rem] bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20">
          <p className="text-sm font-bold text-blue-100">Employee Salary</p>

          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Penerimaan Gaji
          </h2>

          <p className="mt-3 text-sm leading-7 text-blue-100">
            Gaji yang diinput admin akan langsung tampil di sini sebagai data
            penerimaan untuk karyawan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">
                Total Penerimaan
              </p>
              <WalletCards className="text-[#123c8c]" />
            </div>

            <p className="mt-3 text-3xl font-black text-[#123c8c]">
              Rp {totalSalary.toLocaleString("id-ID")}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg shadow-slate-200/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">Gaji Terakhir</p>
              <BadgeDollarSign className="text-emerald-600" />
            </div>

            <p className="mt-3 text-3xl font-black text-emerald-700">
              {latestSalary
                ? `Rp ${latestSalary.amount.toLocaleString("id-ID")}`
                : "Belum ada"}
            </p>

            <p className="mt-2 text-xs font-semibold text-slate-500">
              {latestSalary?.month || "Menunggu input dari admin"}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <h3 className="text-xl font-black text-slate-950">
            Riwayat Penerimaan
          </h3>

          <div className="mt-4 space-y-3">
            {loading && (
              <p className="text-sm font-semibold text-slate-500">
                Memuat data...
              </p>
            )}

            {!loading && message && (
              <p className="text-sm font-semibold text-rose-600">{message}</p>
            )}

            {!loading && !message && records.length === 0 && (
              <p className="text-sm font-semibold text-slate-500">
                Belum ada gaji yang diterima.
              </p>
            )}

            {!loading &&
              records.map((record) => (
                <div
                  key={record.id}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-black text-slate-950">{record.month}</p>
                    <p className="text-sm font-black text-emerald-700">
                      Rp {record.amount.toLocaleString("id-ID")}
                    </p>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {record.note || "Tidak ada catatan tambahan"}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
