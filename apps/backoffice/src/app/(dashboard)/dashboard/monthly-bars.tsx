import type { Currency, DashboardReport } from "@adminprop/shared-types"

import { periodLabel } from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"

type History = DashboardReport["history"]

/** Total de un mes en una moneda (los importes llegan como string; solo se compara para dibujar). */
function amountOf(
  items: { currency: Currency; amount: string }[],
  currency: Currency
): number {
  return Number(items.find((item) => item.currency === currency)?.amount ?? 0)
}

/** Monedas con algún movimiento en el rango, ARS primero. */
export function historyCurrencies(history: History): Currency[] {
  const used = new Set<Currency>()
  for (const month of history) {
    for (const item of [...month.accrued, ...month.collected]) {
      if (Number(item.amount) > 0) used.add(item.currency)
    }
  }
  return (["ARS", "USD"] as Currency[]).filter((currency) => used.has(currency))
}

/**
 * Barras de devengado vs. cobrado por mes, en SVG propio (A-37). Un gráfico
 * por moneda: nunca se mezclan pesos con dólares. La altura es solo visual;
 * el valor exacto va en el texto de cada barra.
 */
export function MonthlyBars({ history }: { history: History }) {
  const currencies = historyCurrencies(history)
  if (currencies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay movimientos para graficar.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-6">
      {currencies.map((currency) => (
        <CurrencyBars key={currency} currency={currency} history={history} />
      ))}
    </div>
  )
}

function CurrencyBars({
  currency,
  history,
}: {
  currency: Currency
  history: History
}) {
  const width = 600
  const height = 160
  const slot = width / Math.max(history.length, 1)
  const barWidth = Math.min(28, slot / 3)
  const max = Math.max(
    1,
    ...history.flatMap((month) => [
      amountOf(month.accrued, currency),
      amountOf(month.collected, currency),
    ])
  )

  return (
    <figure>
      <figcaption className="mb-1 text-sm font-medium">{currency}</figcaption>
      <svg
        viewBox={`0 0 ${width} ${height + 24}`}
        className="w-full"
        role="img"
        aria-label={`Devengado y cobrado por mes en ${currency}`}
      >
        {history.map((month, index) => {
          const accrued = amountOf(month.accrued, currency)
          const collected = amountOf(month.collected, currency)
          const x = index * slot + slot / 2
          const accruedHeight = (accrued / max) * height
          const collectedHeight = (collected / max) * height
          return (
            <g key={month.period}>
              <rect
                x={x - barWidth - 2}
                y={height - accruedHeight}
                width={barWidth}
                height={accruedHeight}
                className="fill-muted-foreground/40"
              >
                <title>
                  {`${periodLabel(month.period)}: devengado ${formatMoney(String(accrued), currency)}`}
                </title>
              </rect>
              <rect
                x={x + 2}
                y={height - collectedHeight}
                width={barWidth}
                height={collectedHeight}
                className="fill-primary"
              >
                <title>
                  {`${periodLabel(month.period)}: cobrado ${formatMoney(String(collected), currency)}`}
                </title>
              </rect>
              <text
                x={x}
                y={height + 16}
                textAnchor="middle"
                className={`fill-muted-foreground text-[18px] sm:text-[11px] ${index % 2 === 1 ? "max-sm:hidden" : ""}`}
              >
                {month.period.slice(5)}/{month.period.slice(2, 4)}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="mt-1 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-muted-foreground/40" />
          Devengado
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-sm bg-primary" />
          Cobrado
        </span>
      </p>
    </figure>
  )
}
