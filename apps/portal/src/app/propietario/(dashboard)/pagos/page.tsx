import type { Metadata } from "next"
import { Suspense } from "react"

import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import { OwnerPaymentsScreen } from "./payments-screen"

export const metadata: Metadata = { title: "Pagos" }

export default function Page() {
  // `useSearchParams` en la pantalla exige un límite de Suspense.
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <OwnerPaymentsScreen />
    </Suspense>
  )
}
