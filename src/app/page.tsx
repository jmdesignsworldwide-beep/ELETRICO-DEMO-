"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { Mail as MailIcon, MessageCircle, Instagram } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("marien@jmelectric.do");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Demo: en producción esto llama a supabase.auth.signInWithPassword.
    const name = "Marien";
    try {
      sessionStorage.setItem("jm-user", name);
      sessionStorage.removeItem("jm-welcomed");
    } catch {}
    setTimeout(() => router.push("/bienvenida"), 650);
  }

  return (
    <main className="app-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Aurora amarilla de fondo */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-[-20%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-volt-500/20 blur-[120px]"
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.06, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.02)_100%)] dark:bg-[radial-gradient(circle_at_50%_0%,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
            className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-volt-gradient text-ink-950 shadow-glow-lg"
          >
            <Zap className="h-8 w-8" fill="currentColor" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            JM <span className="bg-volt-gradient bg-clip-text text-transparent">Electric</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Sistema integral de gestión eléctrica
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-7">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Correo
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-volt-400 focus:ring-2 focus:ring-volt-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                  placeholder="tu@correo.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white/70 py-2.5 pl-10 pr-3 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-volt-400 focus:ring-2 focus:ring-volt-500/30 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-100"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? "Ingresando…" : "Iniciar sesión"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-volt-500" />
            Protegido con seguridad Fort Knox · RLS + FORCE
          </div>
        </form>

        <p className="mt-5 text-center text-xs text-slate-400">
          Credenciales de demo precargadas — solo presiona iniciar sesión.
        </p>
      </motion.div>

      {/* Crédito JM Nexus */}
      <div className="relative mt-10 flex items-center gap-2 text-xs text-slate-400">
        <span>Diseñado por</span>
        <span className="font-semibold text-ink-700 dark:text-slate-300">JM Nexus Designs</span>
        <span className="text-slate-300 dark:text-white/20">·</span>
        <a href="mailto:jm.nexus.designs@gmail.com" aria-label="Correo" className="hover:text-volt-500">
          <MailIcon className="h-3.5 w-3.5" />
        </a>
        <a href="https://wa.me/18494421919" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="hover:text-volt-500">
          <MessageCircle className="h-3.5 w-3.5" />
        </a>
        <a href="https://instagram.com/jm.nexus.designs" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-volt-500">
          <Instagram className="h-3.5 w-3.5" />
        </a>
      </div>
    </main>
  );
}
