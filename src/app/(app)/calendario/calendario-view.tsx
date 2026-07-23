"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, List, Grid3x3, Loader2, MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { serviceTypeLabel, orderStatusLabel, orderStatusStyle } from "@/lib/labels";
import { formatDate, daysUntil, cn } from "@/lib/utils";
import type { ServiceOrder, Technician } from "@/lib/types";
import { rescheduleOrderAction } from "@/app/actions/orders";

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const CLOSED = ["completada", "facturada", "pagada", "cancelada"];

function eventTone(o: ServiceOrder): { dot: string; chip: string } {
  const overdue = daysUntil(o.estimatedEndDate) < 0 && !CLOSED.includes(o.status);
  if (o.priority === "emergencia" || overdue) return { dot: "bg-red-500", chip: "bg-red-500/10 text-red-700 dark:text-red-300 ring-red-500/25" };
  if (["completada", "facturada", "pagada"].includes(o.status)) return { dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/25" };
  if (o.status === "cancelada") return { dot: "bg-slate-400", chip: "bg-slate-400/10 text-slate-600 dark:text-slate-300 ring-slate-400/25" };
  if (o.status === "en_proceso") return { dot: "bg-sky-500", chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-sky-500/25" };
  return { dot: "bg-volt-500", chip: "bg-volt-500/10 text-volt-700 dark:text-volt-300 ring-volt-500/25" };
}

const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

type View = "mes" | "semana" | "agenda";

export function CalendarioView({ orders, technicians }: { orders: ServiceOrder[]; technicians: Technician[] }) {
  const [view, setView] = useState<View>("mes");
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [tech, setTech] = useState("todos");
  const [type, setType] = useState("todos");
  const [drop, setDrop] = useState<{ order: ServiceOrder; date: Date } | null>(null);

  const filtered = useMemo(() => orders.filter((o) => {
    const mt = tech === "todos" || o.technicianIds.includes(tech);
    const mty = type === "todos" || o.serviceType === type;
    return mt && mty;
  }), [orders, tech, type]);

  const eventsByDay = useMemo(() => {
    const map: Record<string, ServiceOrder[]> = {};
    for (const o of filtered) { const d = new Date(o.scheduledDate); (map[key(d)] ??= []).push(o); }
    return map;
  }, [filtered]);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayEvents = eventsByDay[key(today)] ?? [];

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Admin ve todo · el técnico solo lo suyo</p>
            <h2 className="text-2xl font-bold tracking-tight">Calendario</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select value={tech} onChange={(e) => setTech(e.target.value)} className="rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]">
              <option value="todos">Todos los técnicos</option>
              {technicians.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
            <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]">
              <option value="todos">Todos los servicios</option>
              {Object.entries(serviceTypeLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
            <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-white/10">
              {([["mes", Grid3x3], ["semana", CalendarDays], ["agenda", List]] as const).map(([v, Icon]) => (
                <button key={v} onClick={() => setView(v)} className={cn("grid h-8 w-9 place-items-center rounded-md transition-colors", view === v ? "bg-volt-500 text-ink-950" : "text-slate-500 dark:text-slate-400")} aria-label={v}><Icon className="h-4 w-4" /></button>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {todayEvents.length > 0 && (
        <Reveal delay={0.03}>
          <div className="glass-card p-4 ring-1 ring-inset ring-volt-500/20">
            <h3 className="mb-2 text-sm font-semibold text-volt-600 dark:text-volt-400">Trabajo de hoy ({todayEvents.length})</h3>
            <div className="flex flex-wrap gap-2">
              {todayEvents.map((o) => (<Link key={o.id} href={`/ordenes/${o.id}`} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium hover:bg-volt-500/10 dark:bg-white/[0.05]">{o.number} · {o.clientName}</Link>))}
            </div>
          </div>
        </Reveal>
      )}

      {/* Navegación de período */}
      {view !== "agenda" && (
        <Reveal delay={0.04}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {view === "mes" ? `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}` : weekLabel(cursor)}
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setCursor(shift(cursor, view, -1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-volt-600 dark:border-white/10"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => { const d = new Date(); d.setHours(0,0,0,0); setCursor(d); }} className="rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-500 hover:text-volt-600 dark:border-white/10">Hoy</button>
              <button onClick={() => setCursor(shift(cursor, view, 1))} className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:text-volt-600 dark:border-white/10"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.05}>
        {view === "mes" && <MonthGrid cursor={cursor} eventsByDay={eventsByDay} onDrop={(order, date) => setDrop({ order, date })} />}
        {view === "semana" && <WeekView cursor={cursor} eventsByDay={eventsByDay} onDrop={(order, date) => setDrop({ order, date })} />}
        {view === "agenda" && <AgendaView orders={filtered} />}
      </Reveal>

      <Reveal delay={0.07}>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <Legend color="bg-volt-500" label="Programada" />
          <Legend color="bg-sky-500" label="En proceso" />
          <Legend color="bg-emerald-500" label="Completada" />
          <Legend color="bg-red-500" label="Vencida / emergencia" />
          <Legend color="bg-slate-400" label="Cancelada" />
        </div>
      </Reveal>

      <AnimatePresence>
        {drop && <RescheduleModal order={drop.order} date={drop.date} onClose={() => setDrop(null)} />}
      </AnimatePresence>
    </div>
  );
}

function MonthGrid({ cursor, eventsByDay, onDrop }: { cursor: Date; eventsByDay: Record<string, ServiceOrder[]>; onDrop: (o: ServiceOrder, d: Date) => void }) {
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="glass-card overflow-hidden p-3 sm:p-4">
      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">{dayNames.map((d) => (<div key={d} className="py-1 text-center text-xs font-semibold text-slate-400">{d}</div>))}</div>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[64px] rounded-lg sm:min-h-[92px]" />;
          const isToday = date.getTime() === today.getTime();
          const events = eventsByDay[key(date)] ?? [];
          return (
            <div key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData("text/orderId"); const o = events.concat(Object.values(eventsByDay).flat()).find((x) => x.id === id); if (o) onDrop(o, date); }}
              className={cn("min-h-[64px] rounded-lg border p-1.5 transition-colors sm:min-h-[92px] sm:p-2", "border-slate-100 dark:border-white/[0.05]", isToday && "border-volt-500/40 bg-volt-500/5 ring-1 ring-inset ring-volt-500/30")}>
              <div className={cn("mb-1 text-xs font-medium tabular-nums", isToday ? "text-volt-600 dark:text-volt-400" : "text-slate-400")}>{date.getDate()}</div>
              <div className="space-y-1">
                {events.slice(0, 3).map((o) => <EventChip key={o.id} order={o} />)}
                {events.length > 3 && <div className="text-[10px] text-slate-400">+{events.length - 3} más</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ cursor, eventsByDay, onDrop }: { cursor: Date; eventsByDay: Record<string, ServiceOrder[]>; onDrop: (o: ServiceOrder, d: Date) => void }) {
  const start = new Date(cursor); start.setDate(cursor.getDate() - cursor.getDay());
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return (
    <div className="glass-card overflow-x-auto p-3 sm:p-4">
      <div className="grid min-w-[640px] grid-cols-7 gap-2">
        {days.map((date, i) => {
          const events = eventsByDay[key(date)] ?? [];
          const isToday = date.getTime() === today.getTime();
          return (
            <div key={i} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const id = e.dataTransfer.getData("text/orderId"); const o = Object.values(eventsByDay).flat().find((x) => x.id === id); if (o) onDrop(o, date); }}
              className={cn("min-h-[220px] rounded-xl border p-2", "border-slate-100 dark:border-white/[0.05]", isToday && "border-volt-500/40 bg-volt-500/5")}>
              <div className="mb-2 text-center">
                <p className="text-[10px] uppercase text-slate-400">{dayNames[date.getDay()]}</p>
                <p className={cn("text-sm font-semibold tabular-nums", isToday ? "text-volt-600 dark:text-volt-400" : "")}>{date.getDate()}</p>
              </div>
              <div className="space-y-1.5">{events.map((o) => <EventChip key={o.id} order={o} full />)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgendaView({ orders }: { orders: ServiceOrder[] }) {
  const sorted = [...orders].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  const groups = useMemo(() => {
    const m: Record<string, ServiceOrder[]> = {};
    for (const o of sorted) { const d = new Date(o.scheduledDate); (m[key(d)] ??= []).push(o); }
    return Object.entries(m);
  }, [sorted]);

  if (groups.length === 0) return <div className="glass-card p-10 text-center text-sm text-slate-400">No hay órdenes con estos filtros.</div>;

  return (
    <div className="space-y-4">
      {groups.map(([k, evs]) => (
        <div key={k} className="glass-card p-4">
          <p className="mb-2 text-sm font-semibold">{formatDate(evs[0].scheduledDate)}</p>
          <div className="space-y-2">
            {evs.map((o) => {
              const tone = eventTone(o);
              return (
                <Link key={o.id} href={`/ordenes/${o.id}`} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                  <span className={cn("h-8 w-1 shrink-0 rounded-full", tone.dot)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{o.clientName}</p>
                    <p className="truncate text-xs text-slate-400">{o.number} · {serviceTypeLabel[o.serviceType]}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-slate-400"><MapPin className="h-3 w-3" />{o.address}</p>
                  </div>
                  <Badge className={orderStatusStyle[o.status]}>{orderStatusLabel[o.status]}</Badge>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function EventChip({ order: o, full }: { order: ServiceOrder; full?: boolean }) {
  const tone = eventTone(o);
  return (
    <div draggable onDragStart={(e) => e.dataTransfer.setData("text/orderId", o.id)}
      className={cn("group flex cursor-grab items-center gap-1 truncate rounded px-1.5 py-1 text-[10px] font-medium ring-1 ring-inset active:cursor-grabbing sm:text-xs", tone.chip)}
      title={`${o.number} · ${o.clientName} — arrastra para reprogramar`}>
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone.dot)} />
      <span className="truncate">{full ? `${o.clientName}` : o.clientName.split(" ")[0]}</span>
    </div>
  );
}

function RescheduleModal({ order, date, onClose }: { order: ServiceOrder; date: Date; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    const nd = new Date(date); const prev = new Date(order.scheduledDate);
    nd.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
    startTransition(async () => {
      const res = await rescheduleOrderAction(order.id, nd.toISOString());
      if (!res.ok) { setError(res.error ?? "No se pudo reprogramar."); return; }
      router.refresh(); onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
        <div className="glass-card p-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-volt-500/10 text-volt-500"><CalendarDays className="h-6 w-6" /></div>
          <h3 className="font-semibold">¿Reprogramar {order.number}?</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.clientName}</p>
          <p className="mt-3 text-sm">De <span className="font-medium">{formatDate(order.scheduledDate)}</span> a <span className="font-semibold text-volt-600 dark:text-volt-400">{formatDate(date)}</span></p>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex gap-2">
            <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
            <button onClick={confirm} disabled={pending} className="btn-primary flex-1">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}Reprogramar</button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("h-2.5 w-2.5 rounded-full", color)} />{label}</span>;
}

function shift(d: Date, view: View, dir: number): Date {
  const nd = new Date(d);
  if (view === "mes") nd.setMonth(d.getMonth() + dir);
  else nd.setDate(d.getDate() + dir * 7);
  return nd;
}
function weekLabel(cursor: Date): string {
  const start = new Date(cursor); start.setDate(cursor.getDate() - cursor.getDay());
  const end = new Date(start); end.setDate(start.getDate() + 6);
  return `${start.getDate()} ${monthNames[start.getMonth()].slice(0, 3)} — ${end.getDate()} ${monthNames[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
}
