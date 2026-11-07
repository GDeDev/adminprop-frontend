"use client"

import * as React from "react"
import Link from "next/link"

import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"
import { StatCard } from "@adminprop/ui/components/stat-card"

import { AnalyticsRangeSelect } from "@/components/analytics-range-select"
import { BarList } from "@/components/charts/bar-list"
import { conversionLabel, crmApiError } from "@/lib/crm"
import { useCrmOverview } from "@/lib/crm-api"
import {
  DEFAULT_RANGE,
  VIEWS_NOTICE,
  rangeFor,
  rangeLabel,
  sourceRows,
  stageRows,
} from "@/lib/crm-analytics"
import { todayIso } from "@/lib/dates"

function Figure({ label, value }: { label: string; value: string }) {
  return <StatCard label={label} value={value} className="p-4" />
}

/**
 * Resumen del embudo: cifras, consultas por etapa y por canal, y propiedades
 * más consultadas (`/crm/analytics/overview`). Los gráficos van plegados para
 * que el tablero siga siendo lo primero que se ve.
 */
export function CrmOverview() {
  const [days, setDays] = React.useState<number>(DEFAULT_RANGE)
  const range = React.useMemo(() => rangeFor(days, todayIso()), [days])
  const overview = useCrmOverview(range)

  if (overview.isPending) return <Skeleton className="h-20" />
  if (overview.isError) {
    return (
      <Alert role="alert">
        <AlertDescription>
          {crmApiError(
            overview.error,
            "No se pudo cargar el resumen de consultas."
          )}{" "}
          <Button variant="link" onClick={() => void overview.refetch()}>
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    )
  }
  const data = overview.data

  return (
    <section aria-label="Resumen de consultas" className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label="Abiertas" value={String(data.openCount)} />
        <Figure label="Sin asignar" value={String(data.unassignedCount)} />
        <Figure
          label="Primer contacto (promedio)"
          value={
            data.averageFirstContactHours === null
              ? "—"
              : `${String(data.averageFirstContactHours).replace(".", ",")} h`
          }
        />
        <Figure
          label="Conversión"
          value={conversionLabel(data.conversionRate)}
        />
      </div>
      <details className="rounded-xl border bg-card p-3 text-sm shadow-raised">
        <summary className="inline-flex min-h-11 cursor-pointer items-center font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          Analítica: etapas, canales y propiedades más consultadas
        </summary>
        <div className="mt-2 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{rangeLabel(days)}</p>
            <AnalyticsRangeSelect value={days} onChange={setDays} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <BarList
              title="Consultas por etapa"
              rows={stageRows(data.byStage)}
            />
            <BarList
              title="Consultas por canal"
              rows={sourceRows(data.bySource)}
              emptyText="Todavía no hay consultas en el período."
            />
          </div>
          {data.topProperties.length > 0 ? (
            <section aria-label="Propiedades más consultadas">
              <h3 className="text-sm font-medium">
                Propiedades más consultadas
              </h3>
              <ul className="mt-1 divide-y">
                {data.topProperties.map((property) => (
                  <li key={property.propertyId}>
                    <Link
                      href={`/propiedades/${property.propertyId}`}
                      className="flex min-h-11 items-center justify-between gap-3 py-2 hover:underline"
                    >
                      <span className="min-w-0 truncate">
                        {property.address}
                      </span>
                      <span className="shrink-0 num text-xs text-muted-foreground">
                        {property.inquiries} consultas · {property.views} vistas
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-muted-foreground">
              Todavía no hay propiedades con consultas en el período.
            </p>
          )}
          <p className="text-xs text-muted-foreground">{VIEWS_NOTICE}</p>
        </div>
      </details>
    </section>
  )
}
