import { getDashboardData } from "@/lib/data";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { kpis, orders, activity, inventory } = await getDashboardData();
  return <DashboardView kpis={kpis} orders={orders} activity={activity} inventory={inventory} now={Date.now()} />;
}
