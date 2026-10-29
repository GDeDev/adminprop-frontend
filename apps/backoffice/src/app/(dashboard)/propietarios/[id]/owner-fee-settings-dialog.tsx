"use client"

import * as React from "react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  OwnerFeeSettings,
  StatementSendMode,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { Switch } from "@adminprop/ui/components/switch"

import { normalizeAmount } from "@/lib/contracts"
import { SEND_MODE_LABELS } from "@/lib/settlements"
import { useUpdateOwnerFeeSettings } from "@/lib/settlements-api"

/** Honorarios por propietario (Micaela #5) y modo de envío del resumen (#7). Sólo admin. */
export function OwnerFeeSettingsDialog({
  ownerId,
  settings,
  open,
  onOpenChange,
}: {
  ownerId: string
  settings: OwnerFeeSettings
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateOwnerFeeSettings()
  const [custom, setCustom] = React.useState(settings.feePercentage !== null)
  const [percentage, setPercentage] = React.useState(
    settings.feePercentage ?? ""
  )
  const [includesLateFees, setIncludesLateFees] = React.useState(
    settings.feeIncludesLateFees
  )
  const [includesCharges, setIncludesCharges] = React.useState(
    settings.feeIncludesCharges
  )
  const [sendMode, setSendMode] = React.useState<StatementSendMode>(
    settings.statementSendMode
  )
  const [error, setError] = React.useState<string | null>(null)
  const [fieldError, setFieldError] = React.useState<string | null>(null)

  async function submit() {
    setError(null)
    setFieldError(null)
    if (custom && normalizeAmount(percentage) === null) {
      setFieldError("Ingresá el porcentaje.")
      return
    }
    try {
      await update.mutateAsync({
        id: ownerId,
        feePercentage: custom ? normalizeAmount(percentage) : null,
        feeIncludesLateFees: includesLateFees,
        feeIncludesCharges: includesCharges,
        statementSendMode: sendMode,
      })
      toast.success("Honorarios del propietario actualizados.")
      onOpenChange(false)
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo guardar."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Honorarios del propietario
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            El porcentaje propio se usa al crear sus contratos nuevos; la base y
            el envío aplican a todas sus liquidaciones.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 sm:px-0">
          <FieldGroup>
            <Field orientation="horizontal">
              <Switch
                id="fee-custom"
                checked={custom}
                onCheckedChange={setCustom}
              />
              <FieldLabel htmlFor="fee-custom">
                Porcentaje propio (si no, estándar o reducido según sus
                propiedades)
              </FieldLabel>
            </Field>
            {custom && (
              <Field data-invalid={fieldError !== null} className="sm:max-w-xs">
                <FieldLabel htmlFor="fee-percentage">Porcentaje</FieldLabel>
                <Input
                  id="fee-percentage"
                  inputMode="decimal"
                  value={percentage}
                  onChange={(event) => setPercentage(event.target.value)}
                  aria-invalid={fieldError !== null}
                />
                {fieldError && (
                  <FieldError errors={[{ message: fieldError }]} />
                )}
              </Field>
            )}
            <Field orientation="horizontal">
              <Switch
                id="fee-late"
                checked={includesLateFees}
                onCheckedChange={setIncludesLateFees}
              />
              <FieldLabel htmlFor="fee-late">
                Los honorarios también se calculan sobre los punitorios
              </FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <Switch
                id="fee-charges"
                checked={includesCharges}
                onCheckedChange={setIncludesCharges}
              />
              <FieldLabel htmlFor="fee-charges">
                También sobre los cargos (multas, otros)
              </FieldLabel>
            </Field>
            <Field>
              <FieldLabel htmlFor="fee-send-mode">
                Qué se le envía cada mes
              </FieldLabel>
              <Select
                value={sendMode}
                onValueChange={(value) =>
                  setSendMode(value as StatementSendMode)
                }
              >
                <SelectTrigger id="fee-send-mode" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(SEND_MODE_LABELS) as StatementSendMode[]).map(
                    (mode) => (
                      <SelectItem key={mode} value={mode}>
                        {SEND_MODE_LABELS[mode]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FieldDescription>
                Se usa al cerrar el consolidado; el envío real llega con las
                Fases 14 y 15.
              </FieldDescription>
            </Field>
          </FieldGroup>
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={update.isPending}>
            Guardar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
