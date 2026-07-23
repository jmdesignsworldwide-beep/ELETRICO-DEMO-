"use client";

import { useState, useRef, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Plus, X, Loader2, Eye, EyeOff, Trash2, Upload, Presentation, Pencil } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { BeforeAfter } from "@/components/before-after";
import { serviceTypeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { PortfolioWork, Technician } from "@/lib/types";
import {
  createWorkAction, updateWorkAction, toggleWorkFlagAction, deleteWorkAction,
  uploadWorkPhotoAction, type WorkInput,
} from "@/app/actions/portfolio";

export function PortafolioView({ works, technicians }: { works: PortfolioWork[]; technicians: Technician[] }) {
  const [cat, setCat] = useState("Todos");
  const [tech, setTech] = useState("todos");
  const [favsOnly, setFavsOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const categories = useMemo(() => ["Todos", ...Array.from(new Set(works.map((w) => w.categoryLabel)))], [works]);
  const filtered = works.filter((w) =>
    (cat === "Todos" || w.categoryLabel === cat) &&
    (tech === "todos" || w.technicianId === tech) &&
    (!favsOnly || w.favorite)
  );

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{works.length} trabajos · {works.filter((w) => w.favorite).length} favoritos</p>
            <h2 className="text-2xl font-bold tracking-tight">Portafolio de trabajos</h2>
          </div>
          <div className="flex gap-2">
            <a href="/presentacion" target="_blank" rel="noopener noreferrer" className="btn-ghost"><Presentation className="h-4 w-4" />Presentación</a>
            <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="h-4 w-4" />Nuevo trabajo</button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={cn("shrink-0 rounded-lg px-3 py-2 text-sm font-medium", cat === c ? "bg-volt-500 text-ink-950" : "border border-slate-200 text-slate-500 dark:border-white/10 dark:text-slate-400")}>{c}</button>
            ))}
          </div>
          <div className="flex gap-2">
            <select value={tech} onChange={(e) => setTech(e.target.value)} className="rounded-lg border border-slate-200 bg-white/70 px-2.5 py-2 text-sm outline-none focus:border-volt-400 dark:border-white/10 dark:bg-white/[0.04]">
              <option value="todos">Todos los técnicos</option>
              {technicians.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
            </select>
            <button onClick={() => setFavsOnly((v) => !v)} className={cn("btn-ghost shrink-0", favsOnly && "ring-2 ring-volt-500/40")}><Star className={cn("h-4 w-4", favsOnly && "fill-volt-500 text-volt-500")} />Favoritos</button>
          </div>
        </div>
      </Reveal>

      {works.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">Aún no hay trabajos. Crea el primero o aplica la migración con el seed.</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400">No hay trabajos con estos filtros.</div>
      ) : (
        <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => <StaggerItem key={w.id}><WorkCard work={w} /></StaggerItem>)}
        </Stagger>
      )}

      <AnimatePresence>{modalOpen && <WorkModal onClose={() => setModalOpen(false)} />}</AnimatePresence>
    </div>
  );
}

function WorkCard({ work: w }: { work: PortfolioWork }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  function toggle(flag: "favorite" | "visible") {
    startTransition(async () => { await toggleWorkFlagAction(w.id, flag, !(flag === "favorite" ? w.favorite : w.visible)); router.refresh(); });
  }
  function remove() {
    startTransition(async () => { await deleteWorkAction(w.id); router.refresh(); });
  }
  function upload(kind: "before" | "after", file?: File) {
    if (!file) return;
    const fd = new FormData(); fd.append("file", file);
    startTransition(async () => { await uploadWorkPhotoAction(w.id, kind, fd); router.refresh(); });
  }

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className={cn("glass-card overflow-hidden p-0", !w.visible && "opacity-60")}>
      <BeforeAfter id={w.id} beforeUrl={w.beforeUrl} afterUrl={w.afterUrl} className="aspect-[4/3]" />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight">{w.title}</h3>
            <p className="text-xs text-volt-600 dark:text-volt-400">{w.categoryLabel}</p>
            {w.technicianName && <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{w.technicianName}{w.orderNumber && ` · ${w.orderNumber}`}</p>}
          </div>
          <button onClick={() => toggle("favorite")} disabled={pending} className="shrink-0" aria-label="Favorito"><Star className={cn("h-5 w-5", w.favorite ? "fill-volt-500 text-volt-500" : "text-slate-300 dark:text-slate-600")} /></button>
        </div>
        {w.description && <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{w.description}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          <input ref={beforeRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload("before", e.target.files?.[0])} />
          <input ref={afterRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => upload("after", e.target.files?.[0])} />
          <button onClick={() => beforeRef.current?.click()} disabled={pending} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"><Upload className="h-3 w-3" />Antes</button>
          <button onClick={() => afterRef.current?.click()} disabled={pending} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"><Upload className="h-3 w-3" />Después</button>
          <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"><Pencil className="h-3 w-3" />Editar</button>
          <div className="ml-auto flex items-center gap-1">
            <button onClick={() => toggle("visible")} disabled={pending} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5" aria-label="Visibilidad">{w.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
            <button onClick={remove} disabled={pending} className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500" aria-label="Eliminar">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}</button>
          </div>
        </div>
      </div>
      <AnimatePresence>{editing && <WorkModal work={w} onClose={() => setEditing(false)} />}</AnimatePresence>
    </motion.div>
  );
}

function WorkModal({ work, onClose }: { work?: PortfolioWork; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<WorkInput>({ title: work?.title ?? "", description: work?.description ?? "", category: work?.category ?? "instalacion_nueva" });
  const field = "w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-500/25 dark:border-white/10 dark:bg-white/[0.04]";

  function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    startTransition(async () => {
      const res = work ? await updateWorkAction(work.id, form) : await createWorkAction(form);
      if (!res.ok) { setError(res.error ?? "No se pudo guardar."); return; }
      router.refresh(); onClose();
    });
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-50 bg-ink-950/60 backdrop-blur-sm" />
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 24, scale: 0.97 }} transition={{ type: "spring", stiffness: 320, damping: 30 }} className="fixed inset-0 z-50 m-auto h-fit max-h-[92vh] w-[92vw] max-w-md overflow-y-auto">
        <form onSubmit={submit} className="glass-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">{work ? "Editar trabajo" : "Nuevo trabajo"}</h3>
            <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"><X className="h-5 w-5" /></button>
          </div>
          <div className="space-y-3">
            <input required placeholder="Título del trabajo *" className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className={field} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(serviceTypeLabel).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
            <textarea rows={3} placeholder="Descripción del trabajo" className={field} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          {error && <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancelar</button>
            <button type="submit" disabled={pending} className="btn-primary">{pending && <Loader2 className="h-4 w-4 animate-spin" />}{pending ? "Guardando…" : "Guardar"}</button>
          </div>
          {!work && <p className="mt-3 text-center text-xs text-slate-400">Luego sube las fotos de antes/después desde la tarjeta.</p>}
        </form>
      </motion.div>
    </>
  );
}
