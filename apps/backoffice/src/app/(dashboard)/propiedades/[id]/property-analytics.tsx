"use client"

import * as React from "react"

import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { AnalyticsRangeSelect } from "@/components/analytics-range-select"
import { BarList } from "@/components/charts/bar-list"
import { DailyChart } from "@/components/charts/daily-chart"
import { conversionLabel, crmApiError } from "@/lib/crm"
import { usePropertyAnalytics } from "@/lib/crm-api"
import {
  DEFAULT_RANGE,
  VIEWS_NOTICE,
  fillDaily,
  rangeFor,
  rangeLabel,
  sourceRows,
  stageRows,
} from "@/lib/crm-analytics"
import { todayIso } from "@/lib/dates"

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/** Vistas, consultas, conversión y serie diaria de la propiedad (`/crm/analytics/properties/:id`). */
export function PropertyAnalytics({ propertyId }: { propertyId: string }) {
  const [days, setDays] = React.useState<number>(DEFAULT_RANGE)
  const range = React.useMemo(() => rangeFor(days, todayIso()), [days])
  const analytics = usePropertyAnalytics(propertyId, range)

  return (
    <section
      aria-labelledby="analytics-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="analytics-title" className="font-display text-lg font-semibold">
          Interés en la propiedad
        </h2>
        <AnalyticsRangeSelect value={days} onChange={setDays} />
      </div>
      {analytics.isPending && <Skeleton className="h-40" />}
      {analytics.isError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {crmApiError(
              analytics.error,
              "No se pudieron cargar las analíticas."
            )}{" "}
            <Button variant="link" onClick={() => void analytics.refetch()}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {analytics.data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Figure label="Vistas" value={String(analytics.data.views)} />
            <Figure
              label="Consultas"
              value={String(analytics.data.inquiries)}
            />
            <Figure
              label="Conversión"
              value={conversionLabel(analytics.data.conversionRate)}
            />
          </div>
          <DailyChart
            daily={fillDaily(analytics.data.daily ?? [], range.from, range.to)}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <BarList
              title="Consultas por etapa"
              rows={stageRows(analytics.data.byStage)}
              emptyText="Todavía no hay consultas en el período."
            />
            <BarList
              title="Consultas por canal"
              rows={sourceRows(analytics.data.bySource ?? {})}
              emptyText="Todavía no hay consultas en el período."
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {rangeLabel(days)}. {VIEWS_NOTICE}
          </p>
        </>
      )}
    </section>
  )
}
