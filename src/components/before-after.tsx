"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const GRADIENTS = [
  "from-slate-600 to-slate-800", "from-zinc-600 to-zinc-800", "from-neutral-600 to-neutral-800",
  "from-stone-500 to-stone-700", "from-red-800 to-slate-900",
];
const AFTER_GRADIENTS = [
  "from-volt-400 to-amber-600", "from-sky-500 to-blue-700", "from-emerald-500 to-teal-700",
  "from-cyan-400 to-sky-600", "from-indigo-500 to-violet-700",
];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function BeforeAfter({
  id, beforeUrl, afterUrl, className,
}: {
  id: string;
  beforeUrl?: string;
  afterUrl?: string;
  className?: string;
}) {
  const [pos, setPos] = useState(50);
  const g = hash(id);
  const beforeGrad = GRADIENTS[g % GRADIENTS.length];
  const afterGrad = AFTER_GRADIENTS[g % AFTER_GRADIENTS.length];

  return (
    <div className={cn("relative select-none overflow-hidden", className)}>
      {/* Después (base) */}
      <Layer url={afterUrl} grad={afterGrad} label="Después" labelRight after />
      {/* Antes (encima, recortado por el deslizador) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Layer url={beforeUrl} grad={beforeGrad} label="Antes" />
      </div>

      {/* Divisor */}
      <div className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-white/90 shadow-lg" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -left-3.5 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white text-ink-900 shadow-lg">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 7l-5 5 5 5M16 7l5 5-5 5" /></svg>
        </div>
      </div>

      <input
        type="range" min={0} max={100} value={pos} onChange={(e) => setPos(Number(e.target.value))}
        aria-label="Comparar antes y después"
        className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

function Layer({ url, grad, label, labelRight, after }: { url?: string; grad: string; label: string; labelRight?: boolean; after?: boolean }) {
  return (
    <div className={cn("absolute inset-0 flex items-end bg-gradient-to-br", !url && grad, labelRight ? "justify-end" : "justify-start")}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      ) : (
        after && <Zap className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/60" fill="currentColor" />
      )}
      <span className="relative m-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">{label}</span>
    </div>
  );
}
