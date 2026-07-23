import { getPortfolioWorks, getTechnicians } from "@/lib/data";
import { PortafolioView } from "./portafolio-view";

export const dynamic = "force-dynamic";

export default async function PortafolioPage() {
  const [works, technicians] = await Promise.all([getPortfolioWorks(), getTechnicians()]);
  return <PortafolioView works={works} technicians={technicians} />;
}
