import type { PropertyInquiryDailyPoint } from "@adminprop/shared-types"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import {
  CHART_GEOMETRY,
  labelIndexes,
  layoutSeries,
  polylinePoints,
} from "@/lib/crm-analytics"
import type { SeriesKey } from "@/lib/crm-analytics"
import { formatDate } from "@/lib/dates"

const SERIES: Record<
  SeriesKey,
  { title: string; unit: string; kind: "line" | "bars"; token: string }
> = {
  views: {
    title: "Vistas por día",
    unit: "vistas",
    kind: "line",
    token: "var(--chart-1)",
  },
  inquiries: {
    title: "Consultas por día",
    unit: "consultas",
    kind: "bars",
    token: "var(--chart-2)",
  },
}

const shortDate = (iso: string) => formatDate(iso).slice(0, 5)

function SeriesChart({
  daily,
  seriesKey,
}: {
  daily: PropertyInquiryDailyPoint[]
  seriesKey: SeriesKey
}) {
  const meta = SERIES[seriesKey]
  const g = CHART_GEOMETRY
  const layout = layoutSeries(daily, seriesKey)
  const summary =
    layout.total === 0
      ? `${meta.title}: sin ${meta.unit} en el período.`
      : `${meta.title}: ${layout.total} ${meta.unit} en total` +
        (layout.peak
          ? `, el máximo fue ${layout.peak.value} el ${formatDate(layout.peak.date)}.`
          : ".")
  const barWidth = Math.max(2, layout.step * 0.6)

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{meta.title}</span>
        <span className="num text-xs text-muted-foreground">
          Total: {layout.total}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${g.width} ${g.height}`}
        role="img"
        aria-label={summary}
        className="h-auto w-full"
      >
        {layout.ticks.map((tick) => {
          const y =
            layout.baseline - (tick / layout.max) * (layout.baseline - g.top)
          return (
            <g key={tick}>
              <line
                x1={g.left}
                x2={g.width - g.right}
                y1={y}
                y2={y}
                stroke="var(--border)"
                strokeWidth={1}
              />
              <text
                x={g.left - 6}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--muted-foreground)"
              >
                {tick}
              </text>
            </g>
          )
        })}
        {meta.kind === "bars"
          ? layout.points.map((point) => (
              <rect
                key={point.date}
                x={point.x - barWidth / 2}
                y={point.y}
                width={barWidth}
                height={Math.max(0, layout.baseline - point.y)}
                fill={meta.token}
              />
            ))
          : layout.points.length > 0 && (
              <>
                <polyline
                  points={polylinePoints(layout.points)}
                  fill="none"
                  stroke={meta.token}
                  strokeWidth={2}
                  strokeLinejoin="round"
                />
                {layout.points.length <= 31 &&
                  layout.points.map((point) => (
                    <circle
                      key={point.date}
                      cx={point.x}
                      cy={point.y}
                      r={2.5}
                      fill={meta.token}
                    />
                  ))}
              </>
            )}
        {labelIndexes(layout.points.length).map((index) => {
          const point = layout.points[index]!
          return (
            <text
              key={point.date}
              x={point.x}
              y={g.height - 8}
              textAnchor={
                index === 0
                  ? "start"
                  : index === layout.points.length - 1
                    ? "end"
                    : "middle"
              }
              fontSize={11}
              fill="var(--muted-foreground)"
            >
              {shortDate(point.date)}
            </text>
          )
        })}
      </svg>
    </figure>
  )
}

/**
 * Serie diaria de vistas (línea) y consultas (barras) en dos gráficos con su
 * propia escala: mezclar ejes de órdenes de magnitud distintos engaña. La
 * forma (línea o barras), el total y el máximo están en texto, y la tabla
 * completa está disponible debajo.
 */
export function DailyChart({ daily }: { daily: PropertyInquiryDailyPoint[] }) {
  if (daily.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay datos diarios para este período.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 lg:grid-cols-2">
        <SeriesChart daily={daily} seriesKey="views" />
        <SeriesChart daily={daily} seriesKey="inquiries" />
      </div>
      <details className="text-sm">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          Ver los datos en una tabla
        </summary>
        <div className="max-h-72 overflow-y-auto">
          <Table>
            <TableCaption className="sr-only">
              Vistas y consultas por día
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Día</TableHead>
                <TableHead className="text-right">Vistas</TableHead>
                <TableHead className="text-right">Consultas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daily.map((point) => (
                <TableRow key={point.date}>
                  <TableCell>{formatDate(point.date)}</TableCell>
                  <TableCell className="text-right num">
                    {point.views}
                  </TableCell>
                  <TableCell className="text-right num">
                    {point.inquiries}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
    </div>
  )
}
