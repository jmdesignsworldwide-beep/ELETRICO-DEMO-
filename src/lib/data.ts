import "server-only";

import {
  createServerSupabase,
  createAdminSupabase,
  isSupabaseConfigured,
  isServiceConfigured,
} from "./supabase/server";
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

export async function getMaterial(id: string): Promise<import("./types").MaterialDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const { data: i } = await supabase.from("inventory").select("*").eq("id", id).single();
  if (!i) return null;

  const { data: moves } = await supabase
    .from("inventory_movements")
    .select("*, service_orders(number)")
    .eq("inventory_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  let photoUrl: string | undefined;
  if (i.photo_path && isServiceConfigured()) {
    try {
      const admin = createAdminSupabase();
      const { data: signed } = await admin.storage
        .from("inventory-photos")
        .createSignedUrl(i.photo_path, 600); // expiración corta
      photoUrl = signed?.signedUrl;
    } catch {
      /* sin foto disponible */
    }
  }

  return {
    id: i.id,
    name: i.name,
    category: i.category,
    sku: i.sku,
    costPrice: Number(i.cost_price ?? 0),
    salePrice: Number(i.sale_price ?? 0),
    stock: i.stock ?? 0,
    minStock: i.min_stock ?? 0,
    unit: i.unit ?? "unidad",
    photoUrl,
    movements: (moves ?? []).map((m) => ({
      id: m.id,
      change: m.change,
      reason: m.reason,
      orderNumber: (m.service_orders as { number: string } | null)?.number ?? undefined,
      createdAt: m.created_at,
    })),
  };
}

export async function getInventoryReport() {
  const items = await getInventory();
  const costValue = items.reduce((s, i) => s + i.costPrice * i.stock, 0);
  const saleValue = items.reduce((s, i) => s + i.salePrice * i.stock, 0);
  const lowStock = items.filter((i) => i.stock <= i.minStock);

  let mostUsed: { name: string; qty: number }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = createServerSupabase();
    const { data } = await supabase.from("order_materials").select("name, qty_used");
    const agg = (data ?? []).reduce<Record<string, number>>((acc, m) => {
      acc[m.name] = (acc[m.name] ?? 0) + Number(m.qty_used ?? 0);
      return acc;
    }, {});
    mostUsed = Object.entries(agg)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }

  return { items, costValue, saleValue, lowStock, mostUsed };
}

// ── Suplidores + Órdenes de compra ──────────────────────────────
const PO_OWED = ["enviada", "recibida_parcial", "recibida"];

export async function getSuppliers(): Promise<import("./types").Supplier[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const [{ data: sups }, { data: pos }, { data: items }] = await Promise.all([
    supabase.from("suppliers").select("*").order("name"),
    supabase.from("purchase_orders").select("id, supplier_id, status"),
    supabase.from("purchase_order_items").select("po_id, qty_ordered, unit_price"),
  ]);
  const totalByPo = new Map<string, number>();
  for (const it of items ?? []) {
    totalByPo.set(it.po_id, (totalByPo.get(it.po_id) ?? 0) + Number(it.qty_ordered) * Number(it.unit_price));
  }
  return (sups ?? []).map((s) => {
    const supPos = (pos ?? []).filter((p) => p.supplier_id === s.id);
    const pending = supPos
      .filter((p) => PO_OWED.includes(p.status))
      .reduce((sum, p) => sum + (totalByPo.get(p.id) ?? 0), 0);
    return {
      id: s.id, name: s.name, rnc: s.rnc ?? undefined, contact: s.contact ?? undefined,
      phone: s.phone ?? undefined, email: s.email ?? undefined, address: s.address ?? undefined,
      paymentTerms: s.payment_terms ?? undefined,
      purchaseCount: supPos.length, pending,
    };
  });
}

export async function getSupplier(id: string): Promise<import("./types").SupplierDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const { data: s } = await supabase.from("suppliers").select("*").eq("id", id).single();
  if (!s) return null;
  const [{ data: prices }, { data: pos }, { data: items }] = await Promise.all([
    supabase.from("supplier_prices").select("*, inventory(name, sku)").eq("supplier_id", id),
    supabase.from("purchase_orders").select("id, number, status, created_at").eq("supplier_id", id).order("created_at", { ascending: false }),
    supabase.from("purchase_order_items").select("po_id, qty_ordered, unit_price"),
  ]);
  const totalByPo = new Map<string, number>();
  for (const it of items ?? []) totalByPo.set(it.po_id, (totalByPo.get(it.po_id) ?? 0) + Number(it.qty_ordered) * Number(it.unit_price));

  return {
    id: s.id, name: s.name, rnc: s.rnc ?? undefined, contact: s.contact ?? undefined,
    phone: s.phone ?? undefined, email: s.email ?? undefined, address: s.address ?? undefined,
    paymentTerms: s.payment_terms ?? undefined,
    purchaseCount: (pos ?? []).length,
    pending: (pos ?? []).filter((p) => PO_OWED.includes(p.status)).reduce((sum, p) => sum + (totalByPo.get(p.id) ?? 0), 0),
    prices: (prices ?? []).map((p) => {
      const inv = p.inventory as unknown as { name: string; sku: string } | null;
      return {
        id: p.id, inventoryId: p.inventory_id,
        materialName: inv?.name ?? "", sku: inv?.sku ?? "",
        price: Number(p.price ?? 0), updatedAt: p.updated_at,
      };
    }).sort((a, b) => a.materialName.localeCompare(b.materialName)),
    purchaseOrders: (pos ?? []).map((p) => ({
      id: p.id, number: p.number, status: p.status,
      total: totalByPo.get(p.id) ?? 0, createdAt: p.created_at,
    })),
  };
}

