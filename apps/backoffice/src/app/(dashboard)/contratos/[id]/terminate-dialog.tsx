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
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { formatMoney } from "@/lib/contracts"
import {
  useTerminateContract,
  useTerminationPreview,
} from "@/lib/contracts-api"
import { formatDate, isIsoDate, todayIso } from "@/lib/dates"

/**
 * Rescisión anticipada (spec 5.4): fecha de notificación → vista previa de
 * la multa calculada por la API (RN-09, D-56) → confirmación explícita.
 */
export function TerminateDialog({
  contract,
  open,
  onOpenChange,
}: {
  contract: ContractDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [notifiedAt, setNotifiedAt] = React.useState(() => todayIso())
  const [error, setError] = React.useState<string | null>(null)
  const preview = useTerminationPreview(contract.id, notifiedAt)
  const terminate = useTerminateContract()

  async function confirm() {
    setError(null)
    try {
      const result = await terminate.mutateAsync({
        id: contract.id,
        notifiedAt,
      })
      toast.success(
        `Contrato rescindido. Multa: ${formatMoney(result.penalty, contract.currency)}.`
      )
      onOpenChange(false)
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo rescindir el contrato."))
    }
  }

  const money = (amount: string) => formatMoney(amount, contract.currency)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Rescindir el contrato</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            La propiedad vuelve a estar disponible y el inquilino queda libre.
            La multa es el 10 % del alquiler que faltaba hasta el{" "}
            {formatDate(contract.endDate)}, con el alquiler vigente.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="flex flex-col gap-4 px-4 md:px-0">
          <Field className="sm:max-w-xs">
            <FieldLabel htmlFor="terminate-notified-at">
              Fecha de notificación
            </FieldLabel>
            <Input
              id="terminate-notified-at"
              type="date"
              value={notifiedAt}
              min={contract.startDate}
              max={contract.endDate}
              onChange={(event) => setNotifiedAt(event.target.value)}
            />
            <FieldDescription>
              El día en que el inquilino avisó que se va.
            </FieldDescription>
          </Field>

          {!isIsoDate(notifiedAt) ? (
            <p className="text-sm text-muted-foreground">
              Completá la fecha para ver el cálculo.
            </p>
          ) : preview.isPending ? (
            <div className="flex flex-col gap-2" aria-label="Calculando…">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-6 w-1/3" />
            </div>
          ) : preview.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                {apiErrorMessage(
                  preview.error,
                  "No se pudo calcular la multa."
                )}
              </AlertDescription>
            </Alert>
          ) : (
            <dl
              className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg bg-muted p-3 text-sm"
              aria-label="Vista previa de la rescisión"
            >
              <dt className="text-muted-foreground">Alquiler vigente</dt>
              <dd className="tabular-nums">
                {money(preview.data.currentRent)}
              </dd>
              <dt className="text-muted-foreground">Falta hasta el fin</dt>
              <dd>
                {preview.data.remainingMonths}{" "}
                {preview.data.remainingMonths === 1 ? "mes" : "meses"}
                {preview.data.remainingDays > 0 &&
                  ` y ${preview.data.remainingDays} ${preview.data.remainingDays === 1 ? "día" : "días"}`}
              </dd>
              <dt className="text-muted-foreground">Alquiler futuro</dt>
              <dd className="tabular-nums">{money(preview.data.futureRent)}</dd>
              <dt className="text-muted-foreground">Multa (10 %)</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">
                {money(preview.data.penalty)}
              </dd>
            </dl>
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
            disabled={terminate.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => void confirm()}
            disabled={!preview.isSuccess || terminate.isPending}
          >
            {terminate.isPending ? "Rescindiendo…" : "Confirmar rescisión"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
