"use client"

import * as React from "react"

import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { CountBars } from "@/components/charts/count-bars"
import { DailyBarsChart } from "@/components/charts/daily-bars-chart"
import { fillDaily } from "@/lib/charts"
import {
  SOURCE_LABELS,
  STAGES,
  STAGE_LABELS,
  conversionLabel,
  crmApiError,
} from "@/lib/crm"
import { usePropertyAnalytics } from "@/lib/crm-api"
import { addDays, todayIso } from "@/lib/dates"

export const ANALYTICS_RANGES = [7, 30, 90] as const
type RangeDays = (typeof ANALYTICS_RANGES)[number]

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/**
 * Vistas, consultas y conversión de una propiedad (`/crm/analytics/properties`)
 * con la serie diaria. Las vistas arrancan en la activación de la función (A-83).
 */
export function PropertyAnalytics({ propertyId }: { propertyId: string }) {
  const [days, setDays] = React.useState<RangeDays>(30)
  const range = React.useMemo(() => {
    const to = todayIso()
    return { from: addDays(to, -days), to }
  }, [days])
  const analytics = usePropertyAnalytics(propertyId, range)
  const data = analytics.data

  return (
    <section
      aria-labelledby="analytics-title"
      className="flex flex-col gap-4 rounded-xl border bg-card p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="analytics-title" className="font-display text-lg font-semibold">
          Interés en la propiedad
        </h2>
        <div role="group" aria-label="Período" className="flex gap-1">
          {ANALYTICS_RANGES.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={option === days ? "default" : "outline"}
              aria-pressed={option === days}
              className="min-h-11 md:min-h-8"
              onClick={() => setDays(option)}
            >
              {option} días
            </Button>
          ))}
        </div>
      </div>
      {analytics.isPending && <Skeleton className="h-32" />}
      {analytics.isError && (
        <div role="alert" className="text-sm text-muted-foreground">
          {crmApiError(
            analytics.error,
            "No se pudieron cargar las analíticas."
          )}{" "}
          <Button variant="link" onClick={() => void analytics.refetch()}>
            Reintentar
          </Button>
        </div>
      )}
      {data && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Figure label="Vistas" value={String(data.views)} />
            <Figure label="Consultas" value={String(data.inquiries)} />
            <Figure
              label="Conversión"
              value={conversionLabel(data.conversionRate)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <DailyBarsChart
              title="Vistas por día"
              unit="vistas"
              tone="chart-1"
              data={fillDaily(data.daily, "views", range.from, range.to)}
            />
            <DailyBarsChart
              title="Consultas por día"
              unit="consultas"
              tone="chart-2"
              data={fillDaily(data.daily, "inquiries", range.from, range.to)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CountBars
              title="Consultas por etapa"
              items={STAGES.map((stage) => ({
                key: stage,
                label: STAGE_LABELS[stage],
                value: data.byStage[stage] ?? 0,
              }))}
            />
            <CountBars
              title="Consultas por origen"
              items={(
                Object.keys(SOURCE_LABELS) as (keyof typeof SOURCE_LABELS)[]
              )
                .map((source) => ({
                  key: source,
                  label: SOURCE_LABELS[source],
                  value: data.bySource[source] ?? 0,
                }))
                .filter((item) => item.value > 0)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Últimos {days} días. Las vistas se cuentan desde la fecha en que se
            activó esta función en la inmobiliaria; antes no hay datos, por eso
            un período anterior muestra 0.
          </p>
        </>
      )}
    </section>
  )
}
