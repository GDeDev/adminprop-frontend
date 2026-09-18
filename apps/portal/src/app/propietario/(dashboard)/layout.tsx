import { PortalShell } from "@/components/portal-shell"

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // TODO(Fase 4): proteger con sesión de portal (rol "owner") o redirect a login.
  return <PortalShell role="owner">{children}</PortalShell>
}
