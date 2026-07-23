import { notFound } from "next/navigation";
import { getTechnician } from "@/lib/data";
import { TecnicoDetalleView } from "./tecnico-detalle-view";

export const dynamic = "force-dynamic";

export default async function TecnicoPage({ params }: { params: { id: string } }) {
  const tech = await getTechnician(params.id);
  if (!tech) notFound();
  return <TecnicoDetalleView tech={tech} />;
}
