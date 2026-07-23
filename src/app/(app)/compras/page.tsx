import { getPurchaseOrders, getSuppliers, getInventory, guardAdminRoute } from "@/lib/data";
import { ComprasView } from "./compras-view";

export const dynamic = "force-dynamic";

export default async function ComprasPage() {
  await guardAdminRoute();
  const [orders, suppliers, inventory] = await Promise.all([
    getPurchaseOrders(),
    getSuppliers(),
    getInventory(),
  ]);
  return <ComprasView orders={orders} suppliers={suppliers} inventory={inventory} />;
}
