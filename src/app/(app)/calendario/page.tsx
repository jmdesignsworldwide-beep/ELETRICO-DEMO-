import { getServiceOrders, getTechnicians } from "@/lib/data";
import { CalendarioView } from "./calendario-view";

export const dynamic = "force-dynamic";

export default async function CalendarioPage() {
  const [orders, technicians] = await Promise.all([getServiceOrders(), getTechnicians()]);
  return <CalendarioView orders={orders} technicians={technicians} />;
}
