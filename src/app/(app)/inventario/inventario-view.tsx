"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertTriangle, Package, Download, X, Loader2, ChevronRight } from "lucide-react";
import { formatRD, formatNumber, cn } from "@/lib/utils";
import type { InventoryItem } from "@/lib/types";
import { createMaterialAction, CATEGORIES, UNITS, type MaterialInput } from "@/app/actions/inventory";

export function InventarioView({ inventory }: { inventory: InventoryItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(
    () =>
      inventory.filter(
        (i) =>
          i.name.toLowerCase().includes(q.toLowerCase()) ||
          i.sku.toLowerCase().includes(q.toLowerCase()) ||
          i.category.toLowerCase().includes(q.toLowerCase())
      ),
    [q, inventory]
  );

  const totalValue = inventory.reduce((s, i) => s + i.costPrice * i.stock, 0);
  const lowStock = inventory.filter((i) => i.stock <= i.minStock).length;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {inventory.length} materiales · Valor {formatRD(totalValue, { decimals: false })} ·{" "}
              <span className="text-amber-600 dark:text-amber-400">{lowStock} en stock bajo</span>
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Inventario de materiales</h2>
          </div>
          <div className="flex gap-2">
            <a href="/reporte-inventario" target="_blank" rel="noopener noreferrer" className="btn-ghost"><Download className="h-4 w-4" />Reporte</a>
            <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="h-4 w-4" />Nuevo material</button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, SKU o categoría…"
            className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]"
          />
        </div>
      </Reveal>

      {inventory.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay materiales. Crea el primero o aplica la migración con el seed.
        </div>
      ) : (
        <Reveal delay={0.06}>
          <div className="glass-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/[0.06]">
                    <th className="px-4 py-3 font-semibold">Material</th>
                    <th className="px-4 py-3 font-semibold">Costo</th>
                    <th className="px-4 py-3 font-semibold">Venta</th>
                    <th className="px-4 py-3 font-semibold">Margen</th>
                    <th className="px-4 py-3 text-right font-semibold">Stock</th>
                    <th className="px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => {
                    const margin = Math.round(((i.salePrice - i.costPrice) / i.salePrice) * 100);
                    const low = i.stock <= i.minStock;
                    return (
                      <tr
                        key={i.id}
                        onClick={() => router.push(`/inventario/${i.id}`)}
                        className="cursor-pointer border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 dark:border-white/[0.03] dark:hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-volt-500/10 text-volt-500"><Package className="h-4 w-4" /></div>
                            <div className="min-w-0">
                              <p className="font-medium leading-tight">{i.name}</p>
                              <p className="text-xs text-slate-400">{i.sku} · {i.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-500 dark:text-slate-400">{formatRD(i.costPrice, { decimals: false })}</td>
                        <td className="px-4 py-3 font-medium tabular-nums">{formatRD(i.salePrice, { decimals: false })}</td>
                        <td className="px-4 py-3"><span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{margin}%</span></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {low && (<Badge className="bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300"><AlertTriangle className="h-3 w-3" />Bajo</Badge>)}
                            <span className={cn("font-semibold tabular-nums", low ? "text-amber-600 dark:text-amber-400" : "")}>{formatNumber(i.stock)}</span>
                            <span className="text-xs text-slate-400">/ {i.minStock}</span>
                          </div>
                        </td>
                        <td className="px-2 py-3"><ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}

      <AnimatePresence>
        {modalOpen && <NewMaterialModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function NewMaterialModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<MaterialInput>({
    name: "", category: CATEGORIES[0], sku: "", costPrice: 0, salePrice: 0, stock: 0, minStock: 0, unit: "unidad",
  });
  const margin = form.salePrice > 0 ? Math.round(((form.salePrice - form.costPrice) / form.salePrice) * 100) : 0;
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createMaterialAction(form);
      if (!res.ok) { setError(res.error ?? "No se pudo guardar."); return; }
      router.refresh();
      onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-[92vw] max-w-lg overflow-y-auto">
        <form onSubmit={submit} className="glass-card max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nuevo material</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <input required placeholder="Nombre del material *" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
              <input required placeholder="SKU *" className={field} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Precio de costo</label>
                <input type="number" min={0} step="0.01" className={field} value={form.costPrice || ""} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Precio de venta · margen {margin}%</label>
                <input type="number" min={0} step="0.01" className={field} value={form.salePrice || ""} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Stock inicial</label>
                <input type="number" min={0} className={field} value={form.stock || ""} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Stock mínimo</label>
                <input type="number" min={0} className={field} value={form.minStock || ""} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Unidad</label>
                <select className={field} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                  {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
                </select>
              </div>
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Guardando…" : "Guardar material"}</button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
