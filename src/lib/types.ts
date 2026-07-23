// Tipos centrales del sistema JM Electric.

export type PropertyType = "residencial" | "comercial" | "industrial";

export type OrderStatus =
  | "recibida"
  | "asignada"
  | "en_proceso"
  | "esperando_materiales"
  | "esperando_aprobacion"
  | "completada"
  | "facturada"
  | "pagada"
  | "cancelada";

export type Priority = "normal" | "urgente" | "emergencia";

export type ServiceType =
  | "instalacion_nueva"
  | "reparacion"
  | "mantenimiento"
  | "paneles_solares"
  | "aire_acondicionado"
  | "camaras"
  | "alarmas"
  | "tomacorrientes"
  | "breakers"
  | "diagnostico"
  | "certificacion"
  | "emergencia"
  | "otro";

export type QuoteStatus = "borrador" | "enviada" | "aprobada" | "rechazada" | "vencida";

export type InvoiceStatus = "pendiente" | "pagada" | "anulada";

export interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  propertyType: PropertyType;
  panelType?: string;
  voltage?: string;
  notes?: string;
  totalSpent: number;
  serviceCount: number;
  createdAt: string;
}

export interface Technician {
  id: string;
  name: string;
  phone: string;
  specialties: string[];
  certifications: string[];
  activeOrders: number;
  cedula?: string;
  address?: string;
  hourlyRate: number;
  active: boolean;
  photoUrl?: string;
}

export interface Certification {
  id: string;
  name: string;
  expiresAt?: string;
}

export interface WorklogEntry {
  id: string;
  hours: number;
  note?: string;
  orderNumber?: string;
  createdAt: string;
}

export interface TechnicianDetail extends Technician {
  certs: Certification[];
  worklog: WorklogEntry[];
  assignedOrders: { id: string; number: string; clientName: string; status: string; scheduledDate: string }[];
  materialsUsed: { name: string; qty: number }[];
}

export interface ServiceOrder {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  serviceType: ServiceType;
  status: OrderStatus;
  priority: Priority;
  technicianIds: string[];
  technicianNames: string[];
  scheduledDate: string;
  estimatedEndDate: string;
  description: string;
  address: string;
  total: number;
  createdAt: string;
}

export interface OrderMaterial {
  id: string;
  inventoryId: string;
  name: string;
  qtyEstimated: number;
  qtyUsed: number;
  unitPrice: number;
}

export interface OrderDetail extends ServiceOrder {
  finalNotes?: string;
  recommendations?: string;
  closedAt?: string;
  quoteId?: string;
  invoiceId?: string;
  materials: OrderMaterial[];
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface InventoryMovement {
  id: string;
  change: number;
  reason: string;
  orderNumber?: string;
  actorName?: string;
  createdAt: string;
}

export interface MaterialDetail extends InventoryItem {
  photoUrl?: string;
  movements: InventoryMovement[];
}

export interface Quote {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  status: QuoteStatus;
  subtotal: number;
  discount: number;
  itbis: number;
  total: number;
  createdAt: string;
  validUntil: string;
}

export interface Invoice {
  id: string;
  number: string;
  ncf: string;
  clientId: string;
  clientName: string;
  status: InvoiceStatus;
  subtotal: number;
  itbis: number;
  total: number;
  paymentMethod?: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Payment {
  id: string;
  method: string;
  amount: number;
  voucher?: string;
  received?: number;
  changeGiven?: number;
  createdAt: string;
}

export interface InvoiceDetail extends Invoice {
  clientPhone?: string;
  clientAddress?: string;
  orderNumber?: string;
  paidAt?: string;
  voidReason?: string;
  voidedAt?: string;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface Supplier {
  id: string;
  name: string;
  rnc?: string;
  contact?: string;
  phone?: string;
  email?: string;
  address?: string;
  paymentTerms?: string;
  purchaseCount: number;
  pending: number;
}

export interface SupplierPrice {
  id: string;
  inventoryId: string;
  materialName: string;
  sku: string;
  price: number;
  updatedAt: string;
}

export interface SupplierDetail extends Supplier {
  prices: SupplierPrice[];
  purchaseOrders: { id: string; number: string; status: string; total: number; createdAt: string }[];
}

export interface PurchaseOrderItem {
  id: string;
  inventoryId: string;
  name: string;
  qtyOrdered: number;
  qtyReceived: number;
  unitPrice: number;
  discrepancyNote?: string;
}

export interface PurchaseOrder {
  id: string;
  number: string;
  supplierId: string;
  supplierName: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
  receivedAt?: string;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  supplierPhone?: string;
  notes?: string;
  items: PurchaseOrderItem[];
}

export interface PriceComparison {
  inventoryId: string;
  materialName: string;
  sku: string;
  offers: { supplierId: string; supplierName: string; price: number }[];
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  hasReceipt: boolean;
  createdAt: string;
}

export interface RecurringExpense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  active: boolean;
}

export interface CashRegister {
  id: string;
  openerName?: string;
  openingAmount: number;
  openedAt: string;
  status: string;
  closedAt?: string;
  expectedCash?: number;
  countedCash?: number;
  difference?: number;
  closingNotes?: string;
}

export interface RegisterSummary {
  register: CashRegister;
  incomeByMethod: Record<string, number>;
  incomeTotal: number;
  expenses: Expense[];
  expensesByMethod: Record<string, number>;
  expensesTotal: number;
  expectedCash: number;
}

export interface PortfolioWork {
  id: string;
  orderId?: string;
  orderNumber?: string;
  technicianId?: string;
  technicianName?: string;
  title: string;
  description?: string;
  category: string;
  categoryLabel: string;
  beforeUrl?: string;
  afterUrl?: string;
  favorite: boolean;
  visible: boolean;
  createdAt: string;
}

export interface FinanceReport {
  monthly: { month: string; ingresos: number; gastos: number }[];
  totals: { ingresos: number; gastos: number; ganancia: number };
  monthComparison: { current: number; previous: number; pct: number };
  incomeByService: { name: string; value: number }[];
  serviceProfit: { name: string; income: number; cost: number; margin: number }[];
  incomeByTech: { name: string; value: number }[];
  expensesByCategory: { name: string; value: number }[];
  ordersByStatus: { status: string; label: string; count: number }[];
  quoteConversion: { enviadas: number; aprobadas: number; rechazadas: number; rate: number };
  avgCloseByService: { name: string; days: number }[];
  mostUsedMaterials: { name: string; qty: number }[];
}

export interface ActivityEvent {
  id: string;
  type: "orden" | "cliente" | "cotizacion" | "factura" | "pago" | "inventario";
  title: string;
  detail: string;
  timestamp: string;
}
