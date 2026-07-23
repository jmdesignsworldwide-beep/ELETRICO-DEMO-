import { notFound } from "next/navigation";
import { getSupplier, getInventory } from "@/lib/data";
import { SupplierDetalleView } from "./supplier-detalle-view";

export const dynamic = "force-dynamic";

export default async function SupplierPage({ params }: { params: { id: string } }) {
  const [supplier, inventory] = await Promise.all([getSupplier(params.id), getInventory()]);
  if (!supplier) notFound();
  return <SupplierDetalleView supplier={supplier} inventory={inventory} />;
}
