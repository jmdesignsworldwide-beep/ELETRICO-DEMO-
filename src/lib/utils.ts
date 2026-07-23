import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Zona horaria fija de RD (UTC-4, sin horario de verano). Fijarla evita que el
// servidor (UTC) y el cliente (navegador) rendericen fechas distintas → sin
// desajuste de hidratación.
const RD_TZ = "America/Santo_Domingo";

// Agrupación de miles determinista: "en-US" produce siempre "1,234.56"
// (coma para miles, punto para decimales — igual que la convención dominicana)
// tanto en Node como en el navegador. Usar "es-DO" con estilo currency insertaba
// un espacio que varía entre runtimes (espacio normal vs. U+00A0/U+202F) y rompía
// la hidratación de forma intermitente.
const groupFmt = (decimals: boolean) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: decimals ? 2 : 0,
  });

/** Formatea a Peso Dominicano con separador de miles. Salida idéntica en servidor y cliente. */
export function formatRD(amount: number, opts?: { decimals?: boolean }): string {
  const decimals = opts?.decimals ?? true;
  const n = Number.isFinite(amount) ? amount : 0;
  const sign = n < 0 ? "-" : "";
  return `${sign}RD$ ${groupFmt(decimals).format(Math.abs(n))}`;
}

/** Número con separador de miles, sin símbolo de moneda. */
export function formatNumber(n: number): string {
  return groupFmt(false).format(Number.isFinite(n) ? n : 0);
}

/** Fecha en formato dominicano DD/MM/AAAA, anclada a la zona horaria de RD. */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: RD_TZ,
  }).format(d);
}

export function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-DO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: RD_TZ,
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
