"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print fixed bottom-6 right-6 z-10 inline-flex items-center gap-2 rounded-xl bg-volt-gradient px-5 py-3 text-sm font-semibold text-ink-950 shadow-glow-lg transition-transform hover:scale-105"
    >
      <Printer className="h-4 w-4" />
      Imprimir / Guardar PDF
    </button>
  );
}
