import { notFound } from "next/navigation";
import { getOrder, getInventory } from "@/lib/data";
import { OrdenDetalleView } from "./orden-detalle-view";

export const dynamic = "force-dynamic";

export default async function OrdenDetallePage({ params }: { params: { id: string } }) {
  const [order, inventory] = await Promise.all([getOrder(params.id), getInventory()]);
  if (!order) notFound();
  return <OrdenDetalleView order={order} inventory={inventory} now={Date.now()} />;
}
