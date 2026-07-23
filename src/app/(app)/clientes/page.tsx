"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Phone, MapPin, Building2, Home, Factory } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { clients } from "@/lib/demo-data";
import { propertyTypeLabel } from "@/lib/labels";
import { formatRD, initials, cn } from "@/lib/utils";
import type { PropertyType } from "@/lib/types";

const propIcon: Record<PropertyType, typeof Home> = {
  residencial: Home,
  comercial: Building2,
  industrial: Factory,
};
const propStyle: Record<PropertyType, string> = {
  residencial: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 ring-sky-500/25",
  comercial: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 ring-violet-500/25",
  industrial: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-500/25",
};

export default function ClientesPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<PropertyType | "todos">("todos");

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const matchQ =
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""));
      const matchF = filter === "todos" || c.propertyType === filter;
      return matchQ && matchF;
    });
  }, [q, filter]);

  const totalSpent = clients.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {clients.length} clientes · {formatRD(totalSpent, { decimals: false })} facturado histórico
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Clientes</h2>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </button>
        </div>
      </Reveal>

      {/* Búsqueda + filtros */}
      <Reveal delay={0.04}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o teléfono…"
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["todos", "residencial", "comercial", "industrial"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "shrink-0 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors",
                  filter === f
                    ? "bg-volt-500 text-ink-950"
                    : "border border-slate-200 text-slate-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400"
                )}
              >
                {f === "todos" ? "Todos" : propertyTypeLabel[f]}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          No se encontraron clientes con “{q}”.
        </div>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const Icon = propIcon[c.propertyType];
            return (
              <StaggerItem key={c.id}>
                <motion.div
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="glass-card group h-full cursor-pointer p-5 transition-shadow hover:shadow-card-light-hover"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-gradient text-sm font-bold text-ink-950">
                      {initials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold leading-tight">{c.name}</h3>
                      <Badge className={cn("mt-1", propStyle[c.propertyType])}>
                        <Icon className="h-3 w-3" />
                        {propertyTypeLabel[c.propertyType]}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{c.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="line-clamp-1">{c.address}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                    <div>
                      <p className="text-xs text-slate-400">Total gastado</p>
                      <p className="font-semibold tabular-nums text-volt-600 dark:text-volt-400">
                        {formatRD(c.totalSpent, { decimals: false })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Servicios</p>
                      <p className="font-semibold tabular-nums">{c.serviceCount}</p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
}
