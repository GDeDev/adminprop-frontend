import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Contacto" }

export default function Page() {
  return (
    <ComingSoon
      title="Contacto"
      description="Datos de la inmobiliaria y WhatsApp — Fase 18."
    />
  )
}
