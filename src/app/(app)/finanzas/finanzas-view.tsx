"use client";

import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Download, DollarSign, Wallet, PiggyBank, Percent, Clock, Package, HardHat } from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/ui/reveal";
import { CountUp } from "@/components/ui/count-up";
import { formatRD, formatNumber, cn } from "@/lib/utils";
import type { FinanceReport } from "@/lib/types";

const VOLT = ["#ffcc00", "#e6b800", "#b38f00", "#806600", "#ffd91f", "#4d3d00"];

export function FinanzasView({ report }: { report: FinanceReport }) {
  const r = report;
  if (r.monthly.length === 0 && r.incomeByService.length === 0) {
    return <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">Aún no hay data. Conecta Supabase y aplica las migraciones con el seed.</div>;
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Todo agregado en tiempo real desde Supabase</p>
            <h2 className="text-2xl font-bold tracking-tight">Finanzas y estadísticas</h2>
          </div>
          <a href="/reporte-finanzas" target="_blank" rel="noopener noreferrer" className="btn-ghost"><Download className="h-4 w-4" />Exportar PDF</a>
        </div>
      </Reveal>

      {/* KPIs */}
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StaggerItem><Kpi icon={DollarSign} label="Ingresos (6m)" value={r.totals.ingresos} color="text-emerald-600 dark:text-emerald-400" /></StaggerItem>
        <StaggerItem><Kpi icon={Wallet} label="Gastos (6m)" value={r.totals.gastos} color="text-red-500 dark:text-red-400" /></StaggerItem>
        <StaggerItem><Kpi icon={PiggyBank} label="Ganancia neta" value={r.totals.ganancia} color="text-volt-600 dark:text-volt-400" /></StaggerItem>
        <StaggerItem>
          <div className="glass-card p-5">
            <div className="mb-2 flex items-center gap-2 text-slate-400"><Percent className="h-4 w-4" /><span className="text-xs">Mes vs mes</span></div>
            <div className={cn("kpi-value flex items-center gap-1", r.monthComparison.pct >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400")}>
              {r.monthComparison.pct >= 0 ? <TrendingUp className="h-6 w-6" /> : <TrendingDown className="h-6 w-6" />}
              {r.monthComparison.pct >= 0 ? "+" : ""}{r.monthComparison.pct}%
            </div>
          </div>
        </StaggerItem>
      </Stagger>

      {/* Ingresos vs gastos en el tiempo */}
      <Reveal delay={0.05}>
        <div className="glass-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold"><TrendingUp className="h-5 w-5 text-volt-500" />Ingresos vs gastos</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={r.monthly} margin={{ top: 6, right: 6, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffcc00" stopOpacity={0.5} /><stop offset="100%" stopColor="#ffcc00" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gGas" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<ChartTooltip money />} />
                <Area type="monotone" dataKey="ingresos" stroke="#e6b800" strokeWidth={2.5} fill="url(#gIng)" />
                <Area type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} fill="url(#gGas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ingresos por servicio */}
        <Reveal delay={0.06}>
          <div className="glass-card p-5">
            <h3 className="mb-4 font-semibold">Ingresos por tipo de servicio</h3>
            <ChartOrEmpty empty={r.incomeByService.length === 0}>
              <BarChart data={r.incomeByService} layout="vertical" margin={{ left: 10, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={130} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip money />} cursor={{ fill: "rgba(255,204,0,0.06)" }} />
                <Bar dataKey="value" fill="#ffcc00" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ChartOrEmpty>
          </div>
        </Reveal>

        {/* Gastos por categoría */}
        <Reveal delay={0.07}>
          <div className="glass-card p-5">
            <h3 className="mb-4 font-semibold">Gastos por categoría</h3>
            <ChartOrEmpty empty={r.expensesByCategory.length === 0}>
              <PieChart>
                <Pie data={r.expensesByCategory} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={3}>
                  {r.expensesByCategory.map((_, i) => (<Cell key={i} fill={VOLT[i % VOLT.length]} stroke="none" />))}
                </Pie>
                <Tooltip content={<ChartTooltip money />} />
              </PieChart>
            </ChartOrEmpty>
          </div>
        </Reveal>

        {/* Órdenes por estado */}
        <Reveal delay={0.08}>
          <div className="glass-card p-5">
            <h3 className="mb-4 font-semibold">Distribución de órdenes por estado</h3>
            <ChartOrEmpty empty={r.ordersByStatus.length === 0}>
              <BarChart data={r.ordersByStatus} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={50} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,204,0,0.06)" }} />
                <Bar dataKey="count" fill="#e6b800" radius={[6, 6, 0, 0]} barSize={26} />
              </BarChart>
            </ChartOrEmpty>
          </div>
        </Reveal>

        {/* Ingresos por técnico */}
        <Reveal delay={0.09}>
          <div className="glass-card p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold"><HardHat className="h-4 w-4 text-volt-500" />Ingresos por técnico</h3>
            <ChartOrEmpty empty={r.incomeByTech.length === 0}>
              <BarChart data={r.incomeByTech} layout="vertical" margin={{ left: 10, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={110} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip money />} cursor={{ fill: "rgba(255,204,0,0.06)" }} />
                <Bar dataKey="value" fill="#ffd91f" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ChartOrEmpty>
          </div>
        </Reveal>
      </div>

      {/* Conversión + rentabilidad + cierre + materiales */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Reveal delay={0.1}>
          <div className="glass-card p-5">
            <h3 className="mb-3 font-semibold">Conversión de cotizaciones</h3>
            <div className="mb-3 text-center">
              <p className="text-4xl font-bold tabular-nums text-volt-600 dark:text-volt-400">{r.quoteConversion.rate}%</p>
              <p className="text-xs text-slate-400">tasa de aprobación</p>
            </div>
            <div className="space-y-1.5 text-sm">
              <Row label="Enviadas" value={r.quoteConversion.enviadas} color="text-blue-600 dark:text-blue-400" />
              <Row label="Aprobadas" value={r.quoteConversion.aprobadas} color="text-emerald-600 dark:text-emerald-400" />
              <Row label="Rechazadas" value={r.quoteConversion.rechazadas} color="text-red-500 dark:text-red-400" />
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.11}>
          <div className="glass-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Clock className="h-4 w-4 text-volt-500" />Tiempo promedio de cierre</h3>
            {r.avgCloseByService.length === 0 ? (
              <p className="py-2 text-sm text-slate-400">Sin órdenes cerradas aún.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {r.avgCloseByService.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <span className="truncate pr-2 text-slate-600 dark:text-slate-300">{s.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{s.days} d</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="glass-card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-volt-500" />Materiales más usados</h3>
            {r.mostUsedMaterials.length === 0 ? (
              <p className="py-2 text-sm text-slate-400">Sin consumo registrado.</p>
            ) : (
              <div className="space-y-1.5 text-sm">
                {r.mostUsedMaterials.slice(0, 6).map((m) => (
                  <div key={m.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <span className="truncate pr-2 text-slate-600 dark:text-slate-300">{m.name}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-volt-600 dark:text-volt-400">{formatNumber(m.qty)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {/* Rentabilidad por servicio */}
      {r.serviceProfit.length > 0 && (
        <Reveal delay={0.13}>
          <div className="glass-card overflow-hidden p-0">
            <h3 className="border-b border-slate-100 p-5 pb-3 font-semibold dark:border-white/[0.06]">Rentabilidad por tipo de servicio</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/[0.06]">
                    <th className="px-5 py-2.5 font-semibold">Servicio</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ingresos</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Costo materiales</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Ganancia</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Margen</th>
                  </tr>
                </thead>
                <tbody>
                  {r.serviceProfit.map((s) => (
                    <tr key={s.name} className="border-b border-slate-50 last:border-0 dark:border-white/[0.03]">
                      <td className="px-5 py-2.5 font-medium">{s.name}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{formatRD(s.income, { decimals: false })}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{formatRD(s.cost, { decimals: false })}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-emerald-600 dark:text-emerald-400">{formatRD(s.income - s.cost, { decimals: false })}</td>
                      <td className="px-5 py-2.5 text-right"><span className="font-semibold tabular-nums text-volt-600 dark:text-volt-400">{s.margin}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, color }: { icon: typeof DollarSign; label: string; value: number; color: string }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-2 flex items-center gap-2 text-slate-400"><Icon className="h-4 w-4" /><span className="text-xs">{label}</span></div>
      <div className={cn("kpi-value", color)}><CountUp value={value} format={(n) => formatRD(n, { decimals: false })} /></div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={cn("font-semibold tabular-nums", color)}>{value}</span>
    </div>
  );
}

function ChartOrEmpty({ empty, children }: { empty: boolean; children: React.ReactElement }) {
  if (empty) return <div className="flex h-64 items-center justify-center text-sm text-slate-400">Sin data suficiente aún.</div>;
  return <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>;
}

function ChartTooltip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-white/10 dark:bg-ink-800/95">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="tabular-nums" style={{ color: p.color ?? p.fill }}>
          {p.name}: {money ? formatRD(p.value, { decimals: false }) : p.value}
        </p>
      ))}
    </div>
  );
}
