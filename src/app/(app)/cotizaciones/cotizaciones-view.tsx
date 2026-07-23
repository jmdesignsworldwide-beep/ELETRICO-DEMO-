"use client";

import { useState, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, FileText, Share2, ArrowRightCircle, ChevronRight, X, Loader2, Trash2 } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { quoteStatusLabel, quoteStatusStyle } from "@/lib/labels";
import { formatRD, formatDate, calcITBIS, ITBIS_RATE, cn } from "@/lib/utils";
import type { Quote, Client, InventoryItem } from "@/lib/types";
import { convertQuoteToOrderAction } from "@/app/actions/quotes";
import { createQuoteAction, type QuoteItemInput } from "@/app/actions/quotes";

function waLink(q: Quote): string | null {
  const phone = (q.clientPhone ?? "").replace(/\D/g, "");
  if (!phone) return null;
  const msg = encodeURIComponent(`Hola ${q.clientName}, le compartimos su cotización ${q.number} de JM Electric por ${formatRD(q.total)}. Quedamos atentos.`);
  return `https://wa.me/1${phone}?text=${msg}`;
}

export function CotizacionesView({ quotes, clients, inventory }: { quotes: Quote[]; clients: Client[]; inventory: InventoryItem[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const params = useSearchParams();
  useEffect(() => { if (params.get("new") === "1") setModalOpen(true); }, [params]);

  const approved = quotes.filter((q) => q.status === "aprobada").length;
  const sent = quotes.filter((q) => q.status === "enviada").length;
  const conversion = Math.round((approved / Math.max(quotes.length, 1)) * 100);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{sent} enviadas · {approved} aprobadas · {conversion}% conversión</p>
            <h2 className="text-2xl font-bold tracking-tight">Cotizaciones</h2>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="h-4 w-4" />Nueva cotización</button>
        </div>
      </Reveal>

      {quotes.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">Aún no hay cotizaciones. Crea la primera.</div>
      ) : (
        <Stagger className="space-y-3">
          {quotes.map((q) => <StaggerItem key={q.id}><QuoteRow quote={q} /></StaggerItem>)}
        </Stagger>
      )}

      <AnimatePresence>
        {modalOpen && <NuevaCotizacionModal clients={clients} inventory={inventory} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function QuoteRow({ quote: q }: { quote: Quote }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const wa = waLink(q);

  function toOrder(e: React.MouseEvent) {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const res = await convertQuoteToOrderAction(q.id);
      if (!res.ok) { setError(res.error ?? "No se pudo convertir."); return; }
      if (res.orderId) router.push(`/ordenes/${res.orderId}`); else router.refresh();
    });
  }

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="glass-card p-4 transition-shadow hover:shadow-card-light-hover sm:p-5">
      <div className="flex flex-wrap items-center gap-4">
        <Link href={`/cotizaciones/${q.id}`} className="flex min-w-0 flex-1 items-center gap-4">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-500/10 ring-1 ring-inset ring-volt-500/20"><FileText className="h-5 w-5 text-volt-500" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400">{q.number}</span>
              <Badge className={quoteStatusStyle[q.status]}>{quoteStatusLabel[q.status]}</Badge>
            </div>
            <h3 className="mt-0.5 truncate font-semibold">{q.clientName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Emitida {formatDate(q.createdAt)} · Válida hasta {formatDate(q.validUntil)}</p>
          </div>
        </Link>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(q.total)}</p>
          <p className="text-xs text-slate-400">ITBIS {formatRD(q.itbis, { decimals: false })}</p>
        </div>
        <div className="flex w-full items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06] sm:w-auto sm:border-0 sm:pt-0">
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 px-3 py-2 text-xs sm:flex-none"><Share2 className="h-3.5 w-3.5" />WhatsApp</a>
          ) : (
            <span className="btn-ghost flex-1 cursor-not-allowed px-3 py-2 text-xs opacity-50 sm:flex-none" title="Cliente sin teléfono"><Share2 className="h-3.5 w-3.5" />WhatsApp</span>
          )}
          {q.status === "aprobada" && (
            <button onClick={toOrder} disabled={pending} className="btn-primary flex-1 px-3 py-2 text-xs sm:flex-none">{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightCircle className="h-3.5 w-3.5" />}A orden</button>
          )}
          <Link href={`/cotizaciones/${q.id}`} className="hidden text-slate-300 hover:text-volt-500 dark:text-slate-600 sm:block"><ChevronRight className="h-4 w-4" /></Link>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </motion.div>
  );
}

interface Line extends QuoteItemInput { key: string }

