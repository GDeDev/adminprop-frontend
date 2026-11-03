import type { Metadata } from "next"
import { Suspense } from "react"

import { ChannelsScreen } from "./channels-screen"

export const metadata: Metadata = { title: "Canales de publicación" }

export default function Page() {
  return (
    <Suspense>
      <ChannelsScreen />
    </Suspense>
  )
}
