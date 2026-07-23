import { getServiceOrders } from "@/lib/data";
import { OrdenesView } from "./ordenes-view";

export const dynamic = "force-dynamic";

export default async function OrdenesPage() {
  const orders = await getServiceOrders();
  return <OrdenesView orders={orders} />;
}
