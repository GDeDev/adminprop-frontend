import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Liquidaciones" }

export default function Page() {
  return (
    <ComingSoon
      title="Liquidaciones"
      description="Historial con descarga de PDF — Fase 17."
    />
  )
}
