"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Edit3,
  Loader2,
  MapPin,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import {
  AppButton,
  AppCard,
  AppEmptyState,
  AppInput,
  AppSelect,
  AppTextarea,
} from "@/components/ui/AppUI";

type OfficeStatus = "active" | "inactive";

type OfficeLocation = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  status: OfficeStatus;
};

type OfficeForm = {
  name: string;
  address: string;
  coordinateText: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  status: OfficeStatus;
};

type OfficeResponse = {
  success: boolean;
  message?: string;
  offices?: OfficeLocation[];
  office?: OfficeLocation;
};

const emptyForm: OfficeForm = {
  name: "",
  address: "",
  coordinateText: "",
  latitude: "",
  longitude: "",
  radius_meters: "100",
  status: "active",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function toFormData(office: OfficeLocation): OfficeForm {
  return {
    name: office.name || "",
    address: office.address || "",
    coordinateText: `${office.latitude}, ${office.longitude}`,
    latitude: String(office.latitude ?? ""),
    longitude: String(office.longitude ?? ""),
    radius_meters: String(office.radius_meters ?? 100),
    status: office.status || "active",
  };
}

function isValidLatLng(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function parseCoordinateText(text: string) {
  const value = decodeURIComponent(String(text || "").trim());

  if (!value) return null;

  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (!match) continue;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);

    if (isValidLatLng(latitude, longitude)) {
      return {
        latitude,
        longitude,
      };
    }
  }

  const numbers = value.match(/-?\d+(?:\.\d+)?/g)?.map(Number) || [];

  for (let index = 0; index < numbers.length - 1; index += 1) {
    const latitude = numbers[index];
    const longitude = numbers[index + 1];

    if (isValidLatLng(latitude, longitude)) {
      return {
        latitude,
        longitude,
      };
    }
  }

  return null;
}

function StatusBadge({ status }: { status: OfficeStatus }) {
  const active = status === "active";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full px-3 py-1.5 text-xs font-black ring-1",
        active
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-slate-100 text-slate-600 ring-slate-200"
      )}
    >
      {active ? "Aktif" : "Nonaktif"}
    </span>
  );
}