export function NuevaCotizacionModal({ clients, inventory, onClose }: { clients: Client[]; inventory: InventoryItem[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [discount, setDiscount] = useState(0);
  const [lines, setLines] = useState<Line[]>(
    inventory[0]
      ? [{ key: "l0", kind: "material", description: inventory[0].name, qty: 1, unitPrice: inventory[0].salePrice, inventoryId: inventory[0].id }]
      : [{ key: "l0", kind: "mano_obra", description: "Mano de obra", qty: 1, unitPrice: 0 }]
  );

  const subtotal = useMemo(() => lines.reduce((s, l) => s + Number(l.qty) * Number(l.unitPrice || 0), 0), [lines]);
  const base = Math.max(subtotal - discount, 0);
  const itbis = calcITBIS(base);
  const total = base + itbis;

  const field = "rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";
  const update = (key: string, patch: Partial<Line>) => setLines((l) => l.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const addMaterial = () => inventory[0] && setLines((l) => [...l, { key: `m${l.length}-${Date.now() % 1e6}`, kind: "material", description: inventory[0].name, qty: 1, unitPrice: inventory[0].salePrice, inventoryId: inventory[0].id }]);
  const addLabor = () => setLines((l) => [...l, { key: `w${l.length}-${Date.now() % 1e6}`, kind: "mano_obra", description: "Mano de obra", qty: 1, unitPrice: 0 }]);
  const remove = (key: string) => setLines((l) => (l.length > 1 ? l.filter((x) => x.key !== key) : l));

  function pickInventory(key: string, invId: string) {
    const it = inventory.find((i) => i.id === invId);
    if (it) update(key, { inventoryId: it.id, description: it.name, unitPrice: it.salePrice });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const payload: QuoteItemInput[] = lines.map(({ kind, description, qty, unitPrice, inventoryId }) => ({ kind, description, qty, unitPrice, inventoryId }));
      const res = await createQuoteAction(clientId, payload, discount);
      if (!res.ok) { setError(res.error ?? "No se pudo crear."); return; }
      if (res.orderId) router.push(`/cotizaciones/${res.orderId}`);
      else { router.refresh(); onClose(); }
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-[94vw] max-w-2xl overflow-y-auto">
        <form onSubmit={submit} className="glass-card max-h-[90vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nueva cotización</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>

          {clients.length === 0 ? (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">Primero crea un cliente.</p>
          ) : (
            <>
              <label className="mb-1 block text-xs text-slate-400">Cliente *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={cn(field, "mb-4 w-full")}>
                {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>

              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Líneas</span>
                <div className="flex gap-2">
                  <button type="button" onClick={addMaterial} disabled={!inventory[0]} className="btn-ghost px-2.5 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Material</button>
                  <button type="button" onClick={addLabor} className="btn-ghost px-2.5 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Mano de obra</button>
                </div>
              </div>

              <div className="space-y-2">
                {lines.map((l) => (
                  <div key={l.key} className="rounded-xl border border-slate-100 p-2.5 dark:border-white/[0.06]">
                    <div className="flex items-center gap-2">
                      {l.kind === "material" ? (
                        <select value={l.inventoryId} onChange={(e) => pickInventory(l.key, e.target.value)} className={cn(field, "min-w-0 flex-1")}>
                          {inventory.map((i) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                        </select>
                      ) : (
                        <input value={l.description} onChange={(e) => update(l.key, { description: e.target.value })} placeholder="Descripción" className={cn(field, "min-w-0 flex-1")} />
                      )}
                      <button type="button" onClick={() => remove(l.key)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <span className="w-14 shrink-0">{l.kind === "mano_obra" ? "Horas" : "Cant."}</span>
                      <input type="number" min={0} step="0.5" value={l.qty} onChange={(e) => update(l.key, { qty: Math.max(0, Number(e.target.value)) })} className={cn(field, "w-20 tabular-nums")} />
                      <span className="w-20 shrink-0 text-right">{l.kind === "mano_obra" ? "Tarifa/h" : "Precio"}</span>
                      <input type="number" min={0} step="0.01" value={l.unitPrice || ""} onChange={(e) => update(l.key, { unitPrice: Math.max(0, Number(e.target.value)) })} className={cn(field, "w-28 tabular-nums")} />
                      <span className="ml-auto font-semibold tabular-nums text-slate-600 dark:text-slate-300">{formatRD(Number(l.qty) * Number(l.unitPrice || 0), { decimals: false })}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex items-center justify-between"><span className="text-slate-500">Subtotal</span><span className="tabular-nums">{formatRD(subtotal)}</span></div>
                <div className="flex items-center justify-between gap-2"><span className="text-slate-500">Descuento</span><input type="number" min={0} step="0.01" value={discount || ""} onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))} className={cn(field, "w-28 text-right tabular-nums")} /></div>
                <div className="flex justify-between"><span className="text-slate-500">ITBIS {Math.round(ITBIS_RATE * 100)}%</span><span className="tabular-nums">{formatRD(itbis)}</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-bold dark:border-white/10"><span>Total</span><span className="tabular-nums text-volt-600 dark:text-volt-400">{formatRD(total)}</span></div>
              </div>
            </>
          )}

          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending || clients.length === 0} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Creando…" : "Crear cotización"}</button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
