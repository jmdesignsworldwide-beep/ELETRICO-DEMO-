"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Phone, MapPin, Building2, Home, Factory, X, Loader2 } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { propertyTypeLabel } from "@/lib/labels";
import { formatRD, initials, cn } from "@/lib/utils";
import type { Client, PropertyType } from "@/lib/types";
import { createClientAction, type ClientInput } from "@/app/actions/clients";

const propIcon: Record<PropertyType, typeof Home> = { residencial: Home, comercial: Building2, industrial: Factory };
const propStyle: Record<PropertyType, string> = {
  residencial: "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 ring-sky-500/25",
  comercial: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 ring-violet-500/25",
  industrial: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-500/25",
};

export function ClientesView({ clients }: { clients: Client[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<PropertyType | "todos">("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const params = useSearchParams();
  useEffect(() => { if (params.get("new") === "1") setModalOpen(true); }, [params]);

  const filtered = useMemo(
    () =>
      clients.filter((c) => {
        const matchQ =
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, ""));
        const matchF = filter === "todos" || c.propertyType === filter;
        return matchQ && matchF;
      }),
    [q, filter, clients]
  );

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
          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </button>
        </div>
      </Reveal>

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
                  "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  filter === f ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400"
                )}
              >
                {f === "todos" ? "Todos" : propertyTypeLabel[f]}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {clients.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay clientes. Conecta Supabase y aplica la migración con el seed, o crea el primero.
        </div>
      ) : filtered.length === 0 ? (
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
                  className="h-full"
                >
                <Link href={`/clientes/${c.id}`} className="glass-card group block h-full cursor-pointer p-5 transition-shadow hover:shadow-card-light-hover">
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
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 shrink-0" /><span>{c.phone}</span></div>
                    <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="line-clamp-1">{c.address}</span></div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/[0.06]">
                    <div>
                      <p className="text-xs text-slate-400">Total gastado</p>
                      <p className="font-semibold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(c.totalSpent, { decimals: false })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Servicios</p>
                      <p className="font-semibold tabular-nums">{c.serviceCount}</p>
                    </div>
                  </div>
                </Link>
                </motion.div>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      <AnimatePresence>
        {modalOpen && <NewClientModal onClose={() => setModalOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

function NewClientModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ClientInput>({
    name: "", phone: "", address: "", propertyType: "residencial", panelType: "", voltage: "", notes: "",
    breakerPrincipal: "", contactoAlterno: "", direccionReferencia: "", problemasConocidos: "", historialInstalaciones: "",
  });
  const set = (patch: Partial<ClientInput>) => setForm((f) => ({ ...f, ...patch }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createClientAction(form);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar.");
        return;
      }
      router.refresh();
      onClose();
    });
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-[92vw] max-w-lg overflow-y-auto"
      >
        <form onSubmit={submit} className="glass-card max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nuevo cliente</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Datos generales</p>
              <div className="space-y-3">
                <input required placeholder="Nombre del cliente *" className={field} value={form.name} onChange={(e) => set({ name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Teléfono *" className={field} value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
                  <input placeholder="Contacto alterno" className={field} value={form.contactoAlterno} onChange={(e) => set({ contactoAlterno: e.target.value })} />
                </div>
                <select className={field} value={form.propertyType} onChange={(e) => set({ propertyType: e.target.value })}>
                  <option value="residencial">Residencial</option>
                  <option value="comercial">Comercial</option>
                  <option value="industrial">Industrial</option>
                </select>
                <input placeholder="Dirección" className={field} value={form.address} onChange={(e) => set({ address: e.target.value })} />
                <input placeholder="Punto de referencia (cómo llegar)" className={field} value={form.direccionReferencia} onChange={(e) => set({ direccionReferencia: e.target.value })} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Expediente técnico</p>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Tipo de panel" className={field} value={form.panelType} onChange={(e) => set({ panelType: e.target.value })} />
                  <input placeholder="Voltaje (110V / 220V…)" className={field} value={form.voltage} onChange={(e) => set({ voltage: e.target.value })} />
                </div>
                <input placeholder="Breaker principal (amperaje)" className={field} value={form.breakerPrincipal} onChange={(e) => set({ breakerPrincipal: e.target.value })} />
                <textarea placeholder="Problemas conocidos (fallas recurrentes, riesgos…)" rows={2} className={field} value={form.problemasConocidos} onChange={(e) => set({ problemasConocidos: e.target.value })} />
                <textarea placeholder="Historial de instalaciones previas" rows={2} className={field} value={form.historialInstalaciones} onChange={(e) => set({ historialInstalaciones: e.target.value })} />
                <textarea placeholder="Notas técnicas adicionales" rows={2} className={field} value={form.notes} onChange={(e) => set({ notes: e.target.value })} />
              </div>
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Guardando…" : "Guardar cliente"}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
