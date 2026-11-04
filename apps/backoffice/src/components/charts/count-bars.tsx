import { shareOfMax } from "@/lib/charts"

export interface CountBarItem {
  key: string
  label: string
  value: number
}

/**
 * Barras horizontales con la cantidad escrita al lado de cada etiqueta: la
 * lista es a la vez el gráfico y su alternativa textual (DT-108).
 */
export function CountBars({
  title,
  items,
}: {
  title: string
  items: CountBarItem[]
}) {
  const max = Math.max(0, ...items.map((item) => item.value))
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {items.length === 0 && (
        <p className="text-xs text-muted-foreground">Sin datos todavía.</p>
      )}
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.key}
            className="grid grid-cols-[minmax(0,8rem)_1fr_2rem] items-center gap-2 text-xs sm:grid-cols-[minmax(0,10rem)_1fr_2rem]"
          >
            <span className="truncate">{item.label}</span>
            <span
              aria-hidden
              className="h-2.5 overflow-hidden rounded-full bg-muted"
            >
              <span
                className="block h-full rounded-full bg-chart-1"
                style={{ width: `${shareOfMax(item.value, max)}%` }}
              />
            </span>
            <span className="text-right tabular-nums">{item.value}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
