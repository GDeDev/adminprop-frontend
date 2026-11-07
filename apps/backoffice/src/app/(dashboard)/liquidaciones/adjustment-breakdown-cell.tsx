import { isZero } from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"
import {
  adjustmentBreakdown,
  signedMoney,
  type AdjustmentBreakdownSource,
} from "@/lib/settlements"

/**
 * Celda de tabla con retenciones, adelantos y otros ajustes en renglones
 * separados (con signo). Solo se listan los que no son cero, para que la
 * columna no ensanche la tabla; si no hay ninguno, un guion.
 */
export function AdjustmentBreakdownCell({
  settlement,
}: {
  settlement: AdjustmentBreakdownSource & { currency: string }
}) {
  const items = adjustmentBreakdown(settlement).filter(
    (item) => !isZero(item.amount)
  )
  if (items.length === 0) {
    return (
      <span className="text-muted-foreground">
        <span aria-hidden>—</span>
        <span className="sr-only">
          Sin retenciones, adelantos ni otros ajustes
        </span>
      </span>
    )
  }
  return (
    <dl className="flex flex-col gap-0.5 text-xs">
      {items.map((item) => (
        <div key={item.key} className="flex justify-between gap-3">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="num">
            {signedMoney(item.amount, settlement.currency, formatMoney)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
