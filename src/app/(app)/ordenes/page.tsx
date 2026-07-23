import { getServiceOrders, getClients, getTechnicians } from "@/lib/data";
import { OrdenesView } from "./ordenes-view";

export const dynamic = "force-dynamic";

export default async function OrdenesPage() {
  const [orders, clients, technicians] = await Promise.all([
    getServiceOrders(),
    getClients(),
    getTechnicians(),
  ]);
  return <OrdenesView orders={orders} clients={clients} technicians={technicians} />;
}
