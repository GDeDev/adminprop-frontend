import type { Metadata } from "next"

import { OwnerSettlementsScreen } from "./settlements-screen"

export const metadata: Metadata = { title: "Liquidaciones" }

export default function Page() {
  return <OwnerSettlementsScreen />
}
