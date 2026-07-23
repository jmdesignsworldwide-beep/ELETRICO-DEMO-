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

export interface ActivityEvent {
  id: string;
  type: "orden" | "cliente" | "cotizacion" | "factura" | "pago" | "inventario";
  title: string;
  detail: string;
  timestamp: string;
}
