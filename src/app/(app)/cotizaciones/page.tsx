import { getQuotes, getClients, getInventory } from "@/lib/data";
import { CotizacionesView } from "./cotizaciones-view";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage() {
  const [quotes, clients, inventory] = await Promise.all([
    getQuotes(),
    getClients(),
    getInventory(),
  ]);
  return <CotizacionesView quotes={quotes} clients={clients} inventory={inventory} />;
}
