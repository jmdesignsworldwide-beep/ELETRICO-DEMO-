"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Calculator, ArrowRightCircle, X, Loader2 } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { serviceTypeLabel } from "@/lib/labels";
import { formatRD, calcITBIS, ITBIS_RATE, cn } from "@/lib/utils";
import type { ServiceType, InventoryItem, Client } from "@/lib/types";
import { createQuoteAction, type QuoteItemInput } from "@/app/actions/quotes";

interface LineItem {
  key: string;
  itemId: string;
  qty: number;
}

const zonas = [
  { name: "Santo Domingo (DN)", cost: 500 },
  { name: "Santo Domingo Este", cost: 800 },
  { name: "Santiago", cost: 2_500 },
  { name: "Punta Cana", cost: 4_500 },
];

export function CotizadorView({ inventory, clients }: { inventory: InventoryItem[]; clients: Client[] }) {
  const [service, setService] = useState<ServiceType>("instalacion_nueva");
  const [lines, setLines] = useState<LineItem[]>(
    inventory.slice(0, 2).map((it, i) => ({ key: `l${i}`, itemId: it.id, qty: i === 0 ? 2 : 4 }))
  );
  const [hours, setHours] = useState(6);
  const [rate, setRate] = useState(750);
  const [zone, setZone] = useState(0);
  const [convertOpen, setConvertOpen] = useState(false);

  const addLine = () =>
    setLines((l) => [...l, { key: `l${l.length}-${Math.round(hours + rate + l.length)}`, itemId: inventory[0].id, qty: 1 }]);
  const removeLine = (key: string) => setLines((l) => l.filter((x) => x.key !== key));
  const updateLine = (key: string, patch: Partial<LineItem>) =>
    setLines((l) => l.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const calc = useMemo(() => {
    const materials = lines.reduce((s, l) => {
      const item = inventory.find((i) => i.id === l.itemId);
      return s + (item ? item.salePrice * l.qty : 0);
    }, 0);
    const labor = hours * rate;
    const transport = zonas[zone].cost;
    const subtotal = materials + labor + transport;
    const itbis = calcITBIS(subtotal);
    return { materials, labor, transport, subtotal, itbis, total: subtotal + itbis };
  }, [lines, hours, rate, zone, inventory]);

  // Traduce el estado del cotizador a líneas de cotización formal.
  const buildItems = (): QuoteItemInput[] => {
    const items: QuoteItemInput[] = [];
    for (const l of lines) {
      const item = inventory.find((i) => i.id === l.itemId);
      if (item && l.qty > 0) {
        items.push({ kind: "material", description: item.name, qty: l.qty, unitPrice: item.salePrice, inventoryId: item.id });
      }
    }
    if (hours > 0 && rate > 0) {
      items.push({ kind: "mano_obra", description: `Mano de obra · ${serviceTypeLabel[service]}`, qty: hours, unitPrice: rate });
    }
    if (zonas[zone].cost > 0) {
      items.push({ kind: "transporte", description: `Transporte · ${zonas[zone].name}`, qty: 1, unitPrice: zonas[zone].cost });
    }
    return items;
  };

  if (inventory.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
        El cotizador jala precios del inventario en vivo. Conecta Supabase y aplica la migración con el seed para empezar.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Precios en vivo desde el inventario · ITBIS {Math.round(ITBIS_RATE * 100)}% automático
          </p>
          <h2 className="text-2xl font-bold tracking-tight">Cotizador rápido</h2>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Reveal delay={0.04}>
            <div className="glass-card p-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Tipo de servicio</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value as ServiceType)}
                className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]"
              >
                {(Object.keys(serviceTypeLabel) as ServiceType[]).map((s) => (
                  <option key={s} value={s}>{serviceTypeLabel[s]}</option>
                ))}
              </select>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="glass-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">Materiales</h3>
                <button onClick={addLine} className="btn-ghost px-3 py-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Agregar</button>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {lines.map((l) => {
                    const item = inventory.find((i) => i.id === l.itemId) ?? inventory[0];
                    return (
                      <motion.div key={l.key} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2">
                        <select value={l.itemId} onChange={(e) => updateLine(l.key, { itemId: e.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]">
                          {inventory.map((i) => (
                            <option key={i.id} value={i.id}>{i.name} — {formatRD(i.salePrice, { decimals: false })}</option>
                          ))}
                        </select>
                        <input type="number" min={1} value={l.qty} onChange={(e) => updateLine(l.key, { qty: Math.max(1, Number(e.target.value)) })} className="w-16 rounded-lg border border-slate-200 bg-white/70 px-2 py-2 text-center text-sm tabular-nums outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]" />
                        <span className="w-24 shrink-0 text-right text-sm font-medium tabular-nums">{formatRD(item.salePrice * l.qty, { decimals: false })}</span>
                        <button onClick={() => removeLine(l.key)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500" aria-label="Eliminar"><Trash2 className="h-4 w-4" /></button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="glass-card grid gap-4 p-5 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Horas de mano de obra</label>
                <input type="number" min={0} value={hours} onChange={(e) => setHours(Math.max(0, Number(e.target.value)))} className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm tabular-nums outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Tarifa por hora</label>
                <input type="number" min={0} value={rate} onChange={(e) => setRate(Math.max(0, Number(e.target.value)))} className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm tabular-nums outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">Zona (transporte)</label>
                <select value={zone} onChange={(e) => setZone(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]">
                  {zonas.map((z, i) => (<option key={z.name} value={i}>{z.name} — {formatRD(z.cost, { decimals: false })}</option>))}
                </select>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="glass-card sticky top-24 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><Calculator className="h-5 w-5 text-volt-500" />Total en tiempo real</h3>
            <div className="space-y-2.5 text-sm">
              <Row label="Materiales" value={calc.materials} />
              <Row label="Mano de obra" value={calc.labor} />
              <Row label="Transporte" value={calc.transport} />
              <div className="my-2 border-t border-slate-100 dark:border-white/[0.06]" />
              <Row label="Subtotal" value={calc.subtotal} />
              <Row label={`ITBIS ${Math.round(ITBIS_RATE * 100)}%`} value={calc.itbis} />
            </div>
            <div className="mt-4 rounded-xl bg-volt-500/10 p-4 ring-1 ring-inset ring-volt-500/20">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
              <p className="text-3xl font-bold tabular-nums text-volt-600 dark:text-volt-400">
                <CountUp value={calc.total} format={(n) => formatRD(n)} duration={0.5} />
              </p>
            </div>
            <button onClick={() => setConvertOpen(true)} className="btn-primary mt-4 w-full py-3"><ArrowRightCircle className="h-4 w-4" />Convertir a cotización formal</button>
          </div>
        </Reveal>
      </div>

      <AnimatePresence>
        {convertOpen && (
          <ConvertModal clients={clients} buildItems={buildItems} total={calc.total} onClose={() => setConvertOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ConvertModal({ clients, buildItems, total, onClose }: { clients: Client[]; buildItems: () => QuoteItemInput[]; total: number; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const items = buildItems();
      if (items.length === 0) { setError("Agrega al menos un material o mano de obra."); return; }
      const res = await createQuoteAction(clientId, items, 0);
      if (!res.ok) { setError(res.error ?? "No se pudo crear la cotización."); return; }
      if (res.orderId) router.push(`/cotizaciones/${res.orderId}`);
      else { router.refresh(); onClose(); }
    });
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <form onSubmit={submit} className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Convertir a cotización formal</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>

          {clients.length === 0 ? (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">Primero crea un cliente para poder emitir la cotización.</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">Se guardará una cotización real por <span className="font-semibold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(total)}</span> con todas las líneas del cotizador.</p>
              <label className="mb-1 block text-xs text-slate-400">Cliente *</label>
              <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={cn(field, "mb-2")}>
                {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
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

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-medium tabular-nums">{formatRD(value)}</span>
    </div>
  );
}
