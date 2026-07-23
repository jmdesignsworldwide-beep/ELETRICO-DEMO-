import { getFinanceReport } from "@/lib/data";
import { FinanzasView } from "./finanzas-view";

export const dynamic = "force-dynamic";

export default async function FinanzasPage() {
  const report = await getFinanceReport();
  return <FinanzasView report={report} />;
}