export async function getPurchaseOrders(): Promise<import("./types").PurchaseOrder[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const [{ data: pos }, { data: items }] = await Promise.all([
    supabase.from("purchase_orders").select("*, suppliers(name)").order("created_at", { ascending: false }),
    supabase.from("purchase_order_items").select("po_id, qty_ordered, unit_price"),
  ]);
  const agg = new Map<string, { total: number; count: number }>();
  for (const it of items ?? []) {
    const cur = agg.get(it.po_id) ?? { total: 0, count: 0 };
    cur.total += Number(it.qty_ordered) * Number(it.unit_price);
    cur.count += 1;
    agg.set(it.po_id, cur);
  }
  return (pos ?? []).map((p) => ({
    id: p.id, number: p.number, supplierId: p.supplier_id,
    supplierName: (p.suppliers as unknown as { name: string } | null)?.name ?? "Suplidor",
    status: p.status, total: agg.get(p.id)?.total ?? 0, itemCount: agg.get(p.id)?.count ?? 0,
    createdAt: p.created_at, receivedAt: p.received_at ?? undefined,
  }));
}

export async function getPurchaseOrder(id: string): Promise<import("./types").PurchaseOrderDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const { data: p } = await supabase
    .from("purchase_orders")
    .select("*, suppliers(name, phone)")
    .eq("id", id).single();
  if (!p) return null;
  const { data: items } = await supabase.from("purchase_order_items").select("*").eq("po_id", id).order("created_at");
  const mapped = (items ?? []).map((it) => ({
    id: it.id, inventoryId: it.inventory_id, name: it.name,
    qtyOrdered: it.qty_ordered ?? 0, qtyReceived: it.qty_received ?? 0,
    unitPrice: Number(it.unit_price ?? 0), discrepancyNote: it.discrepancy_note ?? undefined,
  }));
  const sup = p.suppliers as unknown as { name: string; phone: string } | null;
  return {
    id: p.id, number: p.number, supplierId: p.supplier_id, supplierName: sup?.name ?? "Suplidor",
    supplierPhone: sup?.phone ?? undefined, status: p.status, notes: p.notes ?? undefined,
    itemCount: mapped.length, total: mapped.reduce((s, i) => s + i.qtyOrdered * i.unitPrice, 0),
    createdAt: p.created_at, receivedAt: p.received_at ?? undefined, items: mapped,
  };
}

export async function getPriceComparison(): Promise<import("./types").PriceComparison[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("supplier_prices")
    .select("price, inventory(id, name, sku), suppliers(id, name)");
  const byMaterial = new Map<string, import("./types").PriceComparison>();
  for (const row of data ?? []) {
    const inv = row.inventory as unknown as { id: string; name: string; sku: string } | null;
    const sup = row.suppliers as unknown as { id: string; name: string } | null;
    if (!inv || !sup) continue;
    const entry = byMaterial.get(inv.id) ?? { inventoryId: inv.id, materialName: inv.name, sku: inv.sku, offers: [] };
    entry.offers.push({ supplierId: sup.id, supplierName: sup.name, price: Number(row.price ?? 0) });
    byMaterial.set(inv.id, entry);
  }
  return Array.from(byMaterial.values())
    .map((m) => ({ ...m, offers: m.offers.sort((a, b) => a.price - b.price) }))
    .filter((m) => m.offers.length > 1)
    .sort((a, b) => a.materialName.localeCompare(b.materialName));
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

export async function getInvoice(id: string): Promise<import("./types").InvoiceDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const { data: f } = await supabase
    .from("invoices")
    .select("*, clients(name, phone, address), service_orders!invoices_order_id_fkey(number)")
    .eq("id", id)
    .single();
  if (!f) return null;
  const [{ data: items }, { data: pays }] = await Promise.all([
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("sort"),
    supabase.from("payments").select("*").eq("invoice_id", id).order("created_at"),
  ]);
  const client = f.clients as { name: string; phone: string; address: string } | null;
  const order = f.service_orders as { number: string } | null;
  return {
    id: f.id,
    number: f.number,
    ncf: f.ncf,
    clientId: f.client_id,
    clientName: client?.name ?? "Cliente",
    clientPhone: client?.phone ?? undefined,
    clientAddress: client?.address ?? undefined,
    orderNumber: order?.number ?? undefined,
    status: f.status,
    subtotal: Number(f.subtotal ?? 0),
    itbis: Number(f.itbis ?? 0),
    total: Number(f.total ?? 0),
    paymentMethod: f.payment_method ?? undefined,
    createdAt: f.created_at,
    paidAt: f.paid_at ?? undefined,
    voidReason: f.void_reason ?? undefined,
    voidedAt: f.voided_at ?? undefined,
    items: (items ?? []).map((i) => ({
      id: i.id,
      description: i.description,
      qty: Number(i.qty ?? 1),
      unitPrice: Number(i.unit_price ?? 0),
      lineTotal: Number(i.line_total ?? 0),
    })),
    payments: (pays ?? []).map((p) => ({
      id: p.id,
      method: p.method,
      amount: Number(p.amount ?? 0),
      voucher: p.voucher ?? undefined,
      received: p.received != null ? Number(p.received) : undefined,
      changeGiven: p.change_given != null ? Number(p.change_given) : undefined,
      createdAt: p.created_at,
    })),
  };
}

