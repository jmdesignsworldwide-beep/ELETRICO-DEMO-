"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, User, Calendar, MapPin, Loader2, ChevronRight, X } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, serviceTypeLabel, priorityLabel, priorityStyle } from "@/lib/labels";
import { formatRD, formatDate, daysUntil, cn } from "@/lib/utils";
import type { OrderStatus, ServiceOrder, ServiceType, Priority, Client, Technician } from "@/lib/types";
import { updateOrderStatusAction, createOrderAction, type OrderInput } from "@/app/actions/orders";

const tabs: { key: OrderStatus | "todas" | "abiertas"; label: string }[] = [
  { key: "abiertas", label: "Abiertas" },
  { key: "todas", label: "Todas" },
  { key: "en_proceso", label: "En proceso" },
  { key: "asignada", label: "Asignadas" },
  { key: "recibida", label: "Recibidas" },
  { key: "completada", label: "Completadas" },
];

const CLOSED = ["completada", "facturada", "pagada", "cancelada"];
const ALL_STATUSES: OrderStatus[] = [
  "recibida", "asignada", "en_proceso", "esperando_materiales",
  "esperando_aprobacion", "completada", "facturada", "pagada", "cancelada",
];

export function OrdenesView({ orders, clients, technicians }: { orders: ServiceOrder[]; clients: Client[]; technicians: Technician[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("abiertas");
  const [modalOpen, setModalOpen] = useState(false);
  const params = useSearchParams();
  useEffect(() => { if (params.get("new") === "1") setModalOpen(true); }, [params]);

  const filtered = orders.filter((o) => {
    if (tab === "todas") return true;
    if (tab === "abiertas") return !CLOSED.includes(o.status);
    return o.status === tab;
  });

  const openCount = orders.filter((o) => !CLOSED.includes(o.status)).length;
  const overdueCount = orders.filter((o) => daysUntil(o.estimatedEndDate) < 0 && !CLOSED.includes(o.status)).length;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {openCount} órdenes abiertas · {overdueCount} vencidas
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Órdenes de servicio</h2>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva orden
          </button>
        </div>
      </Reveal>

      <AnimatePresence>
        {modalOpen && <NuevaOrdenModal clients={clients} technicians={technicians} onClose={() => setModalOpen(false)} />}
      </AnimatePresence>

      <Reveal delay={0.04}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "shrink-0 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                tab === t.key ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      {orders.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay órdenes. Conecta Supabase y aplica la migración con el seed.
        </div>
      ) : (
        <Stagger className="space-y-3">
          {filtered.map((o) => <OrderRow key={o.id} order={o} />)}
        </Stagger>
      )}
    </div>
  );
}

function OrderRow({ order: o }: { order: ServiceOrder }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const days = daysUntil(o.estimatedEndDate);
  const overdue = days < 0 && !CLOSED.includes(o.status);

  function changeStatus(status: string) {
    startTransition(async () => {
      await updateOrderStatusAction(o.id, status);
      router.refresh();
    });
  }

  return (
    <StaggerItem>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="glass-card p-4 transition-shadow hover:shadow-card-light-hover sm:p-5"
      >
        <div className="flex items-start gap-4">
          <Link href={`/ordenes/${o.id}`} className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-semibold text-slate-400">{o.number}</span>
              <Badge className={priorityStyle[o.priority]}>{priorityLabel[o.priority]}</Badge>
              {overdue && (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">Vencida hace {Math.abs(days)}d</span>
              )}
            </div>
            <h3 className="mt-1.5 font-semibold leading-tight">{o.clientName}</h3>
            <p className="text-sm text-volt-600 dark:text-volt-400">{serviceTypeLabel[o.serviceType]}</p>
            <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{o.description}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{o.technicianNames.length ? o.technicianNames.join(", ") : "Sin asignar"}</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{formatDate(o.scheduledDate)}</span>
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /><span className="line-clamp-1 max-w-[180px]">{o.address}</span></span>
            </div>
          </Link>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Link href={`/ordenes/${o.id}`} className="text-slate-300 hover:text-volt-500 dark:text-slate-600"><ChevronRight className="h-4 w-4" /></Link>
            {o.total > 0 && (
              <span className="font-semibold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(o.total, { decimals: false })}</span>
            )}
            <div className="relative flex items-center gap-1.5">
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />}
              <select
                value={o.status}
                onChange={(e) => changeStatus(e.target.value)}
                disabled={pending}
                className="rounded-lg border border-slate-200 bg-white/70 px-2 py-1.5 text-xs font-medium outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]"
                aria-label="Cambiar estado"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{orderStatusLabel[s]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>
    </StaggerItem>
  );
}

function NuevaOrdenModal({ clients, technicians, onClose }: { clients: Client[]; technicians: Technician[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<OrderInput>({
    clientId: clients[0]?.id ?? "", serviceType: "instalacion_nueva", priority: "normal",
    scheduledDate: today, estimatedEndDate: today, description: "", address: "", total: 0, technicianIds: [],
  });
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";
  const toggleTech = (id: string) => setForm((f) => ({ ...f, technicianIds: f.technicianIds?.includes(id) ? f.technicianIds.filter((x) => x !== id) : [...(f.technicianIds ?? []), id] }));

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const res = await createOrderAction({
        ...form,
        scheduledDate: new Date(form.scheduledDate).toISOString(),
        estimatedEndDate: new Date(form.estimatedEndDate).toISOString(),
      });
      if (!res.ok) { setError(res.error ?? "No se pudo crear."); return; }
      router.refresh(); onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
        <form onSubmit={submit} className="glass-card max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nueva orden de servicio</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          {clients.length === 0 ? (
            <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">Primero crea un cliente.</p>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Cliente *</label>
                <select className={field} value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                  {clients.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Tipo de servicio</label>
                  <select className={field} value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value as ServiceType })}>
                    {(Object.keys(serviceTypeLabel) as ServiceType[]).map((s) => (<option key={s} value={s}>{serviceTypeLabel[s]}</option>))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Prioridad</label>
                  <select className={field} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}>
                    {(["normal", "urgente", "emergencia"] as Priority[]).map((p) => (<option key={p} value={p}>{priorityLabel[p]}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-xs text-slate-400">Fecha programada</label><input type="date" className={field} value={form.scheduledDate.slice(0, 10)} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} /></div>
                <div><label className="mb-1 block text-xs text-slate-400">Fecha estimada fin</label><input type="date" className={field} value={form.estimatedEndDate.slice(0, 10)} onChange={(e) => setForm({ ...form, estimatedEndDate: e.target.value })} /></div>
              </div>
              <input placeholder="Dirección" className={field} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <textarea rows={2} placeholder="Descripción del trabajo" className={field} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div><label className="mb-1 block text-xs text-slate-400">Monto estimado (RD$)</label><input type="number" min={0} className={field} value={form.total || ""} onChange={(e) => setForm({ ...form, total: Number(e.target.value) })} /></div>
              <div>
                <label className="mb-1.5 block text-xs text-slate-400">Asignar técnicos</label>
                <div className="flex flex-wrap gap-2">
                  {technicians.map((t) => (
                    <button type="button" key={t.id} onClick={() => toggleTech(t.id)} className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium", form.technicianIds?.includes(t.id) ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400")}>{t.name}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending || clients.length === 0} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Creando…" : "Crear orden"}</button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
