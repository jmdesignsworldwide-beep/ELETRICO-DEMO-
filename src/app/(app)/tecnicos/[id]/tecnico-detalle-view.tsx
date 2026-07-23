"use client";

import { useState, useRef, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Save, Trash2, Loader2, Upload, User, Award, Plus, X, Clock,
  Calculator, FileText, Package, CalendarDays, AlertTriangle,
} from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Badge } from "@/components/ui/badge";
import { orderStatusLabel, orderStatusStyle } from "@/lib/labels";
import { formatRD, formatDate, daysUntil, cn } from "@/lib/utils";
import type { TechnicianDetail } from "@/lib/types";
import {
  updateTechnicianAction, deleteTechnicianAction, addCertificationAction,
  deleteCertificationAction, registerWorklogAction, uploadTechnicianPhotoAction,
  SPECIALTIES, type TechnicianInput,
} from "@/app/actions/technicians";

export function TecnicoDetalleView({ tech }: { tech: TechnicianDetail }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <Reveal>
        <Link href="/tecnicos" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-600 dark:text-slate-400"><ArrowLeft className="h-4 w-4" /> Volver a técnicos</Link>
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Reveal delay={0.03}><PhotoCard tech={tech} /></Reveal>
          <Reveal delay={0.05}><PayrollCard tech={tech} /></Reveal>
          <Reveal delay={0.06}><MaterialsCard tech={tech} /></Reveal>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Reveal delay={0.04}><ProfileForm tech={tech} onDone={() => router.refresh()} /></Reveal>
          <Reveal delay={0.05}><CertsCard tech={tech} onDone={() => router.refresh()} /></Reveal>
          <Reveal delay={0.06}><WorklogCard tech={tech} onDone={() => router.refresh()} /></Reveal>
          <Reveal delay={0.07}><AssignedOrders tech={tech} /></Reveal>
        </div>
      </div>
    </div>
  );
}

function PhotoCard({ tech }: { tech: TechnicianDetail }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setError(null);
    const fd = new FormData(); fd.append("file", file);
    startTransition(async () => {
      const res = await uploadTechnicianPhotoAction(tech.id, fd);
      if (!res.ok) { setError(res.error ?? "No se pudo subir."); return; }
      router.refresh();
    });
  }

  return (
    <div className="glass-card overflow-hidden p-0">
      <div className="relative aspect-square bg-slate-100 dark:bg-white/[0.03]">
        {tech.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={tech.photoUrl} alt={tech.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600"><User className="h-16 w-16" /><span className="text-xs">Sin foto</span></div>
        )}
      </div>
      <div className="p-3">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
        <button onClick={() => inputRef.current?.click()} disabled={pending} className="btn-ghost w-full py-2 text-xs">{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}{tech.photoUrl ? "Cambiar foto" : "Subir foto"}</button>
        {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}

function ProfileForm({ tech, onDone }: { tech: TechnicianDetail; onDone: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [delPending, startDelete] = useTransition();
  const [confirmDel, setConfirmDel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<TechnicianInput>({
    name: tech.name, cedula: tech.cedula ?? "", phone: tech.phone, address: tech.address ?? "",
    specialties: tech.specialties, hourlyRate: tech.hourlyRate,
  });
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";
  const toggleSpec = (s: string) => setForm((f) => ({ ...f, specialties: f.specialties.includes(s) ? f.specialties.filter((x) => x !== s) : [...f.specialties, s] }));

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setSaved(false);
    startTransition(async () => {
      const res = await updateTechnicianAction(tech.id, form);
      if (!res.ok) { setError(res.error ?? "No se pudo guardar."); return; }
      setSaved(true); onDone(); setTimeout(() => setSaved(false), 2000);
    });
  }
  function remove() {
    startDelete(async () => {
      const res = await deleteTechnicianAction(tech.id);
      if (!res.ok) { setError(res.error ?? "No se pudo eliminar."); setConfirmDel(false); return; }
      router.push("/tecnicos"); router.refresh();
    });
  }

  const allSpecs = Array.from(new Set([...SPECIALTIES, ...tech.specialties]));

  return (
    <form onSubmit={submit} className="glass-card p-5">
      <h3 className="mb-4 font-semibold">Perfil del técnico</h3>
      <div className="space-y-3">
        <input required className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2">
          <input placeholder="Cédula" className={field} value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
          <input required placeholder="Teléfono" className={field} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <input placeholder="Dirección" className={field} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <div><label className="mb-1 block text-xs text-slate-400">Tarifa por hora</label><input type="number" min={0} className={cn(field, "sm:max-w-[180px]")} value={form.hourlyRate || ""} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} /></div>
        <div>
          <label className="mb-1.5 block text-xs text-slate-400">Especialidades</label>
          <div className="flex flex-wrap gap-2">
            {allSpecs.map((s) => (<button type="button" key={s} onClick={() => toggleSpec(s)} className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium", form.specialties.includes(s) ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400")}>{s}</button>))}
          </div>
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="mt-4 flex items-center justify-between">
        <button type="button" onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:underline dark:text-red-400"><Trash2 className="h-4 w-4" /> Eliminar</button>
        <button type="submit" disabled={pending} className="btn-primary">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saved ? "Guardado ✓" : pending ? "Guardando…" : "Guardar"}</button>
      </div>

      <AnimatePresence>
        {confirmDel && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDel(false)} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2">
              <div className="glass-card p-6 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-red-500/10 text-red-500"><Trash2 className="h-6 w-6" /></div>
                <h3 className="font-semibold">¿Eliminar a “{tech.name}”?</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Esta acción no se puede deshacer.</p>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => setConfirmDel(false)} className="btn-ghost flex-1">Cancelar</button>
                  <button type="button" onClick={remove} disabled={delPending} className="btn-primary flex-1" style={{ background: "#ef4444", color: "#fff" }}>{delPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}Eliminar</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </form>
  );
}

