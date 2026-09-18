import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Cobros" }

export default function Page() {
  return (
    <ComingSoon
      title="Cobros"
      description="Cobros del mes y punitorios — Fase 11."
    />
  )
}
