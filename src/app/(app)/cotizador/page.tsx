import { getInventory, getClients } from "@/lib/data";
import { CotizadorView } from "./cotizador-view";

export const dynamic = "force-dynamic";

export default async function CotizadorPage() {
  const [inventory, clients] = await Promise.all([getInventory(), getClients()]);
  return <CotizadorView inventory={inventory} clients={clients} />;
}
