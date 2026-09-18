import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Mis propiedades" }

export default function Page() {
  return (
    <ComingSoon
      title="Mis propiedades"
      description="Listado de tus propiedades y su estado — Fase 17."
    />
  )
}
