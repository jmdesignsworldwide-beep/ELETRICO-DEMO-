import { getServiceOrders } from "@/lib/data";
import { CalendarioView } from "./calendario-view";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const orders = await getServiceOrders();
  return <CalendarioView orders={orders} />;
}
