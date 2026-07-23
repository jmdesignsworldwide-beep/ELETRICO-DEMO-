"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, User, Calendar, MapPin, Loader2, ChevronRight } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, serviceTypeLabel, priorityLabel, priorityStyle } from "@/lib/labels";
import { formatRD, formatDate, daysUntil, cn } from "@/lib/utils";
import type { OrderStatus, ServiceOrder } from "@/lib/types";
import { updateOrderStatusAction } from "@/app/actions/orders";

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

export function OrdenesView({ orders }: { orders: ServiceOrder[] }) {
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("abiertas");

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
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva orden
          </button>
        </div>
      </Reveal>

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
