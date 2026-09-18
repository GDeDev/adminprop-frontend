import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Propiedades" }

export default function Page() {
  return (
    <ComingSoon
      title="Propiedades"
      description="Listado, ficha y alta de propiedades — Fase 6."
    />
  )
}
