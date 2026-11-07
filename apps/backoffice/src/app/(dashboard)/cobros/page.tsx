import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { BillingScreen } from "./billing-screen"

export const metadata: Metadata = { title: "Cobros" }

export default function Page() {
  // `useSearchParams` en la pantalla exige un límite de Suspense.
  return (
    <Suspense fallback={<PageSkeleton cards={3} />}>
      <BillingScreen />
    </Suspense>
  )
}
