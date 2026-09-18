import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Contratos" }

export default function Page() {
  return (
    <ComingSoon
      title="Contratos"
      description="Contratos, renovaciones y rescisiones — Fase 9."
    />
  )
}
