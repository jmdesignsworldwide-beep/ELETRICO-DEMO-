import { notFound } from "next/navigation";
import { getMaterial } from "@/lib/data";
import { MaterialDetalleView } from "./material-detalle-view";

export const dynamic = "force-dynamic";

export default async function MaterialPage({ params }: { params: { id: string } }) {
  const material = await getMaterial(params.id);
  if (!material) notFound();
  return <MaterialDetalleView material={material} />;
}
