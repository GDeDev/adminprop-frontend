import { AppShell } from "@/components/app-shell"

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // TODO(Fase 4): proteger este grupo de rutas (sesión válida o redirect a /login).
  return <AppShell>{children}</AppShell>
}
