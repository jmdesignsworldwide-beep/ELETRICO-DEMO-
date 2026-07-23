"use client";

import { useState, useMemo } from "react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, AlertTriangle, Package, Download } from "lucide-react";
import { formatRD, formatNumber, cn } from "@/lib/utils";
import type { InventoryItem } from "@/lib/types";

export function InventarioView({ inventory }: { inventory: InventoryItem[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(
    () =>
      inventory.filter(
        (i) =>
          i.name.toLowerCase().includes(q.toLowerCase()) ||
          i.sku.toLowerCase().includes(q.toLowerCase()) ||
          i.category.toLowerCase().includes(q.toLowerCase())
      ),
    [q, inventory]
  );

  const totalValue = inventory.reduce((s, i) => s + i.costPrice * i.stock, 0);
  const lowStock = inventory.filter((i) => i.stock <= i.minStock).length;

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {inventory.length} materiales · Valor {formatRD(totalValue, { decimals: false })} ·{" "}
              <span className="text-amber-600 dark:text-amber-400">{lowStock} en stock bajo</span>
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Inventario de materiales</h2>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost"><Download className="h-4 w-4" />Reporte</button>
            <button className="btn-primary"><Plus className="h-4 w-4" />Nuevo material</button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, SKU o categoría…"
            className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]"
          />
        </div>
      </Reveal>

      {inventory.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay materiales. Conecta Supabase y aplica la migración con el seed.
        </div>
      ) : (
        <Reveal delay={0.06}>
          <div className="glass-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/[0.06]">
                    <th className="px-4 py-3 font-semibold">Material</th>
                    <th className="px-4 py-3 font-semibold">Costo</th>
                    <th className="px-4 py-3 font-semibold">Venta</th>
                    <th className="px-4 py-3 font-semibold">Margen</th>
                    <th className="px-4 py-3 text-right font-semibold">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i) => {
                    const margin = Math.round(((i.salePrice - i.costPrice) / i.salePrice) * 100);
                    const low = i.stock <= i.minStock;
                    return (
                      <tr key={i.id} className="border-b border-slate-50 transition-colors last:border-0 hover:bg-slate-50 dark:border-white/[0.03] dark:hover:bg-white/[0.02]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-volt-500/10 text-volt-500"><Package className="h-4 w-4" /></div>
                            <div className="min-w-0">
                              <p className="font-medium leading-tight">{i.name}</p>
                              <p className="text-xs text-slate-400">{i.sku} · {i.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-500 dark:text-slate-400">{formatRD(i.costPrice, { decimals: false })}</td>
                        <td className="px-4 py-3 font-medium tabular-nums">{formatRD(i.salePrice, { decimals: false })}</td>
                        <td className="px-4 py-3"><span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{margin}%</span></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {low && (
                              <Badge className="bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300"><AlertTriangle className="h-3 w-3" />Bajo</Badge>
                            )}
                            <span className={cn("font-semibold tabular-nums", low ? "text-amber-600 dark:text-amber-400" : "")}>{formatNumber(i.stock)}</span>
                            <span className="text-xs text-slate-400">/ {i.minStock} mín</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      )}
    </div>
  );
}
