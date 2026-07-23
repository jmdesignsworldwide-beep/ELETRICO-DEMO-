import { getTechnicians } from "@/lib/data";
import { TecnicosView } from "./tecnicos-view";

export const dynamic = "force-dynamic";

export default async function TecnicosPage() {
  const technicians = await getTechnicians();
  return <TecnicosView technicians={technicians} />;
}
