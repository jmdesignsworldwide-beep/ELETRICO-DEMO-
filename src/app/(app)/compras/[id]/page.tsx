import { notFound } from "next/navigation";
import { getPurchaseOrder } from "@/lib/data";
import { OrdenCompraDetalleView } from "./orden-compra-detalle-view";

export const dynamic = "force-dynamic";

export default async function CompraPage({ params }: { params: { id: string } }) {
  const po = await getPurchaseOrder(params.id);
  if (!po) notFound();
  return <OrdenCompraDetalleView po={po} />;
}
