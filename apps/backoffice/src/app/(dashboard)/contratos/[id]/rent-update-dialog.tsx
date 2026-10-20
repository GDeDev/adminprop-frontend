"use client"

import * as React from "react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { ContractDetail } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

import {
  formatMoney,
  normalizeAmount,
  RENT_UPDATE_FREQUENCY_LABELS,
  RENT_UPDATE_TYPE_LABELS,
  usesIndex,
} from "@/lib/contracts"
import { useApplyRentUpdate } from "@/lib/contracts-api"
import { formatDate } from "@/lib/dates"

/**
 * Aplica el próximo aumento programado (spec 3.8, D-60). Con ICL/IPC el
 * nuevo alquiler sale de los índices cargados; con Fijo/Otro se escribe. Si
 * todavía no corresponde (409) o falta el índice del mes (422), se muestra
 * el mensaje de la API tal cual.
 */
export function RentUpdateDialog({
  contract,
  open,
  onOpenChange,
}: {
  contract: ContractDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const apply = useApplyRentUpdate()
  const manual = !usesIndex(contract.rentUpdateType)
  const [newRent, setNewRent] = React.useState("")
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function confirm() {
    setError(null)
    setFieldError(null)
    const amount = manual ? normalizeAmount(newRent) : null
    if (manual && amount === null) {
      setFieldError("Ingresá el nuevo alquiler.")
      return
    }
    try {
      const updated = await apply.mutateAsync({
        id: contract.id,
        ...(manual ? { newRent: amount! } : {}),
      })
      toast.success(
        `Aumento aplicado: ahora el alquiler es ${formatMoney(updated.currentRent, updated.currency)}.`
      )
      onOpenChange(false)
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo aplicar el aumento."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Aplicar aumento</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {manual
              ? "El contrato tiene actualización manual: cargá el alquiler nuevo."
              : `El alquiler nuevo sale del ${RENT_UPDATE_TYPE_LABELS[contract.rentUpdateType]} del mes. Si falta cargar el índice, se avisa.`}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-col gap-4 px-4 md:px-0">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-muted p-3 text-sm">
            <dt className="text-muted-foreground">Alquiler vigente</dt>
            <dd className="font-display tabular-nums">
              {formatMoney(contract.currentRent, contract.currency)}
            </dd>
            <dt className="text-muted-foreground">Actualización</dt>
            <dd>
              {RENT_UPDATE_TYPE_LABELS[contract.rentUpdateType]} ·{" "}
              {RENT_UPDATE_FREQUENCY_LABELS[contract.rentUpdateFrequency]}
            </dd>
            <dt className="text-muted-foreground">Próximo aumento</dt>
            <dd>
              {contract.nextRentUpdateOn
                ? formatDate(contract.nextRentUpdateOn)
                : "No quedan aumentos"}
            </dd>
          </dl>
          {manual && (
            <Field data-invalid={fieldError !== null}>
              <FieldLabel htmlFor="rent-update-new-rent">
                Nuevo alquiler
              </FieldLabel>
              <Input
                id="rent-update-new-rent"
                inputMode="decimal"
                autoComplete="off"
                value={newRent}
                onChange={(event) => setNewRent(event.target.value)}
                aria-invalid={fieldError !== null}
              />
              {fieldError ? (
                <FieldError>{fieldError}</FieldError>
              ) : (
                <FieldDescription>
                  En {contract.currency}, con coma o punto para los centavos.
                </FieldDescription>
              )}
            </Field>
          )}
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={apply.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} disabled={apply.isPending}>
            {apply.isPending ? "Aplicando…" : "Aplicar aumento"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
