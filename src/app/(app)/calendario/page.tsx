"use client";

import { useMemo } from "react";
import { Reveal } from "@/components/ui/reveal";
import { serviceOrders } from "@/lib/demo-data";
import { serviceTypeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// Color por estado según el prompt.
function eventColor(status: string): string {
  if (["completada", "pagada", "facturada"].includes(status)) return "bg-emerald-500";
  if (status === "cancelada") return "bg-slate-400";
  if (status === "en_proceso") return "bg-sky-500";
  if (status === "recibida" || status === "esperando_materiales") return "bg-red-500";
  return "bg-volt-500";
}

export default function CalendarioPage() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const { cells, todayEvents } = useMemo(() => {
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const eventsByDay: Record<number, typeof serviceOrders> = {};
    for (const o of serviceOrders) {
      const d = new Date(o.scheduledDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        (eventsByDay[day] ??= []).push(o);
      }
    }

    const cells: { day: number | null; events: typeof serviceOrders }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ day: null, events: [] });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, events: eventsByDay[d] ?? [] });

    return { cells, todayEvents: eventsByDay[today.getDate()] ?? [] };
  }, [year, month, today]);

  return (
    <div className="space-y-6">
      <Reveal>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Vista mensual · el técnico solo ve lo suyo · admin ve todo
          </p>
          <h2 className="text-2xl font-bold tracking-tight">
            {monthNames[month]} {year}
          </h2>
        </div>
      </Reveal>

      {/* Trabajo de hoy */}
      {todayEvents.length > 0 && (
        <Reveal delay={0.03}>
          <div className="glass-card p-4 ring-1 ring-inset ring-volt-500/20">
            <h3 className="mb-2 text-sm font-semibold text-volt-600 dark:text-volt-400">
              Trabajo de hoy ({todayEvents.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {todayEvents.map((o) => (
                <span key={o.id} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium dark:bg-white/[0.05]">
                  {o.number} · {o.clientName}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      <Reveal delay={0.05}>
        <div className="glass-card overflow-hidden p-3 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
            {dayNames.map((d) => (
              <div key={d} className="py-1 text-center text-xs font-semibold text-slate-400">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((cell, i) => {
              const isToday = cell.day === today.getDate();
              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[64px] rounded-lg border p-1.5 sm:min-h-[92px] sm:p-2",
                    cell.day === null
                      ? "border-transparent"
                      : "border-slate-100 dark:border-white/[0.05]",
                    isToday && "border-volt-500/40 bg-volt-500/5 ring-1 ring-inset ring-volt-500/30"
                  )}
                >
                  {cell.day && (
                    <>
                      <div
                        className={cn(
                          "mb-1 text-xs font-medium tabular-nums",
                          isToday ? "text-volt-600 dark:text-volt-400" : "text-slate-400"
                        )}
                      >
                        {cell.day}
                      </div>
                      <div className="space-y-1">
                        {cell.events.slice(0, 2).map((o) => (
                          <div
                            key={o.id}
                            title={`${o.number} · ${serviceTypeLabel[o.serviceType]}`}
                            className="flex items-center gap-1 truncate rounded px-1 py-0.5 text-[10px] font-medium text-white sm:text-xs"
                            style={{}}
                          >
                            <span className={cn("h-2 w-2 shrink-0 rounded-full", eventColor(o.status))} />
                            <span className="truncate text-slate-600 dark:text-slate-300">
                              {o.clientName.split(" ")[0]}
                            </span>
                          </div>
                        ))}
                        {cell.events.length > 2 && (
                          <div className="text-[10px] text-slate-400">+{cell.events.length - 2} más</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Leyenda */}
      <Reveal delay={0.07}>
        <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
          <Legend color="bg-volt-500" label="Programada" />
          <Legend color="bg-sky-500" label="En proceso" />
          <Legend color="bg-emerald-500" label="Completada" />
          <Legend color="bg-red-500" label="Vencida / emergencia" />
          <Legend color="bg-slate-400" label="Cancelada" />
        </div>
      </Reveal>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", color)} />
      {label}
    </span>
  );
}
