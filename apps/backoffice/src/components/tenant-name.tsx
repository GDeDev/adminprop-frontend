"use client"

import * as React from "react"

const TenantNameContext = React.createContext<string | null>(null)

/** Nombre de la inmobiliaria (`agencyName` de las plantillas de WhatsApp). */
export function TenantNameProvider({
  name,
  children,
}: {
  name: string | null
  children: React.ReactNode
}) {
  return <TenantNameContext value={name}>{children}</TenantNameContext>
}

export function useTenantName(): string | null {
  return React.useContext(TenantNameContext)
}
