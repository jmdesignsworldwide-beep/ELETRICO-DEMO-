"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { CountUp } from "@/components/ui/count-up";
import { StaggerItem } from "@/components/ui/reveal";

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  format?: (n: number) => string;
  trend?: string;
  accent?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  href,
  format,
  trend,
  accent = "text-volt-500",
}: KpiCardProps) {
  return (
    <StaggerItem>
      <Link href={href}>
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="glass-card group relative overflow-hidden p-5 transition-shadow hover:shadow-card-light-hover"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-volt-500/10 ring-1 ring-inset ring-volt-500/20">
              <Icon className={`h-5 w-5 ${accent}`} />
            </div>
            <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-volt-500 dark:text-slate-600" />
          </div>
          <div className="kpi-value">
            <CountUp value={value} format={format} />
          </div>
          <div className="mt-1 flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
            {trend && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {trend}
              </span>
            )}
          </div>
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-volt-500/5 blur-2xl transition-opacity group-hover:opacity-100" />
        </motion.div>
      </Link>
    </StaggerItem>
  );
}
