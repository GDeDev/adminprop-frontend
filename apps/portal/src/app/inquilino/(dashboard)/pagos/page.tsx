import type { Metadata } from "next"

import { RenterPaymentsScreen } from "./payments-screen"

export const metadata: Metadata = { title: "Pagos" }

export default function Page() {
  return <RenterPaymentsScreen />
}
