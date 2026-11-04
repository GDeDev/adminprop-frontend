"use client"

import * as React from "react"
import { Calculator } from "lucide-react"

import type { Currency } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { formatDateTime } from "@/lib/automations"
import { formatMoney } from "@/lib/contracts"
import { confidenceMeta, valuationApiError } from "@/lib/valuation"
import { useValuationHistory } from "@/lib/valuation-api"

import { AppraisalSheet } from "./appraisal-sheet"

/** Ficha de propiedad → Tasación de alquiler e historial (rediseño Fase 24, sección 8). */
export function AppraisalSection({
  propertyId,
  locationId,
  onUse,
}: {
  propertyId: string
  locationId: string
  onUse?: (price: string, currency: Currency) => void
}) {
  const [open, setOpen] = React.useState(false)
  const history = useValuationHistory(propertyId)

  return (
    <section
      aria-labelledby="appraisal-title"
      className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-raised"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="appraisal-title" className="font-display text-lg font-semibold">
          Historial de tasaciones
        </h2>
        <Button variant="outline" onClick={() => setOpen(true)}>
          <Calculator aria-hidden />
          Sugerir precio
        </Button>
      </div>

      {history.isPending && <Skeleton className="h-16" />}
      {history.isError && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>
            {valuationApiError(
              history.error,
              "No se pudo cargar el historial de tasaciones."
            )}
          </AlertDescription>
        </Alert>
      )}
      {history.data && history.data.data.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Todavía no se tasó esta propiedad.
        </p>
      )}
      {history.data && history.data.data.length > 0 && (
        <ul className="flex flex-col divide-y">
          {history.data.data.map((item) => {
            const confidence = confidenceMeta(item.confidence)
            const money = (amount: string) => formatMoney(amount, item.currency)
            return (
              <li
                key={item.id}
                className="flex flex-col gap-1 py-2 text-sm first:pt-0 last:pb-0"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display font-semibold tabular-nums">
                    {money(item.suggestedPriceRounded)}
                  </span>
                  <Badge variant={confidence.badge}>{confidence.label}</Badge>
                </div>
                <p className="text-muted-foreground tabular-nums">
                  Rango {money(item.minPrice)} a {money(item.maxPrice)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(item.createdAt)} · {item.requestedBy.fullName}
                  {" · "}
                  {item.zoneLabel}
                </p>
              </li>
            )
          })}
        </ul>
      )}

      <AppraisalSheet
        propertyId={propertyId}
        locationId={locationId}
        open={open}
        onOpenChange={setOpen}
        onUse={onUse}
      />
    </section>
  )
}
