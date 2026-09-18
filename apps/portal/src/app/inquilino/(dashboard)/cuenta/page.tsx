import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Estado de cuenta" }

export default function Page() {
  return (
    <ComingSoon
      title="Estado de cuenta"
      description="Monto del mes con desglose de punitorios — Fase 18."
    />
  )
}
