import { getInvoices } from "@/lib/data";
import { FacturacionView } from "./facturacion-view";

export const dynamic = "force-dynamic";

export default async function FacturacionPage() {
  const invoices = await getInvoices();
  return <FacturacionView invoices={invoices} />;
}
