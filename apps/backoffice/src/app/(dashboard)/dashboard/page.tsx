import type { Metadata } from "next"

import { ComingSoon } from "@adminprop/ui/components/coming-soon"

import { MockDataCheck } from "./mock-data-check"

export const metadata: Metadata = { title: "Dashboard" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <ComingSoon
        title="Dashboard"
        description="Resumen del mes, alertas y accesos rápidos — Fase 19."
      />
      <MockDataCheck />
    </div>
  )
}