function CertsCard({ tech, onDone }: { tech: TechnicianDetail; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const field = "rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  function add() {
    setError(null);
    if (name.trim().length < 2) { setError("Nombre requerido."); return; }
    startTransition(async () => {
      const res = await addCertificationAction(tech.id, name, exp);
      if (!res.ok) { setError(res.error ?? "No se pudo agregar."); return; }
      setName(""); setExp(""); onDone();
    });
  }
  function del(id: string) {
    startTransition(async () => { await deleteCertificationAction(id, tech.id); onDone(); });
  }

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Award className="h-5 w-5 text-volt-500" />Certificaciones</h3>
      {tech.certs.length === 0 ? (
        <p className="mb-3 text-sm text-slate-400">Sin certificaciones registradas.</p>
      ) : (
        <div className="mb-4 space-y-2">
          {tech.certs.map((c) => {
            const days = c.expiresAt ? daysUntil(c.expiresAt) : null;
            const expired = days !== null && days < 0;
            const soon = days !== null && days >= 0 && days <= 30;
            return (
              <div key={c.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-white/[0.03]">
                <Award className="h-4 w-4 shrink-0 text-volt-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.name}</p>
                  {c.expiresAt && <p className="text-xs text-slate-400">Vence {formatDate(c.expiresAt)}</p>}
                </div>
                {expired && <Badge className="bg-red-50 text-red-700 ring-red-500/25 dark:bg-red-500/15 dark:text-red-300"><AlertTriangle className="h-3 w-3" />Vencida</Badge>}
                {soon && <Badge className="bg-amber-50 text-amber-700 ring-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300"><AlertTriangle className="h-3 w-3" />{days}d</Badge>}
                <button onClick={() => del(c.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500"><X className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06] sm:flex-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre de la certificación" className={cn(field, "min-w-0 flex-1")} />
        <input type="date" value={exp} onChange={(e) => setExp(e.target.value)} className={field} />
        <button onClick={add} disabled={pending} className="btn-primary px-4 py-2 text-sm">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Agregar</button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

function WorklogCard({ tech, onDone }: { tech: TechnicianDetail; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const [hours, setHours] = useState(8);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const field = "rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";

  function add() {
    setError(null);
    startTransition(async () => {
      const res = await registerWorklogAction(tech.id, hours, note);
      if (!res.ok) { setError(res.error ?? "No se pudo registrar."); return; }
      setNote(""); setHours(8); onDone();
    });
  }

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Clock className="h-5 w-5 text-volt-500" />Registro de horas</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input type="number" min={0.5} step="0.5" value={hours} onChange={(e) => setHours(Number(e.target.value))} className={cn(field, "w-24 text-center tabular-nums")} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nota (trabajo realizado)" className={cn(field, "min-w-0 flex-1")} />
        <button onClick={add} disabled={pending} className="btn-primary px-4 py-2 text-sm">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Registrar</button>
      </div>
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      {tech.worklog.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {tech.worklog.slice(0, 8).map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02]">
              <div className="min-w-0"><p className="truncate">{w.note ?? "Horas registradas"}</p><p className="text-xs text-slate-400">{formatDate(w.createdAt)}{w.orderNumber && ` · ${w.orderNumber}`}</p></div>
              <span className="shrink-0 font-semibold tabular-nums text-volt-600 dark:text-volt-400">{w.hours}h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PayrollCard({ tech }: { tech: TechnicianDetail }) {
  const [period, setPeriod] = useState<"semanal" | "quincenal">("quincenal");
  const [bonus, setBonus] = useState(0);
  const [deduct, setDeduct] = useState(0);
  const days = period === "semanal" ? 7 : 15;

  const hours = useMemo(() => {
    const since = Date.now() - days * 86_400_000;
    return tech.worklog.filter((w) => new Date(w.createdAt).getTime() >= since).reduce((s, w) => s + w.hours, 0);
  }, [tech.worklog, days]);

  const gross = hours * tech.hourlyRate;
  const net = gross + bonus - deduct;
  const field = "rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]";
  const volanteUrl = `/volante/${tech.id}?period=${period}&bonus=${bonus}&deduct=${deduct}`;

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Calculator className="h-5 w-5 text-volt-500" />Nómina</h3>
      <div className="mb-3 flex gap-2">
        {(["semanal", "quincenal"] as const).map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={cn("flex-1 rounded-lg py-2 text-sm font-medium capitalize", period === p ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400")}>{p}</button>
        ))}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span className="text-slate-500">Horas ({days}d)</span><span className="tabular-nums font-medium">{hours}h</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Bruto (×{formatRD(tech.hourlyRate, { decimals: false })})</span><span className="tabular-nums">{formatRD(gross, { decimals: false })}</span></div>
        <div className="flex items-center justify-between gap-2"><span className="text-slate-500">Bonificación</span><input type="number" min={0} value={bonus || ""} onChange={(e) => setBonus(Number(e.target.value))} className={cn(field, "w-24 text-right tabular-nums")} /></div>
        <div className="flex items-center justify-between gap-2"><span className="text-slate-500">Deducciones</span><input type="number" min={0} value={deduct || ""} onChange={(e) => setDeduct(Number(e.target.value))} className={cn(field, "w-24 text-right tabular-nums")} /></div>
      </div>
      <div className="mt-3 rounded-xl bg-volt-500/10 p-3 ring-1 ring-inset ring-volt-500/20">
        <p className="text-xs text-slate-500 dark:text-slate-400">Neto a pagar</p>
        <p className="text-2xl font-bold tabular-nums text-volt-600 dark:text-volt-400">{formatRD(net)}</p>
      </div>
      <a href={volanteUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-3 w-full py-2 text-sm"><FileText className="h-4 w-4" />Generar volante PDF</a>
    </div>
  );
}

function MaterialsCard({ tech }: { tech: TechnicianDetail }) {
  if (tech.materialsUsed.length === 0) return null;
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><Package className="h-5 w-5 text-volt-500" />Materiales usados</h3>
      <div className="space-y-1.5">
        {tech.materialsUsed.slice(0, 8).map((m) => (
          <div key={m.name} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-white/[0.02]">
            <span className="truncate pr-2">{m.name}</span>
            <span className="shrink-0 font-semibold tabular-nums">{m.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignedOrders({ tech }: { tech: TechnicianDetail }) {
  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold"><CalendarDays className="h-5 w-5 text-volt-500" />Órdenes asignadas</h3>
      {tech.assignedOrders.length === 0 ? (
        <p className="py-2 text-sm text-slate-400">Sin órdenes asignadas.</p>
      ) : (
        <div className="space-y-2">
          {tech.assignedOrders.map((o) => (
            <Link key={o.id} href={`/ordenes/${o.id}`} className="flex items-center justify-between rounded-lg px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]">
              <div className="min-w-0"><p className="truncate text-sm font-medium">{o.clientName}</p><p className="font-mono text-xs text-slate-400">{o.number} · {formatDate(o.scheduledDate)}</p></div>
              <Badge className={orderStatusStyle[o.status as keyof typeof orderStatusStyle] ?? ""}>{orderStatusLabel[o.status as keyof typeof orderStatusLabel] ?? o.status}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
