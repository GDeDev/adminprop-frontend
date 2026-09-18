import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Historial de pagos" }

export default function Page() {
  return (
    <ComingSoon
      title="Historial de pagos"
      description="Pagos mes a mes por propiedad — Fase 17."
    />
  )
}
