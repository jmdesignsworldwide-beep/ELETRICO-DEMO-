"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Save, Trash2, Loader2, Plus, Tag, ShoppingCart, DollarSign } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { formatRD, formatDate, cn } from "@/lib/utils";
import type { SupplierDetail, InventoryItem } from "@/lib/types";
import { updateSupplierAction, deleteSupplierAction, setSupplierPriceAction, type SupplierInput } from "@/app/actions/suppliers";

const poStatusStyle: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300",
  enviada: "bg-blue-50 text-blue-700 ring-blue-500/25 dark:bg-blue-500/15 dark:text-blue-300",
  recibida_parcial: "bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300",
  recibida: "bg-emerald-50 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300",
  cancelada: "bg-red-50 text-red-700 ring-red-500/25 dark:bg-red-500/15 dark:text-red-300",
};
const poStatusLabel: Record<string, string> = {
  borrador: "Borrador", enviada: "Enviada", recibida_parcial: "Recibida parcial", recibida: "Recibida", cancelada: "Cancelada",
};

export function SupplierDetalleView({ supplier, inventory }: { supplier: SupplierDetail; inventory: InventoryItem[] }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Reveal>
        <Link href="/suplidores" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Volver a suplidores
        </Link>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Reveal delay={0.03}><EditForm supplier={supplier} onDone={() => router.refresh()} /></Reveal>
          <Reveal delay={0.05}><PriceCatalog supplier={supplier} inventory={inventory} onDone={() => router.refresh()} /></Reveal>
        </div>

        <div className="space-y-6">
          <Reveal delay={0.04}>
            <div className="glass-card p-5">
              <div className="mb-1 flex items-center gap-2 text-slate-400"><DollarSign className="h-4 w-4" /><span className="text-xs">Pagos pendientes</span></div>
              <p className={cn("text-2xl font-bold tabular-nums", supplier.pending > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>{formatRD(supplier.pending, { decimals: false })}</p>
              {supplier.paymentTerms && <p className="mt-1 text-xs text-slate-400">{supplier.paymentTerms}</p>}
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="glass-card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold"><ShoppingCart className="h-5 w-5 text-volt-500" />Historial de compras</h3>
              {supplier.purchaseOrders.length === 0 ? (
                <p className="py-2 text-sm text-slate-400">Sin órdenes de compra.</p>
              ) : (
                <div className="space-y-2">
                  {supplier.purchaseOrders.map((po) => (
                    <Link key={po.id} href={`/compras/${po.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <div>
                        <p className="font-mono text-xs font-semibold text-slate-400">{po.number}</p>
                        <Badge className={poStatusStyle[po.status] ?? poStatusStyle.borrador}>{poStatusLabel[po.status] ?? po.status}</Badge>
                      </div>
                      <span className="font-semibold tabular-nums">{formatRD(po.total, { decimals: false })}</span>
                    </Link>
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

function EditForm({ supplier, onDone }: { supplier: SupplierDetail; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [delPending, startDelete] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<SupplierInput>({
    name: supplier.name, rnc: supplier.rnc ?? "", contact: supplier.contact ?? "",
    phone: supplier.phone ?? "", email: supplier.email ?? "", address: supplier.address ?? "",
    paymentTerms: supplier.paymentTerms ?? "",
  });
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSaved(false);
    startTransition(async () => {
      const res = await updateSupplierAction(supplier.id, form);
      if (!res.ok) { setError(res.error ?? "No se pudo guardar."); return; }
      setSaved(true); onDone(); setTimeout(() => setSaved(false), 2000);
    });
  }
  function remove() {
    startDelete(async () => {
      const res = await deleteSupplierAction(supplier.id);
      if (!res.ok) { setError(res.error ?? "No se pudo eliminar."); setConfirmDel(false); return; }
      router.push("/suplidores"); router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="glass-card p-5">
      <h3 className="mb-4 font-semibold">Ficha del suplidor</h3>
      <div className="space-y-3">
        <input required className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="RNC" className={field} value={form.rnc} onChange={(e) => setForm({ ...form, rnc: e.target.value })} />
          <input placeholder="Contacto" className={field} value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Teléfono" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input placeholder="Correo" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <input placeholder="Dirección" className={field} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <input placeholder="Condiciones de pago" className={field} value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} />
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline dark:text-red-400"><Trash2 className="h-4 w-4" /> Eliminar</button>
        <button type="submit" disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saved ? "Guardado ✓" : pending ? "Guardando…" : "Guardar cambios"}</button>
      </div>

      <AnimatePresence>
        {confirmDel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDel(false)} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
              <div className="glass-card p-6 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500"><Trash2 className="h-6 w-6" /></div>
                <h3 className="font-semibold">¿Eliminar “{supplier.name}”?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Esta acción no se puede deshacer.</p>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setConfirmDel(false)} className="btn-ghost flex-1">Cancelar</button>
                  <button type="button" onClick={remove} disabled={delPending} className="btn-primary flex-1" style={{ background: "#ef4444", color: "#fff" }}>{delPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Eliminar</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </form>
  );
}

function PriceCatalog({ supplier, inventory, onDone }: { supplier: SupplierDetail; inventory: InventoryItem[]; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [itemId, setItemId] = useState(inventory[0]?.id ?? "");
  const [price, setPrice] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function save(invId: string, value: number) {
    setError(null);
    if (value <= 0) { setError("Precio inválido."); return; }
    startTransition(async () => {
      const res = await setSupplierPriceAction(supplier.id, invId, value);
      if (!res.ok) { setError(res.error ?? "No se pudo guardar."); return; }
      setPrice(0); onDone();
    });
  }

  const field = "rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Tag className="h-5 w-5 text-volt-500" />Catálogo de precios</h3>

      {supplier.prices.length === 0 ? (
        <p className="mb-3 text-sm text-slate-400">Sin precios registrados. Agrega el primero abajo.</p>
      ) : (
        <div className="mb-4 space-y-1.5">
          {supplier.prices.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
              <div className="min-w-0"><p className="truncate font-medium">{p.materialName}</p><p className="text-xs text-slate-400">{p.sku} · act. {formatDate(p.updatedAt)}</p></div>
              <span className="shrink-0 font-semibold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(p.price, { decimals: false })}</span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-slate-100 pt-3 dark:border-white/[0.06]">
        <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">Agregar / actualizar precio</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className={cn(field, "min-w-0 flex-1")}>
            {inventory.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
          </select>
          <div className="flex gap-2">
            <input type="number" min={0} step="0.01" value={price || ""} placeholder="Precio" onChange={(e) => setPrice(Number(e.target.value))} className={cn(field, "w-28 tabular-nums")} />
            <button onClick={() => save(itemId, price)} disabled={pending || !itemId} className="btn-primary px-4 py-2 text-sm">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Guardar</button>
          </div>
        </div>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
