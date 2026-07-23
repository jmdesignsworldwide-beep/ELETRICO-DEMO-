"use client";

import { motion } from "framer-motion";
import { Zap, Clock, Mail, MessageCircle, Instagram } from "lucide-react";

export default function ExpiradoPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-4 py-10 text-white">
      <motion.div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt-500/15 blur-[130px]" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

      <motion.div initial={{ opacity: 0, y: 24, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7 }} className="relative w-full max-w-md text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.15 }} className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-volt-gradient text-ink-950 shadow-glow-lg">
          <Clock className="h-8 w-8" />
        </motion.div>

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tu acceso de demostración ha expirado</h1>
        <p className="mt-3 text-sm text-slate-400">Contacta a <span className="font-semibold text-volt-500">JM Nexus Designs</span> para renovarlo y seguir explorando el sistema.</p>

        <div className="mt-8 space-y-3">
          <a href="mailto:jm.nexus.designs@gmail.com" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-volt-500/40 hover:bg-volt-500/5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-volt-500/10 text-volt-500"><Mail className="h-5 w-5" /></span>
            <div><p className="text-sm font-medium">Correo</p><p className="text-xs text-slate-400">jm.nexus.designs@gmail.com</p></div>
          </a>
          <a href="https://wa.me/18494421919" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-volt-500/40 hover:bg-volt-500/5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-volt-500/10 text-volt-500"><MessageCircle className="h-5 w-5" /></span>
            <div><p className="text-sm font-medium">WhatsApp</p><p className="text-xs text-slate-400">+1 849 442 1919</p></div>
          </a>
          <a href="https://instagram.com/jm.nexus.designs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-volt-500/40 hover:bg-volt-500/5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-volt-500/10 text-volt-500"><Instagram className="h-5 w-5" /></span>
            <div><p className="text-sm font-medium">Instagram</p><p className="text-xs text-slate-400">@jm.nexus.designs</p></div>
          </a>
        </div>

        <a href="/" className="mt-8 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-volt-500">
          <Zap className="h-4 w-4" /> Volver al inicio
        </a>
      </motion.div>

      <p className="relative mt-10 text-xs text-slate-600">Diseñado por JM Nexus Designs</p>
    </main>
  );
}
