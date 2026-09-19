import { AppShell } from "@/components/app-shell"
import { SessionGate } from "@/components/session-gate"
import { getTenantBranding } from "@/lib/tenant-branding"

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const branding = await getTenantBranding()

  return (
    <SessionGate>
      <AppShell tenantName={branding?.name ?? null}>{children}</AppShell>
    </SessionGate>
  )
}
