import type { Metadata } from "next"

import { RenterAccountScreen } from "./account-screen"

export const metadata: Metadata = { title: "Estado de cuenta" }

export default function Page() {
  return <RenterAccountScreen />
}
