import { getMonthlyStats, getServiceOrders } from "@/lib/data";
import { FinanzasView } from "./finanzas-view";

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const [monthly, orders] = await Promise.all([getMonthlyStats(), getServiceOrders()]);
  return <FinanzasView monthly={monthly} orders={orders} />;
}
