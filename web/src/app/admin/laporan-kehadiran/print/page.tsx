"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type AttendanceReport = {
  id: string;
  employeeName: string;
  employeeCode: string | null;
  date: string;
  dateLabel: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  statusLabel: string;
  workModeLabel: string;
  hasPhoto: boolean;
  hasLocation: boolean;
};

type AttendanceReportResponse = {
  success: boolean;
  message?: string;
  reports: AttendanceReport[];
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function getMonthLabel(month: number) {
  const date = new Date(new Date().getFullYear(), Math.max(0, month - 1), 1);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
  }).format(date);
}

function AttendanceReportPrintContent() {
  const searchParams = useSearchParams();
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
  const year = Number(searchParams.get("year") || new Date().getFullYear());
  const selectedDate = String(searchParams.get("date") || "");
  const status = String(searchParams.get("status") || "all");
  const search = String(searchParams.get("search") || "");

  const periodLabel = selectedDate
    ? `Tanggal ${selectedDate}`
    : `${getMonthLabel(month)} ${year}`;

  const generatedAt = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }).format(new Date()),
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadReports() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const params = new URLSearchParams(searchParams.toString());
        const response = await fetch(
          `/api/admin/attendance-reports?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data: AttendanceReportResponse = await readJsonResponse(response);

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Gagal mengambil laporan kehadiran.");
        }

        if (!isMounted) return;

        setReports(data.reports || []);

        window.setTimeout(() => {
          window.focus();
          window.print();
        }, 450);
      } catch (error) {
        if (!isMounted) return;

        setReports([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Gagal mengambil laporan kehadiran.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const groupedReports = useMemo(() => {
    const groups = new Map<string, AttendanceReport[]>();

    reports.forEach((item) => {
      const key = item.dateLabel || item.date || "Tanpa Tanggal";
      const current = groups.get(key) || [];
      current.push(item);
      groups.set(key, current);
    });

    return Array.from(groups.entries()).map(([dateLabel, items]) => ({
      dateLabel,
      items,
    }));
  }, [reports]);

  const stats = useMemo(
    () => ({
      total: reports.length,
      totalDates: groupedReports.length,
      withPhoto: reports.filter((item) => item.hasPhoto).length,
      withLocation: reports.filter((item) => item.hasLocation).length,
    }),
    [groupedReports.length, reports],
  );

  return (
    <main>
      <style jsx global>{`
        @page {
          size: A4 landscape;
          margin: 14mm;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          color: #0f172a;
          font-family: Arial, Helvetica, sans-serif;
          background: #ffffff;
        }

        .print-page {
          padding: 24px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 3px solid #123c8c;
          padding-bottom: 16px;
          margin-bottom: 18px;
        }

        .eyebrow {
          margin: 0 0 6px;
          color: #ff8a00;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0;
          color: #123c8c;
          font-size: 26px;
          line-height: 1.15;
        }

        .meta {
          min-width: 260px;
          border: 1px solid #dbeafe;
          border-radius: 14px;
          padding: 12px 14px;
          background: #f8fbff;
          font-size: 12px;
          line-height: 1.7;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }

        .stat {
          border: 1px solid #dbeafe;
          border-radius: 14px;
          padding: 12px;
          background: #f8fbff;
        }

        .stat span {
          display: block;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
        }

        .stat strong {
          display: block;
          margin-top: 6px;
          color: #123c8c;
          font-size: 24px;
        }

        .summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 9px 10px;
          font-size: 11px;
          background: #ffffff;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10.5px;
        }

        th {
          background: #123c8c;
          color: #ffffff;
          padding: 9px 8px;
          text-align: left;
          white-space: nowrap;
        }

        td {
          border-bottom: 1px solid #e2e8f0;
          padding: 8px;
          vertical-align: top;
        }

        tr:nth-child(even) td {
          background: #f8fbff;
        }

        small {
          display: block;
          margin-top: 3px;
          color: #64748b;
          font-size: 9.5px;
        }

        .state {
          border: 1px dashed #bfdbfe;
          border-radius: 16px;
          padding: 24px;
          color: #64748b;
          font-weight: 700;
          text-align: center;
        }

        .footer {
          margin-top: 16px;
          color: #64748b;
          font-size: 10px;
          text-align: right;
        }

        @media print {
          .print-page {
            padding: 0;
          }
        }
      `}</style>

      <section className="print-page">
        <section className="header">
          <div>
            <p className="eyebrow">FaceAttend Creativemu</p>
            <h1>Laporan Kehadiran Karyawan</h1>
          </div>

          <div className="meta">
            <div>
              <strong>Periode:</strong> {periodLabel}
            </div>
            <div>
              <strong>Status:</strong> {status}
            </div>
            <div>
              <strong>Pencarian:</strong> {search || "-"}
            </div>
            <div>
              <strong>Dibuat:</strong> {generatedAt}
            </div>
          </div>
        </section>

        <section className="stats">
          <div className="stat">
            <span>Total Rekap</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="stat">
            <span>Tanggal Terdata</span>
            <strong>{stats.totalDates}</strong>
          </div>
          <div className="stat">
            <span>Ada Foto</span>
            <strong>{stats.withPhoto}</strong>
          </div>
          <div className="stat">
            <span>Ada Lokasi</span>
            <strong>{stats.withLocation}</strong>
          </div>
        </section>

        {isLoading ? (
          <div className="state">Memuat laporan kehadiran...</div>
        ) : errorMessage ? (
          <div className="state">{errorMessage}</div>
        ) : reports.length === 0 ? (
          <div className="state">Tidak ada data laporan pada filter ini.</div>
        ) : (
          <>
            <section className="summary">
              {groupedReports.map((group) => (
                <div key={group.dateLabel} className="summary-row">
                  <span>{group.dateLabel}</span>
                  <strong>{group.items.length} karyawan</strong>
                </div>
              ))}
            </section>

            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Karyawan</th>
                  <th>Tanggal</th>
                  <th>Masuk</th>
                  <th>Keluar</th>
                  <th>Durasi</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Foto</th>
                  <th>Lokasi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((item, index) => (
                  <tr key={item.id || `${item.employeeName}-${index}`}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{item.employeeName}</strong>
                      <small>{item.employeeCode || "-"}</small>
                    </td>
                    <td>{item.dateLabel || item.date}</td>
                    <td>{item.checkIn}</td>
                    <td>{item.checkOut}</td>
                    <td>{item.duration}</td>
                    <td>{item.statusLabel}</td>
                    <td>{item.workModeLabel}</td>
                    <td>{item.hasPhoto ? "Ada" : "Tidak"}</td>
                    <td>{item.hasLocation ? "Ada" : "Tidak"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="footer">Dokumen dibuat otomatis dari FaceAttend.</div>
      </section>
    </main>
  );
}

export default function AttendanceReportPrintPage() {
  return (
    <Suspense fallback={<main className="print-page">Memuat laporan...</main>}>
      <AttendanceReportPrintContent />
    </Suspense>
  );
}
