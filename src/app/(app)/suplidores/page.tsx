import { getSuppliers } from "@/lib/data";
import { SuplidoresView } from "./suplidores-view";

export const dynamic = "force-dynamic";

export default async function SuplidoresPage() {
  const suppliers = await getSuppliers();
  return <SuplidoresView suppliers={suppliers} />;
}
