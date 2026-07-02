"use client";

import { useMemo, useState } from "react";
import { Boxes, Plus, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type InventoryItem = {
  id: string;
  name: string;
  category: string;
  stock: number;
  condition: "baik" | "servis" | "rusak";
};

const initialItems: InventoryItem[] = [
  {
    id: "inv-1",
    name: "Laptop Lenovo T14",
    category: "Elektronik",
    stock: 7,
    condition: "baik",
  },
  {
    id: "inv-2",
    name: "Kamera Canon M50",
    category: "Produksi",
    stock: 2,
    condition: "servis",
  },
  {
    id: "inv-3",
    name: "Router TP-Link",
    category: "Jaringan",
    stock: 5,
    condition: "baik",
  },
];

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("1");
  const [condition, setCondition] =
    useState<InventoryItem["condition"]>("baik");

  const lowStock = useMemo(
    () => items.filter((item) => item.stock <= 2).length,
    [items],
  );

  function handleAdd() {
    const safeName = name.trim();
    const safeCategory = category.trim();
    const safeStock = Number(stock);

    if (!safeName || !safeCategory || Number.isNaN(safeStock)) {
      alert("Nama, kategori, dan stok wajib valid.");
      return;
    }

    setItems((prev) => [
      {
        id: `inv-${Date.now()}`,
        name: safeName,
        category: safeCategory,
        stock: safeStock,
        condition,
      },
      ...prev,
    ]);

    setName("");
    setCategory("");
    setStock("1");
    setCondition("baik");
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Inventaris"
        subtitle="Pencatatan aset kantor dan operasional"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                Total Item
              </p>
              <Boxes size={18} className="text-[#123c8c]" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {items.length}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
              Stok Rendah
            </p>
            <p className="mt-2 text-3xl font-black text-amber-700">
              {lowStock}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-300/30">
          <div className="grid gap-3 md:grid-cols-[1fr_0.8fr_0.4fr_0.6fr_auto]">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nama item"
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
            />
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Kategori"
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
            />
            <input
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              placeholder="Stok"
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
            />
            <select
              value={condition}
              onChange={(event) =>
                setCondition(event.target.value as InventoryItem["condition"])
              }
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="baik">Baik</option>
              <option value="servis">Servis</option>
              <option value="rusak">Rusak</option>
            </select>
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-xl bg-[#123c8c] px-4 py-2 text-sm font-black text-white"
            >
              <Plus size={14} />
              Tambah
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-blue-100">
          <div className="grid grid-cols-[1.1fr_0.8fr_0.5fr_0.7fr_0.6fr] bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c]">
            <p>Item</p>
            <p>Kategori</p>
            <p>Stok</p>
            <p>Kondisi</p>
            <p>Aksi</p>
          </div>
          <div className="divide-y divide-blue-100 bg-white">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1.1fr_0.8fr_0.5fr_0.7fr_0.6fr] items-center px-4 py-3 text-sm"
              >
                <p className="font-black text-slate-900">{item.name}</p>
                <p className="font-semibold text-slate-600">{item.category}</p>
                <p className="font-semibold text-slate-600">{item.stock}</p>
                <p className="font-semibold text-slate-600">{item.condition}</p>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="inline-flex w-fit items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs font-black text-rose-700"
                >
                  <Trash2 size={12} />
                  Hapus
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
