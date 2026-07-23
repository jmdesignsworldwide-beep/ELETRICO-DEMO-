import "server-only";

import { createServerSupabase, isSupabaseConfigured } from "./supabase/server";
import type {
  Client,
  Technician,
  ServiceOrder,
  InventoryItem,
  Quote,
  Invoice,
  ActivityEvent,
} from "./types";

// Capa de acceso a datos — única fuente de verdad, siempre desde Supabase.
// Si Supabase no está configurado (build/preview sin env), devuelve vacío
// para no romper el render; la data real vive sembrada en la base.

const OPEN_STATUSES = ["recibida", "asignada", "en_proceso", "esperando_materiales", "esperando_aprobacion"];

export async function getClients(): Promise<Client[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true });
  return (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    address: c.address ?? "",
    propertyType: c.property_type,
    panelType: c.panel_type ?? undefined,
    voltage: c.voltage ?? undefined,
    notes: c.notes ?? undefined,
    totalSpent: Number(c.total_spent ?? 0),
    serviceCount: c.service_count ?? 0,
    createdAt: c.created_at,
  }));
}

export async function getTechnicians(): Promise<
  (Technician & { hoursPeriod: number; payrollPeriod: number })[]
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase.from("technicians").select("*").order("name");
  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    specialties: t.specialties ?? [],
    certifications: t.certifications ?? [],
    activeOrders: t.active_orders ?? 0,
    hoursPeriod: t.hours_period ?? 0,
    payrollPeriod: Number(t.payroll_period ?? 0),
  }));
}

export async function getServiceOrders(): Promise<ServiceOrder[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const [{ data: orders }, { data: techs }] = await Promise.all([
    supabase.from("service_orders").select("*, clients(name)").order("scheduled_date"),
    supabase.from("technicians").select("id, name"),
  ]);
  const techMap = new Map((techs ?? []).map((t) => [t.id, t.name]));
  return (orders ?? []).map((o) => ({
    id: o.id,
    number: o.number,
    clientId: o.client_id,
    clientName: (o.clients as { name: string } | null)?.name ?? "Cliente",
    serviceType: o.service_type,
    status: o.status,
    priority: o.priority,
    technicianIds: o.technician_ids ?? [],
    technicianNames: (o.technician_ids ?? []).map((id: string) => techMap.get(id) ?? "").filter(Boolean),
    scheduledDate: o.scheduled_date,
    estimatedEndDate: o.estimated_end_date,
    description: o.description ?? "",
    address: o.address ?? "",
    total: Number(o.total ?? 0),
    createdAt: o.created_at,
  }));
}

export async function getOrder(id: string): Promise<import("./types").OrderDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const [{ data: o }, { data: mats }, { data: techs }] = await Promise.all([
    supabase.from("service_orders").select("*, clients(name)").eq("id", id).single(),
    supabase.from("order_materials").select("*").eq("order_id", id),
    supabase.from("technicians").select("id, name"),
  ]);
  if (!o) return null;
  const techMap = new Map((techs ?? []).map((t) => [t.id, t.name]));
  return {
    id: o.id,
    number: o.number,
    clientId: o.client_id,
    clientName: (o.clients as { name: string } | null)?.name ?? "Cliente",
    serviceType: o.service_type,
    status: o.status,
    priority: o.priority,
    technicianIds: o.technician_ids ?? [],
    technicianNames: (o.technician_ids ?? []).map((tid: string) => techMap.get(tid) ?? "").filter(Boolean),
    scheduledDate: o.scheduled_date,
    estimatedEndDate: o.estimated_end_date,
    description: o.description ?? "",
    address: o.address ?? "",
    total: Number(o.total ?? 0),
    createdAt: o.created_at,
    finalNotes: o.final_notes ?? undefined,
    recommendations: o.recommendations ?? undefined,
    closedAt: o.closed_at ?? undefined,
    quoteId: o.quote_id ?? undefined,
    invoiceId: o.invoice_id ?? undefined,
    materials: (mats ?? []).map((m) => ({
      id: m.id,
      inventoryId: m.inventory_id,
      name: m.name,
      qtyEstimated: m.qty_estimated ?? 0,
      qtyUsed: m.qty_used ?? 0,
      unitPrice: Number(m.unit_price ?? 0),
    })),
  };
}

export async function getInventory(): Promise<InventoryItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase.from("inventory").select("*").order("name");
  return (data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    category: i.category,
    sku: i.sku,
    costPrice: Number(i.cost_price ?? 0),
    salePrice: Number(i.sale_price ?? 0),
    stock: i.stock ?? 0,
    minStock: i.min_stock ?? 0,
    unit: i.unit ?? "unidad",
  }));
}

export async function getQuotes(): Promise<Quote[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("quotes")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });
  return (data ?? []).map((q) => ({
    id: q.id,
    number: q.number,
    clientId: q.client_id,
    clientName: (q.clients as { name: string } | null)?.name ?? "Cliente",
    status: q.status,
    subtotal: Number(q.subtotal ?? 0),
    discount: Number(q.discount ?? 0),
    itbis: Number(q.itbis ?? 0),
    total: Number(q.total ?? 0),
    createdAt: q.created_at,
    validUntil: q.valid_until,
  }));
}

export async function getInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("invoices")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });
  return (data ?? []).map((f) => ({
    id: f.id,
    number: f.number,
    ncf: f.ncf,
    clientId: f.client_id,
    clientName: (f.clients as { name: string } | null)?.name ?? "Cliente",
    status: f.status,
    subtotal: Number(f.subtotal ?? 0),
    itbis: Number(f.itbis ?? 0),
    total: Number(f.total ?? 0),
    paymentMethod: f.payment_method ?? undefined,
    createdAt: f.created_at,
  }));
}

export async function getActivityFeed(): Promise<ActivityEvent[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(8);
  return (data ?? []).map((a) => ({
    id: a.id,
    type: a.event_type,
    title: a.title,
    detail: a.detail ?? "",
    timestamp: a.created_at,
  }));
}

export async function getMonthlyStats(): Promise<
  { month: string; ingresos: number; gastos: number }[]
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase.from("monthly_stats").select("*").order("ord");
  return (data ?? []).map((m) => ({
    month: m.month,
    ingresos: Number(m.ingresos ?? 0),
    gastos: Number(m.gastos ?? 0),
  }));
}

export async function getDashboardData() {
  const [orders, clients, invoices, inventory, activity] = await Promise.all([
    getServiceOrders(),
    getClients(),
    getInvoices(),
    getInventory(),
    getActivityFeed(),
  ]);

  const kpis = {
    activeOrders: orders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
    clients: clients.length,
    monthRevenue: invoices.filter((f) => f.status === "pagada").reduce((s, f) => s + f.total, 0),
    pendingInvoices: invoices.filter((f) => f.status === "pendiente").length,
  };

  return { orders, invoices, inventory, activity, kpis };
}
