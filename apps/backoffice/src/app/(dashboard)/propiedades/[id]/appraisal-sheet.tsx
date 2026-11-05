"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import type { Currency, ValuationResult } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { AiBadge } from "@adminprop/ui/components/ai-badge"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import { Label } from "@adminprop/ui/components/label"
import {
  RadioGroup,
  RadioGroupItem,
} from "@adminprop/ui/components/radio-group"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

import { formatMoney } from "@/lib/contracts"
import { useAppraiseProperty, useMarketCoverage } from "@/lib/valuation-api"
import {
  buildAppraisalRequest,
  confidenceMeta,
  dataAgeLabel,
  markerPosition,
  valuationApiError,
} from "@/lib/valuation"
import type { AppraisalForm } from "@/lib/valuation"

interface AppraisalSheetProps {
  propertyId: string
  locationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * «Usar este precio»: rellena el formulario, no guarda (rediseño Fase 24,
   * sección 1). Sin esta función el botón no aparece (DT-105).
   */
  onUse?: (price: string, currency: Currency) => void
}

const EMPTY: AppraisalForm = { areaM2: "", bedrooms: "", currency: "" }

/** «Sugerir precio» (rediseño Fase 24, sección 8): bottom sheet con el rango sugerido. */
export function AppraisalSheet({
  propertyId,
  locationId,
  open,
  onOpenChange,
  onUse,
}: AppraisalSheetProps) {
  const coverage = useMarketCoverage(locationId, open)
  const appraise = useAppraiseProperty(propertyId)
  const [form, setForm] = React.useState<AppraisalForm>(EMPTY)
  const [errors, setErrors] = React.useState<
    Partial<Record<"areaM2" | "bedrooms", string>>
  >({})
  const [result, setResult] = React.useState<ValuationResult | null>(null)
  const [apiError, setApiError] = React.useState<string | null>(null)

  function close(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setResult(null)
      setApiError(null)
      setErrors({})
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setApiError(null)
    const built = buildAppraisalRequest(form)
    if (!built.ok) {
      setErrors(built.errors)
      return
    }
    setErrors({})
    try {
      setResult(await appraise.mutateAsync(built.request))
    } catch (error) {
      setApiError(
        valuationApiError(error, "No se pudo calcular la sugerencia.")
      )
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={close}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Sugerir precio de alquiler
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Es una sugerencia a partir de avisos de la zona. No cambia el precio
            de la propiedad: decidís vos.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-col gap-4 px-4 sm:px-0">
          {coverage.data && !coverage.data.enoughData && (
            <Alert role="status">
              <AlertDescription>
                Todavía hay pocos datos de esta zona ({coverage.data.zoneLabel}
                ): {coverage.data.activeComparables} avisos vigentes. Podés
                intentar igual.
              </AlertDescription>
            </Alert>
          )}

          {result ? (
            <ResultView result={result} />
          ) : (
            <form
              id="appraisal-form"
              onSubmit={(event) => void submit(event)}
              noValidate
            >
              <FieldGroup>
                <Field data-invalid={errors.areaM2 !== undefined}>
                  <FieldLabel htmlFor="appraisal-area">
                    Superficie (m²)
                  </FieldLabel>
                  <Input
                    id="appraisal-area"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="52,5"
                    value={form.areaM2}
                    aria-invalid={errors.areaM2 !== undefined}
                    onChange={(event) =>
                      setForm({ ...form, areaM2: event.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    La ficha todavía no guarda la superficie: sin ella se
                    compara por precio total y la sugerencia es menos precisa.
                  </p>
                  {errors.areaM2 && (
                    <FieldError errors={[{ message: errors.areaM2 }]} />
                  )}
                </Field>
                <Field data-invalid={errors.bedrooms !== undefined}>
                  <FieldLabel htmlFor="appraisal-bedrooms">
                    Ambientes (opcional)
                  </FieldLabel>
                  <Input
                    id="appraisal-bedrooms"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="3"
                    value={form.bedrooms}
                    aria-invalid={errors.bedrooms !== undefined}
                    onChange={(event) =>
                      setForm({ ...form, bedrooms: event.target.value })
                    }
                  />
                  {errors.bedrooms && (
                    <FieldError errors={[{ message: errors.bedrooms }]} />
                  )}
                </Field>
                <RadioGroup
                  aria-label="Moneda"
                  value={form.currency === "" ? "DEFAULT" : form.currency}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      currency: value === "DEFAULT" ? "" : (value as Currency),
                    })
                  }
                >
                  {(
                    [
                      ["DEFAULT", "Moneda de la propiedad"],
                      ["ARS", "Pesos (ARS)"],
                      ["USD", "Dólares (USD)"],
                    ] as const
                  ).map(([value, label]) => (
                    <div key={value} className="flex items-center gap-2">
                      <RadioGroupItem value={value} id={`appraisal-${value}`} />
                      <Label htmlFor={`appraisal-${value}`}>{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </FieldGroup>
            </form>
          )}

          {apiError && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}
        </div>

        <ResponsiveDialogFooter>
          {result ? (
            <>
              <Button variant="outline" onClick={() => close(false)}>
                Descartar
              </Button>
              {onUse && (
                <Button
                  onClick={() => {
                    onUse(result.suggestedPrice, result.currency)
                    close(false)
                  }}
                >
                  Usar este precio
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => close(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="appraisal-form"
                disabled={appraise.isPending}
              >
                {appraise.isPending && (
                  <Loader2 aria-hidden className="animate-spin" />
                )}
                Calcular
              </Button>
            </>
          )}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/** Rango en una barra con el precio sugerido marcado, confianza y justificación. */
export function ResultView({ result }: { result: ValuationResult }) {
  const confidence = confidenceMeta(result.confidence)
  const position = markerPosition(
    result.minPrice,
    result.maxPrice,
    result.suggestedPrice
  )
  const age = dataAgeLabel(result.oldestComparableAt)
  const money = (amount: string) => formatMoney(amount, result.currency)

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <div>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          Precio sugerido
          <AiBadge>Sugerido</AiBadge>
        </p>
        <p className="font-display num text-display-md font-semibold">
          {money(result.suggestedPriceRounded)}
        </p>
        <p className="text-xs text-muted-foreground">
          {result.zoneLabel}
          {result.reused && " · tasación reciente reutilizada"}
        </p>
      </div>

      <div>
        <div
          role="img"
          aria-label={`Rango de ${money(result.minPrice)} a ${money(result.maxPrice)}, sugerido ${money(result.suggestedPriceRounded)}`}
          className="relative h-2 rounded-full bg-primary/30"
        >
          <div
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary"
            style={{ left: `${position}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between num text-sm">
          <span>{money(result.minPrice)}</span>
          <span>{money(result.maxPrice)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant={confidence.badge}>{confidence.label}</Badge>
        <span className="text-muted-foreground">
          {result.comparablesUsed}{" "}
          {result.comparablesUsed === 1 ? "aviso" : "avisos"}
          {age && ` · el más viejo ${age}`}
        </span>
      </div>
      {result.zoneWidened && (
        <p className="text-sm text-muted-foreground">
          Se amplió la zona de búsqueda por falta de avisos en la exacta.
        </p>
      )}
      <p className="text-sm">{result.justification}</p>
    </div>
  )
}
