import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Contacto" }

export default function Page() {
  return (
    <ComingSoon
      title="Contacto"
      description="Datos de contacto de la inmobiliaria — Fase 17."
    />
  )
}
