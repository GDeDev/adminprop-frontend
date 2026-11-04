import type { Metadata } from "next"

import { DashboardOverview } from "./dashboard-overview"
import { InternalAlerts } from "./internal-alerts"
import { MockDataCheck } from "./mock-data-check"
import { OverdueServices } from "./overdue-services"
import { UnattendedInquiries } from "./unattended-inquiries"

export const metadata: Metadata = { title: "Dashboard" }

export default function Page() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-title-lg font-semibold md:text-display-md">
        Inicio
      </h1>
      <DashboardOverview />
      <UnattendedInquiries />
      <InternalAlerts />
      <OverdueServices />
      <MockDataCheck />
    </div>
  )
}
