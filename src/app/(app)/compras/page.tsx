"use client";

import { motion } from "framer-motion";
import { Plus, ShoppingCart, Download, CheckCircle2, Clock } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { formatRD, formatDate } from "@/lib/utils";

const purchaseOrders = [
  { id: "p1", number: "OC-2025-0044", supplier: "Distribuidora Solar RD", status: "recibida", items: 3, total: 148_500, date: "2026-07-18" },
  { id: "p2", number: "OC-2025-0045", supplier: "Eléctricos del Caribe SRL", status: "pendiente", items: 8, total: 62_300, date: "2026-07-21" },
  { id: "p3", number: "OC-2025-0046", supplier: "CCTV Import Dominicana", status: "transito", items: 5, total: 34_200, date: "2026-07-22" },
  { id: "p4", number: "OC-2025-0043", supplier: "Ferretería Industrial Duarte", status: "recibida", items: 12, total: 28_900, date: "2026-07-12" },
];

const statusMap: Record<string, { label: string; style: string; icon: typeof Clock }> = {
  recibida: { label: "Recibida", style: "bg-emerald-50 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300", icon: CheckCircle2 },
  pendiente: { label: "Pendiente", style: "bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300", icon: Clock },
  transito: { label: "En tránsito", style: "bg-sky-50 text-sky-700 ring-sky-500/25 dark:bg-sky-500/15 dark:text-sky-300", icon: ShoppingCart },
};

export default function ComprasPage() {
  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Al marcar como recibida, el inventario se actualiza automáticamente
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Órdenes de compra</h2>
          </div>
          <button className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva orden de compra
          </button>
        </div>
      </Reveal>

      <Stagger className="space-y-3">
        {purchaseOrders.map((po) => {
          const st = statusMap[po.status];
          const Icon = st.icon;
          return (
            <StaggerItem key={po.id}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="glass-card flex flex-wrap items-center gap-4 p-4 transition-shadow hover:shadow-card-light-hover sm:p-5"
              >
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-volt-500/10 ring-1 ring-inset ring-volt-500/20">
                  <ShoppingCart className="h-5 w-5 text-volt-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">{po.number}</span>
                    <Badge className={st.style}><Icon className="h-3 w-3" />{st.label}</Badge>
                  </div>
                  <h3 className="mt-0.5 truncate font-semibold">{po.supplier}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {po.items} materiales · {formatDate(po.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold tabular-nums text-volt-600 dark:text-volt-400">
                    {formatRD(po.total, { decimals: false })}
                  </p>
                </div>
                <div className="flex w-full items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06] sm:w-auto sm:border-0 sm:pt-0">
                  <button className="btn-ghost px-3 py-2 text-xs"><Download className="h-3.5 w-3.5" />PDF</button>
                  {po.status !== "recibida" && (
                    <button className="btn-primary px-3 py-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5" />Recibir</button>
                  )}
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
