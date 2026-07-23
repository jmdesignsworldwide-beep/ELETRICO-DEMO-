import { getInventory } from "@/lib/data";
import { InventarioView } from "./inventario-view";

export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const inventory = await getInventory();
  return <InventarioView inventory={inventory} />;
}
