import { getPortfolioWorks } from "@/lib/data";
import { PresentacionView } from "./presentacion-view";

export const dynamic = "force-dynamic";

export default async function PresentacionPage() {
  const works = await getPortfolioWorks({ onlyVisible: true });
  return <PresentacionView works={works} />;
}
