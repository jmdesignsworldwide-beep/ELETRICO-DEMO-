"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const [name, setName] = useState("Marien");

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("jm-user");
      if (stored) setName(stored);
      sessionStorage.setItem("jm-welcomed", "1");
    } catch {}

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Fail-safe: si algo falla, igual entra al dashboard.
    const delay = reduce ? 400 : 2900;
    const t = setTimeout(() => router.push("/dashboard"), delay);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="app-bg relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Aurora */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt-500/25 blur-[130px]"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: [0, 0.9, 0.6], scale: [0.8, 1.1, 1] }}
        transition={{ duration: 2.4, ease: "easeOut" }}
      />

      <div className="relative flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 160, damping: 12, delay: 0.2 }}
          className="mb-7 grid h-20 w-20 place-items-center rounded-3xl bg-volt-gradient text-ink-950 shadow-glow-lg"
        >
          <Zap className="h-10 w-10" fill="currentColor" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-sm font-medium uppercase tracking-[0.28em] text-slate-400"
        >
          Bienvenida de nuevo
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20, filter: "blur(16px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.9, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-3 text-5xl font-bold tracking-tight sm:text-7xl"
        >
          <span className="bg-volt-gradient bg-clip-text text-transparent">{name}</span>
        </motion.h1>

        {/* Cortina de revelado */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 0.9, delay: 1.4, ease: [0.76, 0, 0.24, 1] }}
          style={{ transformOrigin: "right" }}
          className="mt-8 h-px w-56 origin-right bg-gradient-to-r from-transparent via-volt-500 to-transparent"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.7 }}
          className="mt-6 text-sm text-slate-400"
        >
          Preparando tu panel de control…
        </motion.p>
      </div>
    </main>
  );
}
