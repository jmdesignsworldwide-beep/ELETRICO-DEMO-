import { getInventory } from "@/lib/data";
import { CotizadorView } from "./cotizador-view";

export const dynamic = "force-dynamic";

export default async function CotizadorPage() {
  const inventory = await getInventory();
  return <CotizadorView inventory={inventory} />;
}
