import {
  LayoutDashboard,
  Users,
  Wrench,
  FileText,
  Calculator,
  Package,
  Truck,
  ShoppingCart,
  Receipt,
  Wallet,
  HardHat,
  BarChart3,
  Calendar,
  Images,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

export const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "Principal" },
  { href: "/clientes", label: "Clientes", icon: Users, group: "Operación" },
  { href: "/ordenes", label: "Órdenes de servicio", icon: Wrench, group: "Operación" },
  { href: "/cotizaciones", label: "Cotizaciones", icon: FileText, group: "Operación" },
  { href: "/cotizador", label: "Cotizador rápido", icon: Calculator, group: "Operación" },
  { href: "/inventario", label: "Inventario", icon: Package, group: "Almacén" },
  { href: "/suplidores", label: "Suplidores", icon: Truck, group: "Almacén" },
  { href: "/compras", label: "Órdenes de compra", icon: ShoppingCart, group: "Almacén" },
  { href: "/facturacion", label: "Facturación", icon: Receipt, group: "Finanzas" },
  { href: "/caja", label: "Caja y gastos", icon: Wallet, group: "Finanzas" },
  { href: "/finanzas", label: "Finanzas y ERP", icon: BarChart3, group: "Finanzas" },
  { href: "/tecnicos", label: "Técnicos y nómina", icon: HardHat, group: "Equipo" },
  { href: "/calendario", label: "Calendario", icon: Calendar, group: "Equipo" },
  { href: "/portafolio", label: "Portafolio", icon: Images, group: "Equipo" },
];

export const navGroups = ["Principal", "Operación", "Almacén", "Finanzas", "Equipo"];
