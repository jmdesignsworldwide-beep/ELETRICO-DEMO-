"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Wrench, Users, DollarSign, Receipt, Plus, UserPlus, FileText,
  AlertTriangle, Activity, ChevronRight,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusStyle, priorityStyle, priorityLabel } from "@/lib/labels";
import { formatRD, formatDate, daysUntil, cn } from "@/lib/utils";
import type { ServiceOrder, InventoryItem, ActivityEvent } from "@/lib/types";

const quickActions = [
  { label: "Nueva orden", icon: Plus, href: "/ordenes?new=1", primary: true },
  { label: "Nuevo cliente", icon: UserPlus, href: "/clientes?new=1" },
  { label: "Nueva cotización", icon: FileText, href: "/cotizaciones?new=1" },
];

const CLOSED = ["completada", "facturada", "pagada", "cancelada"];

interface Props {
  kpis: { activeOrders: number; clients: number; monthRevenue: number; pendingInvoices: number };
  orders: ServiceOrder[];
  activity: ActivityEvent[];
  inventory: InventoryItem[];
}

export function DashboardView({ kpis, orders, activity, inventory }: Props) {
  const open = orders.filter((o) => !CLOSED.includes(o.status));
  const vencidas = open.filter((o) => daysUntil(o.estimatedEndDate) < 0);
  const hoy = open.filter((o) => daysUntil(o.estimatedEndDate) === 0);
  const proceso = open.filter((o) => daysUntil(o.estimatedEndDate) > 0);
  const lowStock = inventory.filter((i) => i.stock <= i.minStock);

  return (
    <div className="space-y-8">
      <Reveal>
        <div className="flex flex-col gap-1">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {formatDate(new Date())} · Panel de control
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Buenas, <span className="text-volt-500">Marien</span> 👋
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Esto es lo que está pasando en JM Electric hoy.
          </p>
        </div>
      </Reveal>

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Órdenes activas" value={kpis.activeOrders} icon={Wrench} href="/ordenes" />
        <KpiCard label="Clientes" value={kpis.clients} icon={Users} href="/clientes" />
        <KpiCard label="Ingresos del mes" value={kpis.monthRevenue} icon={DollarSign} href="/finanzas" format={(n) => formatRD(n, { decimals: false })} />
        <KpiCard label="Facturas pendientes" value={kpis.pendingInvoices} icon={Receipt} href="/facturacion" accent="text-amber-500" />
      </Stagger>

      <Reveal delay={0.05}>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.label} href={a.href} className={a.primary ? "btn-primary" : "btn-ghost"}>
                <Icon className="h-4 w-4" />
                {a.label}
              </Link>
            );
          })}
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Urgencias
            </h3>
            <Link href="/ordenes" className="text-sm font-medium text-volt-600 hover:underline dark:text-volt-400">
              Ver todas
            </Link>
          </div>

          {open.length === 0 ? (
            <div className="glass-card p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No hay órdenes abiertas. Todo al día. ⚡
            </div>
          ) : (
            <Stagger className="space-y-3">
              {vencidas.map((o) => <UrgencyRow key={o.id} order={o} tone="danger" />)}
              {hoy.map((o) => <UrgencyRow key={o.id} order={o} tone="warning" />)}
              {proceso.map((o) => <UrgencyRow key={o.id} order={o} tone="info" />)}
            </Stagger>
          )}
        </div>

        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <Activity className="h-5 w-5 text-volt-500" />
            Actividad reciente
          </h3>
          <div className="glass-card divide-y divide-slate-100 p-1 dark:divide-white/[0.05]">
            {activity.length === 0 ? (
              <p className="p-4 text-sm text-slate-400">Sin actividad todavía.</p>
            ) : (
              activity.map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  className="flex gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]"
                >
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-volt-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{e.title}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{e.detail}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {lowStock.length > 0 && (
            <div className="mt-4">
              <h3 className="mb-3 text-sm font-semibold text-amber-600 dark:text-amber-400">
                Stock bajo ({lowStock.length})
              </h3>
              <div className="glass-card space-y-1 p-2">
                {lowStock.map((i) => (
                  <Link key={i.id} href="/inventario" className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-amber-500/5">
                    <span className="truncate pr-2 text-slate-600 dark:text-slate-300">{i.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-amber-600 dark:text-amber-400">
                      {i.stock}/{i.minStock}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UrgencyRow({ order, tone }: { order: ServiceOrder; tone: "danger" | "warning" | "info" }) {
  const days = daysUntil(order.estimatedEndDate);
  const toneMap = {
    danger: { bar: "bg-red-500", ring: "ring-red-500/30", label: `Vencida hace ${Math.abs(days)} día${Math.abs(days) === 1 ? "" : "s"}`, labelColor: "text-red-600 dark:text-red-400", pulse: "animate-pulse-danger" },
    warning: { bar: "bg-amber-500", ring: "ring-amber-500/30", label: "Vence hoy", labelColor: "text-amber-600 dark:text-amber-400", pulse: "" },
    info: { bar: "bg-sky-500", ring: "ring-sky-500/25", label: `Vence en ${days} día${days === 1 ? "" : "s"}`, labelColor: "text-sky-600 dark:text-sky-400", pulse: "" },
  }[tone];

  return (
    <StaggerItem>
      <Link href="/ordenes" className={cn("glass-card flex items-center gap-4 p-4 ring-1 ring-inset transition-transform hover:-translate-y-0.5", toneMap.ring, toneMap.pulse)}>
        <div className={cn("h-10 w-1 shrink-0 rounded-full", toneMap.bar)} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-400">{order.number}</span>
            <Badge className={priorityStyle[order.priority]}>{priorityLabel[order.priority]}</Badge>
          </div>
          <p className="mt-0.5 truncate text-sm font-medium">{order.clientName}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{order.description}</p>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className={cn("text-xs font-semibold", toneMap.labelColor)}>{toneMap.label}</span>
          <Badge className={orderStatusStyle[order.status]}>{orderStatusLabel[order.status]}</Badge>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
      </Link>
    </StaggerItem>
  );
}
