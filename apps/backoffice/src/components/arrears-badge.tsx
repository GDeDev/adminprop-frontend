"use client"

import type { RenterArrears } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"

import { arrearsMeta, formatMoneyList, isZero } from "@/lib/billing"

/**
 * Estado de pago de un inquilino (spec Fase 11, 5.2): días de atraso y, si
 * se pide, el punitorio devengado. `undefined` mientras carga o sin datos.
 */
export function ArrearsBadge({
  arrears,
  withAmount = false,
}: {
  arrears: RenterArrears | undefined
  withAmount?: boolean
}) {
  const meta = arrearsMeta(arrears)
  const lateFee =
    withAmount &&
    arrears &&
    arrears.lateFeeAccrued.some((m) => !isZero(m.amount))
      ? formatMoneyList(arrears.lateFeeAccrued)
      : null
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <Badge variant={meta.badge}>{meta.label}</Badge>
      {lateFee && (
        <span className="text-xs text-muted-foreground tabular-nums">
          Punitorio {lateFee}
        </span>
      )}
    </span>
  )
}
