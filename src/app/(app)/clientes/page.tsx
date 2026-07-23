import { getClients } from "@/lib/data";
import { ClientesView } from "./clientes-view";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await getClients();
  return <ClientesView clients={clients} />;
}
