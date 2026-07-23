"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Package, Save, Trash2, Plus, Minus, Loader2, Upload,
  ArrowDownCircle, ArrowUpCircle, X, AlertTriangle, History,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { formatRD, formatDate, formatNumber, cn } from "@/lib/utils";
import type { MaterialDetail } from "@/lib/types";
import {
  updateMaterialAction, deleteMaterialAction, adjustStockAction,
  uploadMaterialPhotoAction, CATEGORIES, UNITS, type MaterialInput,
} from "@/app/actions/inventory";

export function MaterialDetalleView({ material }: { material: MaterialDetail }) {
  const router = useRouter();
  const low = material.stock <= material.minStock;
  const margin = material.salePrice > 0 ? Math.round(((material.salePrice - material.costPrice) / material.salePrice) * 100) : 0;

  return (
    <div className="space-y-6">
      <Reveal>
        <Link href="/inventario" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Volver al inventario
        </Link>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna izquierda: foto + stock */}
        <div className="space-y-6">
          <Reveal delay={0.03}>
            <PhotoCard material={material} />
          </Reveal>

          <Reveal delay={0.05}>
            <div className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Stock actual</p>
                  <p className={cn("text-3xl font-bold tabular-nums", low ? "text-amber-600 dark:text-amber-400" : "text-volt-600 dark:text-volt-400")}>
                    {formatNumber(material.stock)} <span className="text-base font-normal text-slate-400">{material.unit}</span>
                  </p>
                </div>
                {low && <Badge className="bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300"><AlertTriangle className="h-3 w-3" />Stock bajo</Badge>}
              </div>
              <p className="mt-1 text-xs text-slate-400">Mínimo: {material.minStock} {material.unit}</p>
              <StockAdjust id={material.id} onDone={() => router.refresh()} />
            </div>
          </Reveal>
        </div>

        {/* Columna derecha: edición + movimientos */}
        <div className="space-y-6 lg:col-span-2">
          <Reveal delay={0.04}>
            <EditForm material={material} margin={margin} onDone={() => router.refresh()} />
          </Reveal>

          <Reveal delay={0.06}>
            <div className="glass-card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><History className="h-5 w-5 text-volt-500" />Historial de movimientos</h3>
              {material.movements.length === 0 ? (
                <p className="py-4 text-sm text-slate-400">Sin movimientos registrados.</p>
              ) : (
                <div className="space-y-1.5">
                  {material.movements.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg", m.change >= 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500")}>
                        {m.change >= 0 ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{m.reason}</p>
                        <p className="text-xs text-slate-400">{formatDate(m.createdAt)}{m.orderNumber && ` · ${m.orderNumber}`}</p>
                      </div>
                      <span className={cn("shrink-0 font-semibold tabular-nums", m.change >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
                        {m.change >= 0 ? "+" : ""}{formatNumber(m.change)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ material }: { material: MaterialDetail }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      const res = await uploadMaterialPhotoAction(material.id, fd);
      if (!res.ok) { setError(res.error ?? "No se pudo subir."); return; }
      router.refresh();
    });
  }

  return (
    <div className="glass-card overflow-hidden p-0">
      <div className="relative aspect-square bg-slate-100 dark:bg-white/[0.03]">
        {material.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={material.photoUrl} alt={material.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
            <Package className="h-16 w-16" />
            <span className="text-xs">Sin foto</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
        <button onClick={() => inputRef.current?.click()} disabled={pending} className="btn-ghost w-full py-2 text-xs">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {material.photoUrl ? "Cambiar foto" : "Subir foto"}
        </button>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function StockAdjust({ id, onDone }: { id: string; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const field = "rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  function apply(sign: 1 | -1) {
    setError(null);
    if (!reason.trim()) { setError("Indica el motivo del ajuste."); return; }
    startTransition(async () => {
      const res = await adjustStockAction(id, sign * qty, reason);
      if (!res.ok) { setError(res.error ?? "No se pudo ajustar."); return; }
      setReason(""); setQty(1);
      onDone();
    });
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/[0.06]">
      <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Ajustar stock</p>
      <div className="flex gap-2">
        <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className={cn(field, "w-20 text-center tabular-nums")} />
        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motivo (compra, merma, ajuste…)" className={cn(field, "min-w-0 flex-1")} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button onClick={() => apply(1)} disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-300">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Entrada
        </button>
        <button onClick={() => apply(-1)} disabled={pending} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/20 dark:text-red-400">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}Salida
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function EditForm({ material, margin, onDone }: { material: MaterialDetail; margin: number; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [delPending, startDelete] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<MaterialInput>({
    name: material.name, category: material.category, sku: material.sku,
    costPrice: material.costPrice, salePrice: material.salePrice,
    stock: material.stock, minStock: material.minStock, unit: material.unit,
  });
  const liveMargin = form.salePrice > 0 ? Math.round(((form.salePrice - form.costPrice) / form.salePrice) * 100) : margin;
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaved(false);
    startTransition(async () => {
      const res = await updateMaterialAction(material.id, form);
      if (!res.ok) { setError(res.error ?? "No se pudo guardar."); return; }
      setSaved(true); onDone();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function remove() {
    startDelete(async () => {
      const res = await deleteMaterialAction(material.id);
      if (!res.ok) { setError(res.error ?? "No se pudo eliminar."); setConfirmDel(false); return; }
      router.push("/inventario");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">Ficha del material</h3>
        <span className="text-sm text-slate-400">Margen <span className="font-semibold text-emerald-600 dark:text-emerald-400">{liveMargin}%</span></span>
      </div>
      <div className="space-y-3">
        <input required className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
          <input required className={field} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div><label className="mb-1 block text-xs text-slate-400">Costo</label><input type="number" min={0} step="0.01" className={field} value={form.costPrice || ""} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} /></div>
          <div><label className="mb-1 block text-xs text-slate-400">Venta</label><input type="number" min={0} step="0.01" className={field} value={form.salePrice || ""} onChange={(e) => setForm({ ...form, salePrice: Number(e.target.value) })} /></div>
          <div className="col-span-2 sm:col-span-1"><label className="mb-1 block text-xs text-slate-400">Unidad</label>
            <select className={field} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
          </div>
        </div>
        <div><label className="mb-1 block text-xs text-slate-400">Stock mínimo</label><input type="number" min={0} className={cn(field, "sm:max-w-[160px]")} value={form.minStock || ""} onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline dark:text-red-400">
          <Trash2 className="h-4 w-4" /> Eliminar
        </button>
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saved ? "Guardado ✓" : pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      <AnimatePresence>
        {confirmDel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDel(false)} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
              <div className="glass-card p-6 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500"><Trash2 className="h-6 w-6" /></div>
                <h3 className="font-semibold">¿Eliminar “{material.name}”?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Esta acción no se puede deshacer.</p>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setConfirmDel(false)} className="btn-ghost flex-1">Cancelar</button>
                  <button type="button" onClick={remove} disabled={delPending} className="btn-primary flex-1" style={{ background: "#ef4444", color: "#fff" }}>
                    {delPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </form>
  );
}
