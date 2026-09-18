import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

export const metadata: Metadata = { title: "Inquilinos" }

export default function Page() {
  return (
    <ComingSoon
      title="Inquilinos"
      description="Inquilinos y garantes — Fase 8."
    />
  )
}
