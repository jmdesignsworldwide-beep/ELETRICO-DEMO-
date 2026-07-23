import { getInvoices, getClients } from "@/lib/data";
import { FacturacionView } from "./facturacion-view";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const [invoices, clients] = await Promise.all([getInvoices(), getClients()]);
  return <FacturacionView invoices={invoices} clients={clients} />;
}
