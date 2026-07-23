import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea a Peso Dominicano con separador de miles. */
export function formatRD(amount: number, opts?: { decimals?: boolean }): string {
  const decimals = opts?.decimals ?? true;
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  })
    .format(amount)
    .replace("DOP", "RD$")
    .replace("RD$ ", "RD$ ");
}

/** Número con separador de miles, sin símbolo de moneda. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat("es-DO").format(n);
}

/** Fecha en formato dominicano DD/MM/AAAA. */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

export function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/** Diferencia en días entre una fecha y hoy (negativo = vencida). */
export function daysUntil(date: string | Date): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export const ITBIS_RATE = 0.18;

/** Calcula ITBIS 18% sobre un subtotal. */
export function calcITBIS(subtotal: number): number {
  return Math.round(subtotal * ITBIS_RATE * 100) / 100;
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
