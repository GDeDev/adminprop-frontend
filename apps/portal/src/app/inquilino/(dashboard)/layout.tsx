import { PortalShell } from "@/components/portal-shell"

export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // TODO(Fase 4): proteger con sesión de portal (rol "renter") o redirect a login.
  return <PortalShell role="renter">{children}</PortalShell>
}
