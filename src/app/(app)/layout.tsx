import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getSessionContext } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getSessionContext();
  // Cuenta de demo vencida → pantalla de expiración (defensa adicional a middleware).
  if (ctx?.demo?.expired) redirect("/expirado");

  return (
    <AppShell
      isOwner={ctx?.isOwner ?? false}
      demoDaysRemaining={ctx?.demo?.daysRemaining ?? null}
      userName={ctx?.fullName}
    >
      {children}
    </AppShell>
  );
}
