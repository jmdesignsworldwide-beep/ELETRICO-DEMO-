import { getQuotes } from "@/lib/data";
import { CotizacionesView } from "./cotizaciones-view";

export const dynamic = "force-dynamic";

export default async function CotizacionesPage() {
  const quotes = await getQuotes();
  return <CotizacionesView quotes={quotes} />;
}