// ── Caja y gastos ───────────────────────────────────────────────
function mapRegister(r: Record<string, unknown>): import("./types").CashRegister {
  return {
    id: r.id as string,
    openerName: (r.opener_name as string) ?? undefined,
    openingAmount: Number(r.opening_amount ?? 0),
    openedAt: r.opened_at as string,
    status: r.status as string,
    closedAt: (r.closed_at as string) ?? undefined,
    expectedCash: r.expected_cash != null ? Number(r.expected_cash) : undefined,
    countedCash: r.counted_cash != null ? Number(r.counted_cash) : undefined,
    difference: r.difference != null ? Number(r.difference) : undefined,
    closingNotes: (r.closing_notes as string) ?? undefined,
  };
}

export async function getOpenRegister(): Promise<import("./types").CashRegister | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase.from("cash_registers").select("*").eq("status", "abierta").maybeSingle();
  return data ? mapRegister(data) : null;
}

async function summarize(
  register: import("./types").CashRegister
): Promise<import("./types").RegisterSummary> {
  const supabase = createServerSupabase();
  const from = register.openedAt;
  const to = register.closedAt ?? new Date().toISOString();

  const [{ data: pays }, { data: exps }] = await Promise.all([
    supabase.from("payments").select("method, amount, created_at").gte("created_at", from).lte("created_at", to),
    supabase.from("expenses").select("*").eq("register_id", register.id).order("created_at", { ascending: false }),
  ]);

  const incomeByMethod: Record<string, number> = {};
  for (const p of pays ?? []) incomeByMethod[p.method] = (incomeByMethod[p.method] ?? 0) + Number(p.amount);
  const incomeTotal = Object.values(incomeByMethod).reduce((s, n) => s + n, 0);

  const expenses: import("./types").Expense[] = (exps ?? []).map((e) => ({
    id: e.id, category: e.category, description: e.description,
    amount: Number(e.amount), paymentMethod: e.payment_method,
    hasReceipt: Boolean(e.receipt_path), createdAt: e.created_at,
  }));
  const expensesByMethod: Record<string, number> = {};
  for (const e of expenses) expensesByMethod[e.paymentMethod] = (expensesByMethod[e.paymentMethod] ?? 0) + e.amount;
  const expensesTotal = expenses.reduce((s, e) => s + e.amount, 0);

  const expectedCash =
    register.openingAmount + (incomeByMethod["efectivo"] ?? 0) - (expensesByMethod["efectivo"] ?? 0);

  return { register, incomeByMethod, incomeTotal, expenses, expensesByMethod, expensesTotal, expectedCash };
}

export async function getRegisterSummary(): Promise<import("./types").RegisterSummary | null> {
  const open = await getOpenRegister();
  if (!open) return null;
  return summarize(open);
}

export async function getRegister(id: string): Promise<import("./types").RegisterSummary | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createServerSupabase();
  const { data } = await supabase.from("cash_registers").select("*").eq("id", id).single();
  if (!data) return null;
  return summarize(mapRegister(data));
}

export async function getCashHistory(): Promise<import("./types").CashRegister[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("cash_registers").select("*").eq("status", "cerrada")
    .order("closed_at", { ascending: false }).limit(30);
  return (data ?? []).map(mapRegister);
}

export async function getRecurringExpenses(): Promise<import("./types").RecurringExpense[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createServerSupabase();
  const { data } = await supabase.from("recurring_expenses").select("*").order("created_at");
  return (data ?? []).map((r) => ({
    id: r.id, category: r.category, description: r.description,
    amount: Number(r.amount), paymentMethod: r.payment_method, active: r.active,
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
