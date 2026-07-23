import { getSessionContext } from "@/lib/data";
import { BienvenidaView } from "./bienvenida-view";

export const dynamic = "force-dynamic";

export default async function BienvenidaPage() {
  const ctx = await getSessionContext();
  // El primer nombre para un saludo cálido; null → el cliente usa fallback.
  const firstName = ctx?.fullName ? ctx.fullName.split(" ")[0] : null;
  return <BienvenidaView name={firstName} />;
}
