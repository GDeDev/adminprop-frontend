import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Configuración" }

export default function Page() {
  return (
    <ComingSoon
      title="Configuración"
      description="Parámetros del tenant, maestros y usuarios — Fases 4 y 5."
    />
  )
}
