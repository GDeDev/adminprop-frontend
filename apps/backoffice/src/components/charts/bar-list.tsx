import { barPercent } from "@/lib/crm-analytics"
import type { BarRow } from "@/lib/crm-analytics"

/**
 * Barras horizontales con la etiqueta y el número siempre a la vista: el
 * valor no depende del color ni del largo de la barra. Es una lista común,
 * así que un lector de pantalla la recorre sin ayuda.
 */
export function BarList({
  title,
  rows,
  emptyText = "Sin datos en el período.",
}: {
  title: string
  rows: BarRow[]
  emptyText?: string
}) {
  const max = Math.max(0, ...rows.map((row) => row.value))
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {rows.length === 0 || max === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {rows.map((row) => (
            <li
              key={row.key}
              className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-2 text-sm"
            >
              <span className="truncate">{row.label}</span>
              <span
                aria-hidden
                className="h-3 overflow-hidden rounded-sm bg-muted"
              >
                <span
                  className="block h-full rounded-sm bg-chart-1"
                  style={{ width: `${barPercent(row.value, max)}%` }}
                />
              </span>
              <span className="text-right font-medium tabular-nums">
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
