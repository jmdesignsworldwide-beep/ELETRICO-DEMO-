import { notFound } from "next/navigation";
import { getClient } from "@/lib/data";
import { ClienteDetalleView } from "./cliente-detalle-view";

export const dynamic = "force-dynamic";

export default async function ClienteDetallePage({ params }: { params: { id: string } }) {
  const client = await getClient(params.id);
  if (!client) notFound();
  return <ClienteDetalleView client={client} />;
}
