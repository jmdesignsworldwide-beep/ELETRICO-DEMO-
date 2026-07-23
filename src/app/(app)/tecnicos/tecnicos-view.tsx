"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Phone, Wrench, ChevronRight, X, Loader2, CreditCard } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { formatRD, initials, cn } from "@/lib/utils";
import type { Technician } from "@/lib/types";
import { createTechnicianAction, toggleTechnicianActiveAction, SPECIALTIES, type TechnicianInput } from "@/app/actions/technicians";

type Tech = Technician & { hoursPeriod: number; payrollPeriod: number };

export function TecnicosView({ technicians }: { technicians: Tech[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const totalNomina = technicians.filter((t) => t.active).reduce((s, t) => s + t.payrollPeriod, 0);

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {technicians.filter((t) => t.active).length} activos · Nómina del período {formatRD(totalNomina, { decimals: false })}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Técnicos y nómina</h2>
          </div>
          <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="h-4 w-4" />Nuevo técnico</button>
        </div>
      </Reveal>

      {technicians.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">
          Aún no hay técnicos. Crea el primero o aplica la migración con el seed.
        </div>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2">
          {technicians.map((t) => (
            <StaggerItem key={t.id}>
              <TechCard tech={t} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <AnimatePresence>{modalOpen && <NewTechModal onClose={() => setModalOpen(false)} />}</AnimatePresence>
    </div>
  );
}

function TechCard({ tech: t }: { tech: Tech }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    startTransition(async () => { await toggleTechnicianActiveAction(t.id, !t.active); router.refresh(); });
  }

  return (
    <Link href={`/tecnicos/${t.id}`}>
      <motion.div whileHover={{ y: -3 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className={cn("glass-card p-5 transition-shadow hover:shadow-card-light-hover", !t.active && "opacity-60")}>
        <div className="flex items-start gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-volt-gradient text-lg font-bold text-ink-950">{initials(t.name)}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-semibold leading-tight">{t.name}</h3>
              <Badge className={t.active ? "bg-emerald-50 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-500 ring-slate-500/20 dark:bg-slate-500/15 dark:text-slate-400"}>{t.active ? "Activo" : "Inactivo"}</Badge>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400"><Phone className="h-3.5 w-3.5" /> {t.phone}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {t.specialties.slice(0, 3).map((s) => (<Badge key={s} className="bg-volt-500/10 text-volt-700 ring-volt-500/20 dark:text-volt-300"><Wrench className="h-3 w-3" />{s}</Badge>))}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          <div><p className="text-xs text-slate-400">Tarifa/h</p><p className="font-semibold tabular-nums">{formatRD(t.hourlyRate, { decimals: false })}</p></div>
          <div><p className="text-xs text-slate-400">Horas</p><p className="font-semibold tabular-nums">{t.hoursPeriod}</p></div>
          <div><p className="text-xs text-slate-400">Nómina</p><p className="flex items-center gap-1 font-semibold tabular-nums text-volt-600 dark:text-volt-400"><CreditCard className="h-3.5 w-3.5" />{formatRD(t.payrollPeriod, { decimals: false })}</p></div>
        </div>
        <button onClick={toggle} disabled={pending} className="btn-ghost mt-3 w-full py-2 text-xs">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}{t.active ? "Marcar inactivo" : "Reactivar"}
        </button>
      </motion.div>
    </Link>
  );
}

function NewTechModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TechnicianInput>({ name: "", cedula: "", phone: "", address: "", specialties: [], hourlyRate: 700 });
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  const toggleSpec = (s: string) => setForm((f) => ({ ...f, specialties: f.specialties.includes(s) ? f.specialties.filter((x) => x !== s) : [...f.specialties, s] }));

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const res = await createTechnicianAction(form);
      if (!res.ok) { setError(res.error ?? "No se pudo guardar."); return; }
      router.refresh(); onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2">
        <form onSubmit={submit} className="glass-card max-h-[88vh] overflow-y-auto p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Nuevo técnico</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <input required placeholder="Nombre completo *" className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Cédula" className={field} value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
              <input required placeholder="Teléfono *" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <input placeholder="Dirección" className={field} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div>
              <label className="mb-1 block text-xs text-slate-400">Tarifa por hora (RD$)</label>
              <input type="number" min={0} className={cn(field, "sm:max-w-[180px]")} value={form.hourlyRate || ""} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-slate-400">Especialidades</label>
              <div className="flex flex-wrap gap-2">
                {SPECIALTIES.map((s) => (
                  <button type="button" key={s} onClick={() => toggleSpec(s)} className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors", form.specialties.includes(s) ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400")}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Guardando…" : "Guardar técnico"}</button>
          </div>
        </form>
      </motion.div>
    </>
  );
}
