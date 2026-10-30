import type { Metadata } from "next"

import { OwnerAccountScreen } from "./account-screen"

export const metadata: Metadata = { title: "Estado de cuenta" }

export default function Page() {
  return <OwnerAccountScreen />
}
