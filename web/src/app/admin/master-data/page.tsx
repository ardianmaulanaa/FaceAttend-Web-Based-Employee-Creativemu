"use client";

import { useMemo, useState } from "react";
import { Pencil, Save, Trash2, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type MasterTab = "shift" | "divisi" | "jabatan";
type CategoryType = "magang" | "karyawan";
type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type DaySchedule = {
  isWorkDay: boolean;
  checkIn: string;
  checkOut: string;
};

type WeeklySchedule = Record<DayKey, DaySchedule>;

type ShiftItem = {
  id: string;
  name: string;
  tolerance: number;
  active: boolean;
  schedules: {
    magang: WeeklySchedule;
    karyawan: WeeklySchedule;
  };
};

type DivisionItem = {
  id: string;
  name: string;
  shiftId: string;
  active: boolean;
};

type PositionItem = {
  id: string;
  name: string;
  active: boolean;
};

const dayOptions: Array<{ key: DayKey; label: string }> = [
  { key: "monday", label: "Senin" },
  { key: "tuesday", label: "Selasa" },
  { key: "wednesday", label: "Rabu" },
  { key: "thursday", label: "Kamis" },
  { key: "friday", label: "Jumat" },
  { key: "saturday", label: "Sabtu" },
  { key: "sunday", label: "Minggu" },
];

function createDefaultWeeklySchedule(
  checkInWeekday: string,
  checkOutWeekday: string,
): WeeklySchedule {
  return {
    monday: {
      isWorkDay: true,
      checkIn: checkInWeekday,
      checkOut: checkOutWeekday,
    },
    tuesday: {
      isWorkDay: true,
      checkIn: checkInWeekday,
      checkOut: checkOutWeekday,
    },
    wednesday: {
      isWorkDay: true,
      checkIn: checkInWeekday,
      checkOut: checkOutWeekday,
    },
    thursday: {
      isWorkDay: true,
      checkIn: checkInWeekday,
      checkOut: checkOutWeekday,
    },
    friday: {
      isWorkDay: true,
      checkIn: checkInWeekday,
      checkOut: checkOutWeekday,
    },
    saturday: { isWorkDay: false, checkIn: "", checkOut: "" },
    sunday: { isWorkDay: false, checkIn: "", checkOut: "" },
  };
}

const initialShifts: ShiftItem[] = [
  {
    id: "shift-utama",
    name: "Utama",
    tolerance: 10,
    active: true,
    schedules: {
      magang: createDefaultWeeklySchedule("08:30", "16:30"),
      karyawan: createDefaultWeeklySchedule("08:00", "17:00"),
    },
  },
  {
    id: "shift-magang",
    name: "Magang",
    tolerance: 15,
    active: true,
    schedules: {
      magang: createDefaultWeeklySchedule("09:00", "16:00"),
      karyawan: createDefaultWeeklySchedule("08:00", "17:00"),
    },
  },
];

const initialDivisions: DivisionItem[] = [
  {
    id: "divisi-1",
    name: "Creativemu Academy",
    shiftId: "shift-utama",
    active: true,
  },
  {
    id: "divisi-2",
    name: "Digital Marketing Agency",
    shiftId: "shift-utama",
    active: true,
  },
  {
    id: "divisi-3",
    name: "Magang - Digital Marketing Agency",
    shiftId: "shift-magang",
    active: true,
  },
];

const initialPositions: PositionItem[] = [
  { id: "pos-1", name: "Admin Sosmed", active: true },
  { id: "pos-2", name: "Customer Service", active: true },
  { id: "pos-3", name: "Marketplace", active: true },
  { id: "pos-4", name: "Web Developer", active: true },
];

export default function AdminMasterDataPage() {
  const [tab, setTab] = useState<MasterTab>("shift");

  const [shiftList, setShiftList] = useState<ShiftItem[]>(initialShifts);
  const [divisionList, setDivisionList] =
    useState<DivisionItem[]>(initialDivisions);
  const [positionList, setPositionList] =
    useState<PositionItem[]>(initialPositions);

  const [newShiftName, setNewShiftName] = useState("");
  const [newShiftTolerance, setNewShiftTolerance] = useState("10");

  const [newDivisionName, setNewDivisionName] = useState("");
  const [newDivisionShiftId, setNewDivisionShiftId] = useState(
    initialShifts[0].id,
  );

  const [newPositionName, setNewPositionName] = useState("");

  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [editingShiftName, setEditingShiftName] = useState("");
  const [editingShiftTolerance, setEditingShiftTolerance] = useState("0");

  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(
    null,
  );
  const [editingDivisionName, setEditingDivisionName] = useState("");
  const [editingDivisionShiftId, setEditingDivisionShiftId] = useState("");

  const [editingPositionId, setEditingPositionId] = useState<string | null>(
    null,
  );
  const [editingPositionName, setEditingPositionName] = useState("");

  const [selectedShiftId, setSelectedShiftId] = useState(initialShifts[0].id);

  const selectedShift = useMemo(
    () => shiftList.find((item) => item.id === selectedShiftId) || null,
    [selectedShiftId, shiftList],
  );

  const tabTitle = useMemo(() => {
    if (tab === "shift") return "Master Shift";
    if (tab === "divisi") return "Master Divisi";
    return "Master Jabatan";
  }, [tab]);

  function handleAddShift() {
    const name = newShiftName.trim();
    const tolerance = Number(newShiftTolerance || 0);

    if (!name) {
      alert("Nama shift wajib diisi.");
      return;
    }

    if (
      shiftList.some((item) => item.name.toLowerCase() === name.toLowerCase())
    ) {
      alert("Nama shift sudah ada.");
      return;
    }

    const id = `shift-${Date.now()}`;

    setShiftList((prev) => [
      ...prev,
      {
        id,
        name,
        tolerance,
        active: true,
        schedules: {
          magang: createDefaultWeeklySchedule("09:00", "16:00"),
          karyawan: createDefaultWeeklySchedule("08:00", "17:00"),
        },
      },
    ]);

    setSelectedShiftId(id);
    setNewShiftName("");
    setNewShiftTolerance("10");
  }

  function startEditShift(item: ShiftItem) {
    setEditingShiftId(item.id);
    setEditingShiftName(item.name);
    setEditingShiftTolerance(String(item.tolerance));
  }

  function saveEditShift() {
    if (!editingShiftId) return;

    const name = editingShiftName.trim();
    const tolerance = Number(editingShiftTolerance || 0);

    if (!name) {
      alert("Nama shift wajib diisi.");
      return;
    }

    const duplicate = shiftList.some(
      (item) =>
        item.id !== editingShiftId &&
        item.name.toLowerCase() === name.toLowerCase(),
    );

    if (duplicate) {
      alert("Nama shift sudah ada.");
      return;
    }

    setShiftList((prev) =>
      prev.map((item) =>
        item.id === editingShiftId
          ? {
              ...item,
              name,
              tolerance,
            }
          : item,
      ),
    );

    setEditingShiftId(null);
    setEditingShiftName("");
    setEditingShiftTolerance("0");
  }

  function removeShift(id: string) {
    const usedByDivision = divisionList.some((item) => item.shiftId === id);
    if (usedByDivision) {
      alert("Shift dipakai di Divisi. Ganti shift divisi dulu sebelum hapus.");
      return;
    }

    setShiftList((prev) => prev.filter((item) => item.id !== id));

    if (selectedShiftId === id && shiftList.length > 1) {
      const next = shiftList.find((item) => item.id !== id);
      if (next) setSelectedShiftId(next.id);
    }
  }

  function toggleShiftStatus(id: string) {
    setShiftList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              active: !item.active,
            }
          : item,
      ),
    );
  }

  function updateShiftSchedule(
    shiftId: string,
    category: CategoryType,
    day: DayKey,
    key: "isWorkDay" | "checkIn" | "checkOut",
    value: string | boolean,
  ) {
    setShiftList((prev) =>
      prev.map((shift) => {
        if (shift.id !== shiftId) return shift;

        const current = shift.schedules[category][day];

        const updatedDay: DaySchedule =
          key === "isWorkDay"
            ? {
                ...current,
                isWorkDay: Boolean(value),
                checkIn: Boolean(value) ? current.checkIn || "08:00" : "",
                checkOut: Boolean(value) ? current.checkOut || "17:00" : "",
              }
            : {
                ...current,
                [key]: String(value),
              };

        return {
          ...shift,
          schedules: {
            ...shift.schedules,
            [category]: {
              ...shift.schedules[category],
              [day]: updatedDay,
            },
          },
        };
      }),
    );
  }

  function handleAddDivision() {
    const name = newDivisionName.trim();

    if (!name) {
      alert("Nama divisi wajib diisi.");
      return;
    }

    if (
      divisionList.some(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      alert("Nama divisi sudah ada.");
      return;
    }

    setDivisionList((prev) => [
      ...prev,
      {
        id: `divisi-${Date.now()}`,
        name,
        shiftId: newDivisionShiftId,
        active: true,
      },
    ]);

    setNewDivisionName("");
  }

  function startEditDivision(item: DivisionItem) {
    setEditingDivisionId(item.id);
    setEditingDivisionName(item.name);
    setEditingDivisionShiftId(item.shiftId);
  }

  function saveEditDivision() {
    if (!editingDivisionId) return;

    const name = editingDivisionName.trim();
    if (!name) {
      alert("Nama divisi wajib diisi.");
      return;
    }

    const duplicate = divisionList.some(
      (item) =>
        item.id !== editingDivisionId &&
        item.name.toLowerCase() === name.toLowerCase(),
    );

    if (duplicate) {
      alert("Nama divisi sudah ada.");
      return;
    }

    setDivisionList((prev) =>
      prev.map((item) =>
        item.id === editingDivisionId
          ? {
              ...item,
              name,
              shiftId: editingDivisionShiftId,
            }
          : item,
      ),
    );

    setEditingDivisionId(null);
    setEditingDivisionName("");
    setEditingDivisionShiftId("");
  }

  function toggleDivisionStatus(id: string) {
    setDivisionList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              active: !item.active,
            }
          : item,
      ),
    );
  }

  function removeDivision(id: string) {
    setDivisionList((prev) => prev.filter((item) => item.id !== id));
  }

  function handleAddPosition() {
    const name = newPositionName.trim();
    if (!name) {
      alert("Nama jabatan wajib diisi.");
      return;
    }

    if (
      positionList.some(
        (item) => item.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      alert("Nama jabatan sudah ada.");
      return;
    }

    setPositionList((prev) => [
      ...prev,
      { id: `jabatan-${Date.now()}`, name, active: true },
    ]);

    setNewPositionName("");
  }

  function startEditPosition(item: PositionItem) {
    setEditingPositionId(item.id);
    setEditingPositionName(item.name);
  }

  function saveEditPosition() {
    if (!editingPositionId) return;

    const name = editingPositionName.trim();
    if (!name) {
      alert("Nama jabatan wajib diisi.");
      return;
    }

    const duplicate = positionList.some(
      (item) =>
        item.id !== editingPositionId &&
        item.name.toLowerCase() === name.toLowerCase(),
    );

    if (duplicate) {
      alert("Nama jabatan sudah ada.");
      return;
    }

    setPositionList((prev) =>
      prev.map((item) =>
        item.id === editingPositionId
          ? {
              ...item,
              name,
            }
          : item,
      ),
    );

    setEditingPositionId(null);
    setEditingPositionName("");
  }

  function togglePositionStatus(id: string) {
    setPositionList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              active: !item.active,
            }
          : item,
      ),
    );
  }

  function removePosition(id: string) {
    setPositionList((prev) => prev.filter((item) => item.id !== id));
  }

  function getShiftName(shiftId: string) {
    return shiftList.find((item) => item.id === shiftId)?.name || "-";
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Master Data"
        subtitle="Kelola Shift, Divisi, dan Jabatan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            Admin Master
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Kelola Shift, Divisi, dan Jabatan
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Divisi dan jabatan mendukung CRUD penuh. Shift juga mendukung CRUD,
            plus pengaturan jam kerja mingguan untuk Magang dan Karyawan Tetap.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {(
            [
              ["shift", "Shift"],
              ["divisi", "Divisi"],
              ["jabatan", "Jabatan"],
            ] as Array<[MasterTab, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                tab === value
                  ? "bg-[#123c8c] text-white"
                  : "border border-blue-100 bg-white text-slate-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <h3 className="text-xl font-black text-slate-950">{tabTitle}</h3>

          {tab === "shift" && (
            <div className="mt-4 space-y-5">
              <div className="grid gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3 md:grid-cols-[1fr_0.6fr_auto]">
                <input
                  value={newShiftName}
                  onChange={(event) => setNewShiftName(event.target.value)}
                  placeholder="Nama shift"
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
                <input
                  value={newShiftTolerance}
                  onChange={(event) => setNewShiftTolerance(event.target.value)}
                  placeholder="Toleransi telat (menit)"
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddShift}
                  className="rounded-xl bg-[#123c8c] px-4 py-2 text-sm font-black text-white"
                >
                  Tambah Shift
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100">
                <div className="grid grid-cols-[1.1fr_0.7fr_0.7fr_1fr] bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c]">
                  <p>Shift</p>
                  <p>Toleransi</p>
                  <p>Status</p>
                  <p>Aksi</p>
                </div>
                <div className="divide-y divide-blue-100 bg-white">
                  {shiftList.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1.1fr_0.7fr_0.7fr_1fr] items-center px-4 py-3 text-sm"
                    >
                      {editingShiftId === item.id ? (
                        <input
                          value={editingShiftName}
                          onChange={(event) =>
                            setEditingShiftName(event.target.value)
                          }
                          className="rounded-lg border border-blue-100 px-2 py-1.5 font-semibold text-slate-700"
                        />
                      ) : (
                        <p className="font-black text-slate-900">{item.name}</p>
                      )}

                      {editingShiftId === item.id ? (
                        <input
                          value={editingShiftTolerance}
                          onChange={(event) =>
                            setEditingShiftTolerance(event.target.value)
                          }
                          className="w-24 rounded-lg border border-blue-100 px-2 py-1.5 font-semibold text-slate-700"
                        />
                      ) : (
                        <p className="font-semibold text-slate-600">
                          {item.tolerance} menit
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleShiftStatus(item.id)}
                        className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                          item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.active ? "Aktif" : "Nonaktif"}
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {editingShiftId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEditShift}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700"
                            >
                              <Save size={12} />
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingShiftId(null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600"
                            >
                              <X size={12} />
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditShift(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-[#f6f8ff] px-2.5 py-1 text-xs font-black text-[#123c8c]"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeShift(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700"
                            >
                              <Trash2 size={12} />
                              Hapus
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedShiftId(item.id)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-black ${
                                selectedShiftId === item.id
                                  ? "bg-[#123c8c] text-white"
                                  : "border border-blue-100 bg-white text-[#123c8c]"
                              }`}
                            >
                              Jadwal
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedShift && (
                <div className="rounded-2xl border border-blue-100 bg-white p-4">
                  <h4 className="text-base font-black text-slate-900">
                    Pengaturan Jadwal 1 Minggu - Shift {selectedShift.name}
                  </h4>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Atur jam kerja mingguan terpisah untuk Magang dan Karyawan
                    Tetap.
                  </p>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {(["magang", "karyawan"] as CategoryType[]).map(
                      (category) => (
                        <div
                          key={`schedule-${category}`}
                          className="rounded-xl border border-blue-100 bg-[#f8faff] p-3"
                        >
                          <p className="text-sm font-black text-[#123c8c]">
                            {category === "magang"
                              ? "Jadwal Magang"
                              : "Jadwal Karyawan Tetap"}
                          </p>

                          <div className="mt-3 space-y-2">
                            {dayOptions.map((day) => {
                              const row =
                                selectedShift.schedules[category][day.key];

                              return (
                                <div
                                  key={`${category}-${day.key}`}
                                  className="grid grid-cols-[0.8fr_0.55fr_0.8fr_0.8fr] items-center gap-2"
                                >
                                  <p className="text-xs font-black text-slate-700">
                                    {day.label}
                                  </p>
                                  <label className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600">
                                    <input
                                      type="checkbox"
                                      checked={row.isWorkDay}
                                      onChange={(event) =>
                                        updateShiftSchedule(
                                          selectedShift.id,
                                          category,
                                          day.key,
                                          "isWorkDay",
                                          event.target.checked,
                                        )
                                      }
                                    />
                                    Kerja
                                  </label>
                                  <input
                                    type="time"
                                    value={row.checkIn}
                                    disabled={!row.isWorkDay}
                                    onChange={(event) =>
                                      updateShiftSchedule(
                                        selectedShift.id,
                                        category,
                                        day.key,
                                        "checkIn",
                                        event.target.value,
                                      )
                                    }
                                    className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:bg-slate-100"
                                  />
                                  <input
                                    type="time"
                                    value={row.checkOut}
                                    disabled={!row.isWorkDay}
                                    onChange={(event) =>
                                      updateShiftSchedule(
                                        selectedShift.id,
                                        category,
                                        day.key,
                                        "checkOut",
                                        event.target.value,
                                      )
                                    }
                                    className="rounded-lg border border-blue-100 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 disabled:bg-slate-100"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "divisi" && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3 md:grid-cols-[1fr_0.7fr_auto]">
                <input
                  value={newDivisionName}
                  onChange={(event) => setNewDivisionName(event.target.value)}
                  placeholder="Nama divisi"
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
                <select
                  value={newDivisionShiftId}
                  onChange={(event) =>
                    setNewDivisionShiftId(event.target.value)
                  }
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                >
                  {shiftList.map((item) => (
                    <option key={`shift-opt-${item.id}`} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddDivision}
                  className="rounded-xl bg-[#123c8c] px-4 py-2 text-sm font-black text-white"
                >
                  Tambah Divisi
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100">
                <div className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.9fr] bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c]">
                  <p>Nama Divisi</p>
                  <p>Shift</p>
                  <p>Status</p>
                  <p>Aksi</p>
                </div>

                <div className="divide-y divide-blue-100 bg-white">
                  {divisionList.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1.2fr_0.8fr_0.6fr_0.9fr] items-center px-4 py-3 text-sm"
                    >
                      {editingDivisionId === item.id ? (
                        <input
                          value={editingDivisionName}
                          onChange={(event) =>
                            setEditingDivisionName(event.target.value)
                          }
                          className="rounded-lg border border-blue-100 px-2 py-1.5 font-semibold text-slate-700"
                        />
                      ) : (
                        <p className="font-black text-slate-900">{item.name}</p>
                      )}

                      {editingDivisionId === item.id ? (
                        <select
                          value={editingDivisionShiftId}
                          onChange={(event) =>
                            setEditingDivisionShiftId(event.target.value)
                          }
                          className="rounded-lg border border-blue-100 px-2 py-1.5 font-semibold text-slate-700"
                        >
                          {shiftList.map((shift) => (
                            <option
                              key={`div-edit-shift-${shift.id}`}
                              value={shift.id}
                            >
                              {shift.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="font-semibold text-slate-600">
                          {getShiftName(item.shiftId)}
                        </p>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleDivisionStatus(item.id)}
                        className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                          item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.active ? "Aktif" : "Nonaktif"}
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {editingDivisionId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEditDivision}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700"
                            >
                              <Save size={12} />
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingDivisionId(null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600"
                            >
                              <X size={12} />
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditDivision(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-[#f6f8ff] px-2.5 py-1 text-xs font-black text-[#123c8c]"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeDivision(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700"
                            >
                              <Trash2 size={12} />
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "jabatan" && (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3 md:grid-cols-[1fr_auto]">
                <input
                  value={newPositionName}
                  onChange={(event) => setNewPositionName(event.target.value)}
                  placeholder="Nama jabatan"
                  className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="rounded-xl bg-[#123c8c] px-4 py-2 text-sm font-black text-white"
                >
                  Tambah Jabatan
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-blue-100">
                <div className="grid grid-cols-[1.2fr_0.6fr_0.9fr] bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c]">
                  <p>Nama Jabatan</p>
                  <p>Status</p>
                  <p>Aksi</p>
                </div>

                <div className="divide-y divide-blue-100 bg-white">
                  {positionList.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1.2fr_0.6fr_0.9fr] items-center px-4 py-3 text-sm"
                    >
                      {editingPositionId === item.id ? (
                        <input
                          value={editingPositionName}
                          onChange={(event) =>
                            setEditingPositionName(event.target.value)
                          }
                          className="rounded-lg border border-blue-100 px-2 py-1.5 font-semibold text-slate-700"
                        />
                      ) : (
                        <p className="font-black text-slate-900">{item.name}</p>
                      )}

                      <button
                        type="button"
                        onClick={() => togglePositionStatus(item.id)}
                        className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                          item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.active ? "Aktif" : "Nonaktif"}
                      </button>

                      <div className="flex flex-wrap gap-2">
                        {editingPositionId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEditPosition}
                              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700"
                            >
                              <Save size={12} />
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPositionId(null)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-black text-slate-600"
                            >
                              <X size={12} />
                              Batal
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditPosition(item)}
                              className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-[#f6f8ff] px-2.5 py-1 text-xs font-black text-[#123c8c]"
                            >
                              <Pencil size={12} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removePosition(item.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700"
                            >
                              <Trash2 size={12} />
                              Hapus
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
