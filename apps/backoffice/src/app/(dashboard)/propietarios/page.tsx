import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Propietarios" }

export default function Page() {
  return (
    <ComingSoon
      title="Propietarios"
      description="Listado, ficha y alta de propietarios — Fase 7."
    />
  )
}
