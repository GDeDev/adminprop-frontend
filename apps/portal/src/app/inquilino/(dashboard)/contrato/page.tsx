import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Mi contrato" }

export default function Page() {
  return (
    <ComingSoon
      title="Mi contrato"
      description="Datos vigentes de tu contrato — Fase 18."
    />
  )
}
