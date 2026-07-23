import { getRegisterSummary, getRecurringExpenses, getCashHistory } from "@/lib/data";
import { CajaView } from "./caja-view";

export const dynamic = "force-dynamic";

export default async function CajaPage() {
  const [summary, recurring, history] = await Promise.all([
    getRegisterSummary(),
    getRecurringExpenses(),
    getCashHistory(),
  ]);
  return <CajaView summary={summary} recurring={recurring} history={history} />;
}