function OfficeCard({
  office,
  onEdit,
  onDelete,
}: {
  office: OfficeLocation;
  onEdit: (office: OfficeLocation) => void;
  onDelete: (office: OfficeLocation) => void;
}) {
  return (
    <AppCard className="w-full max-w-full overflow-hidden rounded-[2rem] border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60 md:overflow-visible">
      <div className="flex w-full max-w-full flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex w-full min-w-0 gap-3 md:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <Building2 size={24} strokeWidth={2.6} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 max-w-full break-words text-lg font-black leading-tight text-slate-950 md:truncate">
                {office.name}
              </h3>

              <StatusBadge status={office.status} />
            </div>

            <p className="mt-2 max-w-full break-words text-sm font-semibold leading-6 text-slate-500">
              {office.address || "Alamat belum diisi."}
            </p>

            <div className="mt-4 grid w-full max-w-full gap-2 text-sm font-bold text-slate-500 md:grid-cols-3">
              <div className="min-w-0 rounded-2xl bg-[#f8fbff] p-3">
                <p className="break-words text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Latitude
                </p>

                <p className="mt-1 max-w-full break-words text-slate-800">
                  {office.latitude}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl bg-[#f8fbff] p-3">
                <p className="break-words text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Longitude
                </p>

                <p className="mt-1 max-w-full break-words text-slate-800">
                  {office.longitude}
                </p>
              </div>

              <div className="min-w-0 rounded-2xl bg-[#f8fbff] p-3">
                <p className="break-words text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Radius
                </p>

                <p className="mt-1 max-w-full break-words text-slate-800">
                  {office.radius_meters} meter
                </p>
              </div>
            </div>

            <a
              href={`https://www.google.com/maps?q=${office.latitude},${office.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex max-w-full items-center justify-center gap-2 rounded-2xl bg-[#f6f8ff] px-4 py-2 text-xs font-black text-[#123c8c] ring-1 ring-blue-100 transition active:scale-[0.98]"
            >
              <MapPin size={15} className="shrink-0" strokeWidth={2.7} />
              <span className="truncate">Buka Maps</span>
            </a>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 md:justify-start">
          <button
            type="button"
            onClick={() => onEdit(office)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#123c8c] transition active:scale-95"
            aria-label="Edit kantor"
          >
            <Edit3 size={18} strokeWidth={2.6} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(office)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition active:scale-95"
            aria-label="Hapus kantor"
          >
            <Trash2 size={18} strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </AppCard>
  );
}

function OfficeFormPanel({
  form,
  editingOffice,
  isSaving,
  onChange,
  onCancel,
  onSubmit,
  onParseCoordinate,
}: {
  form: OfficeForm;
  editingOffice: OfficeLocation | null;
  isSaving: boolean;
  onChange: <K extends keyof OfficeForm>(key: K, value: OfficeForm[K]) => void;
  onCancel: () => void;
  onSubmit: () => void;
  onParseCoordinate: () => void;
}) {
  return (
    <AppCard className="h-fit w-full max-w-full overflow-hidden rounded-[2rem] border-white/80 bg-white p-5 shadow-2xl shadow-slate-300/30 md:overflow-visible md:p-6">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="break-words text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
            {editingOffice ? "Edit Kantor" : "Tambah Kantor"}
          </p>

          <h2 className="mt-2 break-words text-3xl font-black tracking-tight text-slate-950 md:text-2xl">
            Lokasi Kantor
          </h2>

          <p className="mt-3 break-words text-base font-semibold leading-7 text-slate-500 md:text-sm md:leading-6">
            Data ini dipakai untuk validasi GPS saat karyawan check-in dan
            check-out.
          </p>
        </div>

        {editingOffice ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition active:scale-95 disabled:opacity-60"
            aria-label="Batal edit"
          >
            <X size={18} strokeWidth={2.7} />
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <AppInput
          label="Nama Kantor"
          value={form.name}
          onChange={(event) => onChange("name", event.target.value)}
          placeholder="Contoh: Creativemu Academy"
        />

        <AppTextarea
          label="Alamat"
          value={form.address}
          onChange={(event) => onChange("address", event.target.value)}
          placeholder="Contoh: Jogja"
          className="min-h-28"
        />

        <div className="w-full max-w-full overflow-hidden rounded-[1.7rem] border border-blue-100 bg-[#f8fbff] p-4">
          <AppTextarea
            label="Koordinat / Link Google Maps"
            value={form.coordinateText}
            onChange={(event) => onChange("coordinateText", event.target.value)}
            placeholder="Contoh: -7.812201, 110.2685415 atau paste link Google Maps"
            className="min-h-24 bg-white"
          />

          <AppButton
            type="button"
            variant="secondary"
            onClick={onParseCoordinate}
            disabled={isSaving}
            full
            className="mt-3"
            leftIcon={<Search size={18} />}
          >
            Ambil Latitude Longitude
          </AppButton>

          <p className="mt-3 break-words text-xs font-semibold leading-5 text-slate-500">
            Bisa paste format koordinat biasa atau link Google Maps. Sistem akan
            otomatis mengambil angka latitude dan longitude.
          </p>
        </div>

        <div className="grid w-full max-w-full gap-4 md:grid-cols-2">
          <AppInput
            label="Latitude"
            value={form.latitude}
            onChange={(event) => onChange("latitude", event.target.value)}
            placeholder="-7.812201"
            inputMode="decimal"
          />

          <AppInput
            label="Longitude"
            value={form.longitude}
            onChange={(event) => onChange("longitude", event.target.value)}
            placeholder="110.2685415"
            inputMode="decimal"
          />
        </div>

        <div className="grid w-full max-w-full gap-4 md:grid-cols-2">
          <AppInput
            label="Radius Validasi Meter"
            value={form.radius_meters}
            onChange={(event) => onChange("radius_meters", event.target.value)}
            placeholder="100"
            inputMode="numeric"
          />

          <AppSelect
            label="Status"
            value={form.status}
            onChange={(event) =>
              onChange("status", event.target.value as OfficeStatus)
            }
          >
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </AppSelect>
        </div>

        <div className="w-full max-w-full overflow-hidden rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
          <div className="flex min-w-0 items-start gap-3">
            <MapPin
              size={20}
              className="mt-0.5 shrink-0 text-[#123c8c]"
              strokeWidth={2.7}
            />

            <p className="min-w-0 flex-1 break-words text-sm font-semibold leading-6 text-slate-500">
              Latitude dan longitude bisa diambil dari Google Maps. Radius
              menentukan batas jarak karyawan boleh absen dari titik kantor.
            </p>
          </div>
        </div>

        <div className="grid w-full max-w-full gap-3 md:grid-cols-2">
          {editingOffice ? (
            <AppButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSaving}
              full
            >
              Batal
            </AppButton>
          ) : null}

          <AppButton
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            full
            className={editingOffice ? "" : "md:col-span-2"}
            leftIcon={
              isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )
            }
          >
            {isSaving
              ? "Menyimpan..."
              : editingOffice
                ? "Simpan Perubahan"
                : "Tambah Kantor"}
          </AppButton>
        </div>
      </div>
    </AppCard>
  );
}

export default function AdminOfficePage() {
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [form, setForm] = useState<OfficeForm>(emptyForm);
  const [editingOffice, setEditingOffice] = useState<OfficeLocation | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const activeOffices = useMemo(
    () => offices.filter((office) => office.status === "active").length,
    [offices]
  );

  function updateForm<K extends keyof OfficeForm>(key: K, value: OfficeForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingOffice(null);
  }

  function parseCoordinate() {
    const parsed = parseCoordinateText(form.coordinateText);

    if (!parsed) {
      alert(
        "Koordinat tidak valid. Gunakan format seperti: -7.812201, 110.2685415 atau link Google Maps."
      );
      return;
    }

    setForm((current) => ({
      ...current,
      latitude: String(parsed.latitude),
      longitude: String(parsed.longitude),
      coordinateText: `${parsed.latitude}, ${parsed.longitude}`,
    }));
  }

  async function loadOffices() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/admin/offices", {
        method: "GET",
        cache: "no-store",
      });

      const data: OfficeResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal mengambil data kantor.");
      }

      setOffices(data.offices || []);
    } catch (error) {
      console.error("LOAD_OFFICES_ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data kantor."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function saveOffice() {
    try {
      setIsSaving(true);

      const parsedLatitude = Number(form.latitude);
      const parsedLongitude = Number(form.longitude);

      if (!isValidLatLng(parsedLatitude, parsedLongitude)) {
        throw new Error(
          "Latitude atau longitude tidak valid. Coba isi lewat kolom koordinat lalu klik Ambil Latitude Longitude."
        );
      }

      const payload = {
        name: form.name,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        radius_meters: form.radius_meters,
        status: form.status,
      };

      const url = editingOffice
        ? `/api/admin/offices/${editingOffice.id}`
        : "/api/admin/offices";

      const response = await fetch(url, {
        method: editingOffice ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: OfficeResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan data kantor.");
      }

      alert(data.message || "Data kantor berhasil disimpan.");
      resetForm();
      await loadOffices();
    } catch (error) {
      console.error("SAVE_OFFICE_ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan data kantor."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteOffice(office: OfficeLocation) {
    const confirmed = window.confirm(
      `Hapus kantor "${office.name}"? Data akan dinonaktifkan.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/admin/offices/${office.id}`, {
        method: "DELETE",
      });

      const data: OfficeResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal menghapus kantor.");
      }

      alert(data.message || "Kantor berhasil dinonaktifkan.");
      await loadOffices();
    } catch (error) {
      console.error("DELETE_OFFICE_ERROR:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus kantor.");
    }
  }

  function startEdit(office: OfficeLocation) {
    setEditingOffice(office);
    setForm(toFormData(office));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    loadOffices();
  }, []);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <div className="min-h-dvh w-full max-w-full overflow-x-hidden bg-white md:bg-[#f6f8ff]">
        <AppHeader
          title="Kantor"
          subtitle="Kelola lokasi kantor dan radius validasi absensi"
          variant="admin"
        />

        <main className="min-h-dvh w-full max-w-full overflow-x-hidden bg-white text-slate-950 md:bg-gradient-to-br md:from-[#f6f8ff] md:via-white md:to-[#eef4ff]">
          <section
            className="mx-auto grid w-full max-w-full items-start gap-6 overflow-x-hidden px-4 pt-6 md:max-w-7xl md:overflow-visible md:px-10 md:py-8 lg:grid-cols-[0.85fr_1.15fr] lg:px-16"
            style={{
              paddingBottom: "calc(10rem + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <OfficeFormPanel
              form={form}
              editingOffice={editingOffice}
              isSaving={isSaving}
              onChange={updateForm}
              onCancel={resetForm}
              onSubmit={saveOffice}
              onParseCoordinate={parseCoordinate}
            />

            <div className="w-full max-w-full space-y-5 overflow-hidden md:overflow-visible">
              <div className="w-full max-w-full overflow-hidden rounded-[2rem] bg-[#123c8c] p-5 text-white shadow-2xl shadow-blue-900/20 md:p-8">
                <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                      Office Location
                    </p>

                    <h1 className="mt-2 break-words text-3xl font-black tracking-tight md:text-4xl">
                      Data Kantor
                    </h1>

                    <p className="mt-3 max-w-2xl break-words text-sm font-semibold leading-7 text-blue-100">
                      Titik lokasi kantor digunakan untuk menentukan apakah
                      karyawan berada di dalam radius saat absensi.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={loadOffices}
                    disabled={isLoading}
                    className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-950/20 transition active:scale-[0.98] disabled:opacity-60 md:w-auto"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <RefreshCcw size={18} />
                    )}
                    Refresh
                  </button>
                </div>

                <div className="mt-6 grid w-full max-w-full gap-3 md:grid-cols-3">
                  <div className="min-w-0 rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                    <p className="break-words text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                      Total
                    </p>

                    <p className="mt-2 break-words text-3xl font-black">
                      {offices.length}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                    <p className="break-words text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                      Aktif
                    </p>

                    <p className="mt-2 break-words text-3xl font-black">
                      {activeOffices}
                    </p>
                  </div>

                  <div className="min-w-0 rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
                    <p className="break-words text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                      Nonaktif
                    </p>

                    <p className="mt-2 break-words text-3xl font-black">
                      {offices.length - activeOffices}
                    </p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex min-h-[260px] w-full max-w-full items-center justify-center rounded-[2rem] border border-blue-100 bg-white">
                  <div className="text-center">
                    <Loader2 className="mx-auto animate-spin text-[#123c8c]" />

                    <p className="mt-3 text-sm font-black text-slate-600">
                      Mengambil data kantor...
                    </p>
                  </div>
                </div>
              ) : offices.length === 0 ? (
                <AppEmptyState
                  icon={<Building2 size={30} strokeWidth={2.6} />}
                  title="Belum ada data kantor"
                  description="Tambahkan kantor pertama agar validasi GPS absensi bisa berjalan."
                />
              ) : (
                <div className="w-full max-w-full space-y-4 overflow-hidden md:overflow-visible">
                  {offices.map((office) => (
                    <OfficeCard
                      key={office.id}
                      office={office}
                      onEdit={startEdit}
                      onDelete={deleteOffice}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </MobileShell>
  );
}