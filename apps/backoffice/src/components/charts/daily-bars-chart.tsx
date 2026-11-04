import * as React from "react"

import { layoutBars } from "@/lib/charts"
import type { DailyValue } from "@/lib/charts"
import { formatDate } from "@/lib/dates"

const WIDTH = 600
const HEIGHT = 120

/**
 * Barras por día en SVG propio. El color es solo un refuerzo: el título, los
 * ejes con números y la tabla alternativa dicen lo mismo con texto (DT-108).
 * `tone` elige un token del sistema de diseño, nunca un hex.
 */
export function DailyBarsChart({
  title,
  unit,
  data,
  tone,
}: {
  title: string
  unit: string
  data: DailyValue[]
  tone: "chart-1" | "chart-2"
}) {
  const id = React.useId()
  const { bars, max } = layoutBars(data, WIDTH, HEIGHT)
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const first = data[0]
  const last = data[data.length - 1]
  const fill = tone === "chart-1" ? "fill-chart-1" : "fill-chart-2"

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {total} en total
        </span>
      </figcaption>
      <svg
        role="img"
        aria-labelledby={`${id}-label`}
        viewBox={`0 0 ${WIDTH + 32} ${HEIGHT + 4}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
      >
        <title id={`${id}-label`}>
          {title}: {total} {unit} entre {first ? formatDate(first.date) : "—"} y{" "}
          {last ? formatDate(last.date) : "—"}. Máximo por día en el eje: {max}.
        </title>
        <g className="stroke-border" strokeWidth={1}>
          <line x1={32} x2={WIDTH + 32} y1={HEIGHT} y2={HEIGHT} />
          <line x1={32} x2={WIDTH + 32} y1={0} y2={0} strokeDasharray="3 4" />
        </g>
        <g className="fill-muted-foreground text-[10px]">
          <text x={28} y={10} textAnchor="end">
            {max}
          </text>
          <text x={28} y={HEIGHT} textAnchor="end">
            0
          </text>
        </g>
        <g transform="translate(32 0)" className={fill}>
          {bars
            .filter((bar) => bar.height > 0)
            .map((bar) => (
              <rect
                key={bar.date}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                rx={1}
              />
            ))}
        </g>
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{first ? formatDate(first.date) : ""}</span>
        <span>{last ? formatDate(last.date) : ""}</span>
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          Ver los datos en tabla
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto">
          <table className="w-full text-left">
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                <th scope="col" className="py-1 pr-2 font-medium">
                  Día
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {unit}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.date} className="border-t">
                  <th scope="row" className="py-1 pr-2 font-normal">
                    {formatDate(item.date)}
                  </th>
                  <td className="py-1 text-right tabular-nums">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  )
}
