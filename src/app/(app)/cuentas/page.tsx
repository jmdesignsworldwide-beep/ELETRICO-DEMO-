import { notFound } from "next/navigation";
import { getSessionContext, getDemoAccounts } from "@/lib/data";
import { CuentasView } from "./cuentas-view";

export const dynamic = "force-dynamic";

export default async function CuentasPage() {
  const ctx = await getSessionContext();
  // FORT KNOX: panel exclusivo del owner. Invisible/inaccesible al resto.
  if (!ctx?.isOwner) notFound();
  const accounts = await getDemoAccounts();
  return <CuentasView accounts={accounts} />;
}
