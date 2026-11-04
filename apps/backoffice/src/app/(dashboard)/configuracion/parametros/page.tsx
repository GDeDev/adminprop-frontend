import type { Metadata } from "next"

import { BillingParametersScreen } from "./billing-parameters-screen"

export const metadata: Metadata = { title: "Parámetros de cobro" }

export default function Page() {
  return <BillingParametersScreen />
}
