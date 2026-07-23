"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Zap } from "lucide-react";
import { Stagger, StaggerItem, Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";

interface Work {
  id: string;
  title: string;
  category: string;
  client: string;
  before: string; // gradiente CSS
  after: string;
  favorite: boolean;
}

const works: Work[] = [
  { id: "w1", title: "Sistema solar 5kW", category: "Paneles solares", client: "Sr. Amparo Guzmán", before: "from-slate-600 to-slate-800", after: "from-volt-400 to-amber-600", favorite: true },
  { id: "w2", title: "Tablero trifásico 400A", category: "Breakers / paneles", client: "Supermercado La Cadena", before: "from-red-800 to-slate-900", after: "from-sky-500 to-blue-700", favorite: true },
  { id: "w3", title: "CCTV 16 canales", category: "Cámaras", client: "Hotel Villa Serena", before: "from-neutral-600 to-neutral-800", after: "from-emerald-500 to-teal-700", favorite: false },
  { id: "w4", title: "Instalación A/A dual", category: "Aire acondicionado", client: "Residencial Los Cacicazgos", before: "from-stone-500 to-stone-700", after: "from-cyan-400 to-sky-600", favorite: false },
  { id: "w5", title: "Cargador vehículo eléctrico", category: "Instalación nueva", client: "Dra. Mariela Fernández", before: "from-zinc-600 to-zinc-800", after: "from-volt-500 to-yellow-600", favorite: true },
  { id: "w6", title: "Subestación 500 KVA", category: "Certificación", client: "Industrias Metálicas del Caribe", before: "from-amber-900 to-neutral-900", after: "from-indigo-500 to-violet-700", favorite: false },
];

const categories = ["Todos", ...Array.from(new Set(works.map((w) => w.category)))];

export default function PortafolioPage() {
  const [cat, setCat] = useState("Todos");
  const [favsOnly, setFavsOnly] = useState(false);

  const filtered = works.filter(
    (w) => (cat === "Todos" || w.category === cat) && (!favsOnly || w.favorite)
  );

  return (
    <div className="space-y-6">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Galería antes/después · vinculada a la orden que la generó
            </p>
            <h2 className="text-2xl font-bold tracking-tight">Portafolio de trabajos</h2>
          </div>
          <button
            onClick={() => setFavsOnly((v) => !v)}
            className={cn("btn-ghost", favsOnly && "ring-2 ring-volt-500/40")}
          >
            <Star className={cn("h-4 w-4", favsOnly && "fill-volt-500 text-volt-500")} />
            Favoritos
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.04}>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                cat === c
                  ? "bg-volt-500 text-ink-950"
                  : "border border-slate-200 text-slate-500 hover:text-ink-900 dark:border-white/10 dark:text-slate-400"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </Reveal>

      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w) => (
          <StaggerItem key={w.id}>
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="glass-card group overflow-hidden p-0 transition-shadow hover:shadow-card-light-hover"
            >
              <div className="grid grid-cols-2">
                <div className={cn("relative flex aspect-square items-end bg-gradient-to-br p-2", w.before)}>
                  <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    Antes
                  </span>
                </div>
                <div className={cn("relative flex aspect-square items-end justify-end bg-gradient-to-br p-2", w.after)}>
                  <Zap className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-white/70" fill="currentColor" />
                  <span className="rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                    Después
                  </span>
                </div>
              </div>
              <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                  <h3 className="truncate font-semibold leading-tight">{w.title}</h3>
                  <p className="text-xs text-volt-600 dark:text-volt-400">{w.category}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{w.client}</p>
                </div>
                {w.favorite && (
                  <Star className="h-4 w-4 shrink-0 fill-volt-500 text-volt-500" />
                )}
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
