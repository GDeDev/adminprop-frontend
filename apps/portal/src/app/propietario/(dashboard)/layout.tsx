import { PortalGate } from "@/components/portal-gate"
import { PortalShell } from "@/components/portal-shell"
import { getTenantBranding } from "@/lib/tenant-branding"

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const branding = await getTenantBranding()

  return (
    <PortalGate role="owner">
      <PortalShell role="owner" tenantName={branding?.name ?? null}>
        {children}
      </PortalShell>
    </PortalGate>
  )
}
