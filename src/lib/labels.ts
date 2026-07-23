import type {
  OrderStatus,
  ServiceType,
  Priority,
  QuoteStatus,
  InvoiceStatus,
  PropertyType,
} from "./types";

export const orderStatusLabel: Record<OrderStatus, string> = {
  recibida: "Recibida",
  asignada: "Asignada",
  en_proceso: "En proceso",
  esperando_materiales: "Esperando materiales",
  esperando_aprobacion: "Esperando aprobación",
  completada: "Completada",
  facturada: "Facturada",
  pagada: "Pagada",
  cancelada: "Cancelada",
};

/** Clases de color por estado — funcionan en ambos temas. */
export const orderStatusStyle: Record<OrderStatus, string> = {
  recibida:
    "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300 ring-slate-500/20",
  asignada:
    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 ring-blue-500/25",
  en_proceso:
    "bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 ring-sky-500/25",
  esperando_materiales:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-500/25",
  esperando_aprobacion:
    "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300 ring-orange-500/25",
  completada:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-emerald-500/25",
  facturada:
    "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300 ring-violet-500/25",
  pagada:
    "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300 ring-green-500/25",
  cancelada:
    "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300 ring-red-500/25",
};

export const serviceTypeLabel: Record<ServiceType, string> = {
  instalacion_nueva: "Instalación nueva",
  reparacion: "Reparación",
  mantenimiento: "Mantenimiento preventivo",
  paneles_solares: "Paneles solares",
  aire_acondicionado: "Instalación de A/A",
  camaras: "Cámaras de seguridad",
  alarmas: "Alarmas",
  tomacorrientes: "Tomacorrientes / interruptores",
  breakers: "Breakers / paneles",
  diagnostico: "Diagnóstico / inspección",
  certificacion: "Certificación eléctrica",
  emergencia: "Emergencia",
  otro: "Otro",
};

export const priorityLabel: Record<Priority, string> = {
  normal: "Normal",
  urgente: "Urgente",
  emergencia: "Emergencia",
};

export const priorityStyle: Record<Priority, string> = {
  normal:
    "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 ring-slate-500/20",
  urgente:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-500/25",
  emergencia:
    "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300 ring-red-500/30",
};

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  vencida: "Vencida",
};

export const quoteStatusStyle: Record<QuoteStatus, string> = {
  borrador:
    "bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300 ring-slate-500/20",
  enviada:
    "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 ring-blue-500/25",
  aprobada:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-emerald-500/25",
  rechazada:
    "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300 ring-red-500/25",
  vencida:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-500/25",
};

export const invoiceStatusLabel: Record<InvoiceStatus, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  anulada: "Anulada",
};

export const invoiceStatusStyle: Record<InvoiceStatus, string> = {
  pendiente:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 ring-amber-500/25",
  pagada:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ring-emerald-500/25",
  anulada:
    "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300 ring-red-500/25",
};

export const propertyTypeLabel: Record<PropertyType, string> = {
  residencial: "Residencial",
  comercial: "Comercial",
  industrial: "Industrial",
};
