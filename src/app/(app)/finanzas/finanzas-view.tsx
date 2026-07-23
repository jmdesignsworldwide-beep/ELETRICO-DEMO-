"use client";

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { TrendingUp, Download, DollarSign, Wallet, PiggyBank } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { serviceTypeLabel } from "@/lib/labels";
import { formatRD } from "@/lib/utils";
import type { ServiceOrder } from "@/lib/types";

const PIE_COLORS = ["#ffcc00", "#e6b800", "#b38f00", "#806600"];

interface Props {
  monthly: { month: string; ingresos: number; gastos: number }[];
  orders: ServiceOrder[];
}

export function FinanzasView({ monthly, orders }: Props) {
  const totalIngresos = monthly.reduce((s, m) => s + m.ingresos, 0);
  const totalGastos = monthly.reduce((s, m) => s + m.gastos, 0);
  const ganancia = totalIngresos - totalGastos;

  // Distribución de gastos proporcional al total (categorías típicas del rubro).
  const expenseSplit = [
    { name: "Materiales", pct: 0.57 },
    { name: "Nómina", pct: 0.31 },
    { name: "Transporte", pct: 0.08 },
    { name: "Herramientas", pct: 0.04 },
  ];
  const lastGastos = monthly.length ? monthly[monthly.length - 1].gastos : 0;
  const expenseByCategory = expenseSplit.map((e) => ({ name: e.name, value: Math.round(lastGastos * e.pct) }));

  const byService = Object.entries(
    orders.reduce<Record<string, number>>((acc, o) => {
      acc[o.serviceType] = (acc[o.serviceType] ?? 0) + o.total;
      return acc;
    }, {})
  )
    .map(([k, v]) => ({ name: serviceTypeLabel[k as keyof typeof serviceTypeLabel] ?? k, value: v }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  if (monthly.length === 0) {
    return (
      <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
        Aún no hay estadísticas. Conecta Supabase y aplica la migración con el seed.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Últimos {monthly.length} meses · comparativo ingresos vs gastos</p>
            <h2 className="text-2xl font-bold tracking-tight">Finanzas y estadísticas</h2>
          </div>
          <button className="btn-ghost"><Download className="h-4 w-4" />Exportar PDF</button>
        </div>
      </Reveal>

      <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StaggerItem>
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><DollarSign className="h-4 w-4" /><span className="text-xs">Ingresos ({monthly.length}m)</span></div>
            <div className="kpi-value text-emerald-600 dark:text-emerald-400"><CountUp value={totalIngresos} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><Wallet className="h-4 w-4" /><span className="text-xs">Gastos ({monthly.length}m)</span></div>
            <div className="kpi-value text-red-500 dark:text-red-400"><CountUp value={totalGastos} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><PiggyBank className="h-4 w-4" /><span className="text-xs">Ganancia neta</span></div>
            <div className="kpi-value text-volt-600 dark:text-volt-400"><CountUp value={ganancia} format={(n) => formatRD(n, { decimals: false })} /></div>
          </div>
        </StaggerItem>
      </Stagger>

      <Reveal delay={0.06}>
        <div className="glass-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><TrendingUp className="h-5 w-5 text-volt-500" />Ingresos vs gastos</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffcc00" stopOpacity={0.5} /><stop offset="100%" stopColor="#ffcc00" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gGas" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="ingresos" stroke="#e6b800" strokeWidth={2.5} fill="url(#gIng)" />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fill="url(#gGas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal delay={0.08}>
          <div className="glass-card p-5">
            <h3 className="mb-4 font-semibold">Ingresos por tipo de servicio</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byService} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={130} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,204,0,0.06)" }} />
                  <Bar dataKey="value" fill="#ffcc00" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="glass-card p-5">
            <h3 className="mb-4 font-semibold">Gastos por categoría (mes actual)</h3>
            <div className="flex h-64 items-center">
              <div className="h-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                      {expenseByCategory.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 pr-2">
                {expenseByCategory.map((e, i) => (
                  <div key={e.name} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-slate-500 dark:text-slate-400">{e.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-white/10 dark:bg-ink-800/95">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="tabular-nums" style={{ color: p.color ?? p.fill }}>{p.name}: {formatRD(p.value, { decimals: false })}</p>
      ))}
    </div>
  );
}
