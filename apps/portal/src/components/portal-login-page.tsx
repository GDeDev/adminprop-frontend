import Link from "next/link"

import type { PortalRole } from "@adminprop/shared-types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"

import { getPortalTenantSlug, getTenantBranding } from "@/lib/tenant-branding"

import { PortalLoginForm } from "./portal-login-form"

const COPY: Record<PortalRole, { title: string; description: string }> = {
  owner: {
    title: "Portal de propietarios",
    description: "Consultá tus propiedades, liquidaciones y pagos.",
  },
  renter: {
    title: "Portal de inquilinos",
    description: "Consultá tu estado de cuenta, pagos y contrato.",
  },
}

export async function PortalLoginPage({ role }: { role: PortalRole }) {
  const copy = COPY[role]
  const branding = await getTenantBranding()

  return (
    <div className="flex min-h-svh flex-col bg-sidebar chrome-glow px-4 py-10 text-sidebar-foreground">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8">
        <Link
          href="/"
          className="py-2 text-center font-display text-display-md font-semibold"
        >
          {branding?.name ?? "Adminprop"}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-title-md">
              <h1>{copy.title}</h1>
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <PortalLoginForm role={role} tenantSlug={getPortalTenantSlug()} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
