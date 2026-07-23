import { notFound } from "next/navigation";
import { getQuote } from "@/lib/data";
import { CotizacionDetalleView } from "./cotizacion-detalle-view";

export const dynamic = "force-dynamic";

export default async function CotizacionDetallePage({ params }: { params: { id: string } }) {
  const quote = await getQuote(params.id);
  if (!quote) notFound();
  return <CotizacionDetalleView quote={quote} />;
}
