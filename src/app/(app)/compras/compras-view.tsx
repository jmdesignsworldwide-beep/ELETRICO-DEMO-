"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, ShoppingCart, ChevronRight, X, Loader2, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { formatRD, formatDate } from "@/lib/utils";
import type { PurchaseOrder, Supplier, InventoryItem } from "@/lib/types";
import { createPurchaseOrderAction, type POItemInput } from "@/app/actions/purchase-orders";

const statusMap: Record<string, { label: string; style: string; icon: typeof Clock }> = {
  borrador: { label: "Borrador", style: "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-300", icon: Clock },
  enviada: { label: "Enviada", style: "bg-blue-50 text-blue-700 ring-blue-500/25 dark:bg-blue-500/15 dark:text-blue-300", icon: ShoppingCart },
  recibida_parcial: { label: "Recibida parcial", style: "bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300", icon: Clock },
  recibida: { label: "Recibida", style: "bg-emerald-50 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", style: "bg-red-50 text-red-700 ring-red-500/25 dark:bg-red-500/15 dark:text-red-300", icon: X },
};

export function ComprasView({ orders, suppliers, inventory }: { orders: PurchaseOrder[]; suppliers: Supplier[]; inventory: InventoryItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Al marcar recibida, el inventario se actualiza automáticamente</p>
            <h2 className="text-2xl font-bold tracking-tight">Órdenes de compra</h2>
          </div>
          <button onClick={() => setModalOpen(true)} disabled={suppliers.length === 0} className="btn-primary"><Plus className="h-4 w-4" />Nueva orden de compra</button>
        </div>
      </Reveal>

      {orders.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay órdenes de compra. Crea la primera o aplica la migración con el seed.
        </div>
      ) : (
        <Stagger className="space-y-3">
          {orders.map((po) => {
            const st = statusMap[po.status] ?? statusMap.borrador;
            const Icon = st.icon;
            return (
              <StaggerItem key={po.id}>
                <Link href={`/compras/${po.id}`}>
                  <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="glass-card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-card-light-hover sm:p-5">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-500/10 ring-1 ring-inset ring-volt-500/20"><ShoppingCart className="h-5 w-5 text-volt-500" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-slate-400">{po.number}</span>
                        <Badge className={st.style}><Icon className="h-3 w-3" />{st.label}</Badge>
                      </div>
                      <h3 className="mt-0.5 truncate font-semibold">{po.supplierName}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{po.itemCount} materiales · {formatDate(po.createdAt)}</p>
                    </div>
                    <div className="text-right"><p className="text-lg font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(po.total, { decimals: false })}</p></div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  </motion.div>
                </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <AnimatePresence>{modalOpen && <NewPOModal suppliers={suppliers} inventory={inventory} onClose={() => setModalOpen(false)} />}</AnimatePresence>
    </div>
  );
}

interface Line extends POItemInput { key: string }

function NewPOModal({ suppliers, inventory, onClose }: { suppliers: Supplier[]; inventory: InventoryItem[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [lines, setLines] = useState<Line[]>([{ key: "l0", inventoryId: inventory[0]?.id ?? "", qty: 1, unitPrice: 0 }]);

  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const addLine = () => setLines((l) => [...l, { key: `l${l.length}-${l.reduce((s, x) => s + x.qty, 0)}`, inventoryId: inventory[0]?.id ?? "", qty: 1, unitPrice: 0 }]);
  const removeLine = (key: string) => setLines((l) => (l.length > 1 ? l.filter((x) => x.key !== key) : l));
  const update = (key: string, patch: Partial<Line>) => setLines((l) => l.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const field = "rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const res = await createPurchaseOrderAction(supplierId, lines.map(({ inventoryId, qty, unitPrice }) => ({ inventoryId, qty, unitPrice })));
      if (!res.ok) { setError(res.error ?? "No se pudo crear."); return; }
      if (res.poId) router.push(`/compras/${res.poId}`);
      else { router.refresh(); onClose(); }
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-xl -translate-x-1/2 -translate-y-1/2">
        <form onSubmit={submit} className="glass-card max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nueva orden de compra</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Suplidor</label>
          <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className={`${field} mb-4 w-full`}>
            {suppliers.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Materiales</span>
            <button type="button" onClick={addLine} className="btn-ghost px-2.5 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Agregar</button>
          </div>
          <div className="space-y-2">
            {lines.map((l) => (
              <div key={l.key} className="flex items-center gap-2">
                <select value={l.inventoryId} onChange={(e) => update(l.key, { inventoryId: e.target.value })} className={`${field} min-w-0 flex-1`}>
                  {inventory.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                </select>
                <input type="number" min={1} value={l.qty} onChange={(e) => update(l.key, { qty: Math.max(1, Number(e.target.value)) })} className={`${field} w-16 text-center tabular-nums`} placeholder="Cant." />
                <input type="number" min={0} step="0.01" value={l.unitPrice || ""} onChange={(e) => update(l.key, { unitPrice: Math.max(0, Number(e.target.value)) })} className={`${field} w-24 tabular-nums`} placeholder="Precio" />
                <button type="button" onClick={() => removeLine(l.key)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-volt-500/10 px-4 py-2.5 ring-1 ring-inset ring-volt-500/20">
            <span className="text-sm font-medium">Total estimado</span>
            <span className="text-lg font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(total)}</span>
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending || !supplierId} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Creando…" : "Crear orden"}</button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
