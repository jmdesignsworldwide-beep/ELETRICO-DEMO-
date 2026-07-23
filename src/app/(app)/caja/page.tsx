"use client";

import { motion } from "framer-motion";
import { Plus, Wallet, TrendingUp, TrendingDown, Receipt, Camera } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { formatRD, formatDate } from "@/lib/utils";

const movimientos = [
  { id: "m1", type: "ingreso", concept: "Pago FAC-2025-0202 · Transferencia", amount: 145_000, time: "10:24 AM" },
  { id: "m2", type: "ingreso", concept: "Pago FAC-2025-0200 · Efectivo", amount: 118_900, time: "9:15 AM" },
  { id: "m3", type: "gasto", concept: "Compra materiales · Eléctricos del Caribe", amount: 62_300, time: "11:40 AM" },
  { id: "m4", type: "gasto", concept: "Combustible camioneta", amount: 3_200, time: "8:05 AM" },
  { id: "m5", type: "gasto", concept: "Almuerzo cuadrilla", amount: 1_450, time: "12:30 PM" },
];

export default function CajaPage() {
  const apertura = 15_000;
  const ingresos = movimientos.filter((m) => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const gastos = movimientos.filter((m) => m.type === "gasto").reduce((s, m) => s + m.amount, 0);
  const enCaja = apertura + ingresos - gastos;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Caja abierta · {formatDate(new Date())} · apertura {formatRD(apertura, { decimals: false })}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Caja y gastos</h2>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost"><Plus className="h-4 w-4" />Registrar gasto</button>
            <button className="btn-primary"><Wallet className="h-4 w-4" />Cerrar caja</button>
          </div>
        </div>
      </Reveal>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><TrendingUp className="h-4 w-4 text-emerald-500" /><span className="text-xs">Ingresos del día</span></div>
            <div className="kpi-value text-emerald-600 dark:text-emerald-400"><CountUp value={ingresos} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><TrendingDown className="h-4 w-4 text-red-500" /><span className="text-xs">Gastos del día</span></div>
            <div className="kpi-value text-red-500 dark:text-red-400"><CountUp value={gastos} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5 ring-1 ring-inset ring-volt-500/20">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><Wallet className="h-4 w-4 text-volt-500" /><span className="text-xs">Efectivo en caja</span></div>
            <div className="kpi-value text-volt-600 dark:text-volt-400"><CountUp value={enCaja} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
      </Stagger>

      <Reveal delay={0.06}>
        <div className="glass-card p-2">
          <h3 className="px-3 py-2 font-semibold">Movimientos de hoy</h3>
          <div className="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {movimientos.map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${m.type === "ingreso" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                  {m.type === "ingreso" ? <TrendingUp className="h-4 w-4" /> : <Receipt className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.concept}</p>
                  <p className="text-xs text-slate-400">{m.time}</p>
                </div>
                {m.type === "gasto" && (
                  <Camera className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                )}
                <span className={`shrink-0 font-semibold tabular-nums ${m.type === "ingreso" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                  {m.type === "ingreso" ? "+" : "−"}{formatRD(m.amount, { decimals: false })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
