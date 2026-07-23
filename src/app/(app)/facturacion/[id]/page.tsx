import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/data";
import { FacturaDetalleView } from "./factura-detalle-view";

export const dynamic = "force-dynamic";

export default async function FacturaDetallePage({ params }: { params: { id: string } }) {
  const invoice = await getInvoice(params.id);
  if (!invoice) notFound();
  return <FacturaDetalleView invoice={invoice} />;
}
