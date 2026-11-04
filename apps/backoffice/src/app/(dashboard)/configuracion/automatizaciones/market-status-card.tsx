"use client"

import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { formatDateTime } from "@/lib/automations"
import {
  SOURCE_LABELS,
  sourceStatusMeta,
  valuationApiError,
} from "@/lib/valuation"
import { useMarketStatus } from "@/lib/valuation-api"

/** Tarjeta «Datos de mercado»: estado de cada fuente de comparables (rediseño Fase 24, sección 8). */
export function MarketStatusCard() {
  const status = useMarketStatus()

  return (
    <section
      aria-labelledby="market-status-title"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
    >
      <div>
        <h2
          id="market-status-title"
          className="font-display text-title-md font-semibold"
        >
          Datos de mercado
        </h2>
        <p className="text-sm text-muted-foreground">
          De acá salen las sugerencias de precio de alquiler. Cada fuente se
          actualiza sola todas las noches.
        </p>
      </div>

      {status.isPending && <Skeleton className="h-20" />}
      {status.isError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {valuationApiError(
              status.error,
              "No se pudo cargar el estado de los datos de mercado."
            )}
          </AlertDescription>
        </Alert>
      )}
      {status.data && (
        <>
          <ul className="flex flex-col divide-y">
            {status.data.sources.map((source) => {
              const meta = sourceStatusMeta(source.status)
              return (
                <li
                  key={source.source}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {SOURCE_LABELS[source.source]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {source.lastIngestAt
                        ? `Último ingreso: ${formatDateTime(source.lastIngestAt)}`
                        : "Sin ingresos todavía"}
                      {" · "}
                      {source.activeComparables} avisos vigentes
                    </p>
                  </div>
                  <Badge variant={meta.badge}>{meta.label}</Badge>
                </li>
              )
            })}
          </ul>
          <p className="text-xs text-muted-foreground">
            Se usan avisos de hasta {status.data.maxAgeDays} días.
          </p>
        </>
      )}
    </section>
  )
}
