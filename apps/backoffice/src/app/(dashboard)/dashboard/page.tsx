import type { Metadata } from "next"

import { DashboardOverview } from "./dashboard-overview"
import { InternalAlerts } from "./internal-alerts"
import { MockDataCheck } from "./mock-data-check"
import { OverdueServices } from "./overdue-services"

export const metadata: Metadata = { title: "Dashboard" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Inicio
      </h1>
      <DashboardOverview />
      <InternalAlerts />
      <OverdueServices />
      <MockDataCheck />
    </div>
  )
}
