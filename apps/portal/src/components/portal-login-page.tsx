import Link from "next/link"

import type { PortalRole } from "@adminprop/shared-types"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@adminprop/ui/components/card"

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

export function PortalLoginPage({ role }: { role: PortalRole }) {
  const copy = COPY[role]
  return (
    <div className="flex min-h-svh flex-col bg-nav px-4 py-10 text-nav-foreground">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8">
        <Link
          href="/"
          className="text-center font-serif text-3xl font-semibold tracking-tight"
        >
          Adminprop
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <PortalLoginForm role={role} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
