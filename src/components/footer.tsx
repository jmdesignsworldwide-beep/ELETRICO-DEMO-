import { Mail, MessageCircle, Instagram } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200/70 px-4 py-6 dark:border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} JM Electric — Sistema de gestión.{" "}
          <span className="hidden sm:inline">Demo profesional.</span>
        </p>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium">Diseñado por</span>
          <span className="font-semibold text-ink-800 dark:text-slate-200">
            JM Nexus Designs
          </span>
          <span className="mx-1 text-slate-300 dark:text-white/20">·</span>
          <div className="flex items-center gap-1">
            <a
              href="mailto:jm.nexus.designs@gmail.com"
              aria-label="Correo de JM Nexus Designs"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-volt-500/10 hover:text-volt-600 dark:text-slate-400 dark:hover:text-volt-400"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/18494421919"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp de JM Nexus Designs"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-volt-500/10 hover:text-volt-600 dark:text-slate-400 dark:hover:text-volt-400"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com/jm.nexus.designs"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de JM Nexus Designs"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-volt-500/10 hover:text-volt-600 dark:text-slate-400 dark:hover:text-volt-400"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
