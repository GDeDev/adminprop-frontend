import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { SettlementsScreen } from "./settlements-screen"

export const metadata: Metadata = { title: "Liquidaciones" }

export default function Page() {
  // `useSearchParams` en la pantalla exige un límite de Suspense.
  return (
    <Suspense fallback={<PageSkeleton cards={3} />}>
      <SettlementsScreen />
    </Suspense>
  )
}
