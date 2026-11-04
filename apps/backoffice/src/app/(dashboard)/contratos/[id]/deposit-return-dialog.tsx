"use client"

import * as React from "react"
import { Info, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { apiErrorCode, apiErrorMessage } from "@adminprop/session/client"
import type {
  ContractAccountDeposit,
  DepositDeductionConcept,
  DepositReturn,
  PaymentMethod,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  Field,
  FieldDescription,
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
import { Textarea } from "@adminprop/ui/components/textarea"

import {
  CASH_PAYMENT_METHODS,
  DEPOSIT_RETURN_MODE_LABELS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/billing"
import { formatMoney, normalizeAmount } from "@/lib/contracts"
import { todayIso } from "@/lib/dates"
import { DEPOSIT_DEDUCTION_LABELS } from "@/lib/settlements"
import { useRegisterDepositReturn } from "@/lib/settlements-api"

interface DeductionRow {
  key: number
  concept: DepositDeductionConcept
  description: string
  amount: string
  installmentId: string
}

/** Texto del 400 de la devolución según su código; `null` si es otro error. */
export function depositReturnErrorMessage(
  cause: unknown,
  money: (value: string) => string,
  depositAmount: string
): string | null {
  switch (apiErrorCode(cause)) {
    case "DEPOSIT_RETURN_DEDUCTIONS_EXCEED":
      return "Las deducciones superan el monto de referencia: no queda nada para devolver. Revisá los importes."
    case "DEPOSIT_RETURN_INVALID_REFERENCE":
      return "El monto de referencia que ve esta pantalla ya no coincide con el del contrato (por ejemplo, cambió el alquiler vigente). Cerrá el diálogo y volvé a abrirlo para ver el valor actualizado."
    case "DEPOSIT_RETURN_UNBALANCED":
      return `Lo devuelto más las deducciones no coincide con el monto de referencia. Depósito recibido: ${money(depositAmount)}.`
    case "DEPOSIT_RETURN_CONTRACT_ACTIVE":
      return "El contrato sigue vigente: el depósito se devuelve al terminar."
    default:
      return null
  }
}

function referenceExplanation(deposit: ContractAccountDeposit): string {
  switch (deposit.returnMode) {
    case "FIXED":
      return "Se parte de lo que se recibió, sin actualizar."
    case "FOLLOWS_RENT":
      return deposit.suggestedReturn === null
        ? "Sigue al alquiler, pero el alquiler está en otra moneda que el depósito y no se convierte: indicá el monto de referencia a mano."
        : "Se parte del alquiler vigente al cerrar las cuentas (el último mes)."
    case "MANUAL":
      return "Indicá el monto de referencia al cerrar las cuentas."
  }
}

/**
 * Devolución del depósito (Micaela #1, D-227). El modo del contrato fija el
 * monto de referencia: fijo (lo recibido), sigue al alquiler (el vigente al
 * cerrar) o manual (se indica acá). Las deducciones justificadas se descuentan
 * de esa referencia y la API calcula lo que se devuelve: esta pantalla no
 * suma ni resta, solo muestra los strings que responde la API al registrar.
 */
export function DepositReturnDialog({
  contractId,
  deposit,
  installments,
  open,
  onOpenChange,
}: {
  contractId: string
  deposit: ContractAccountDeposit
  /** Cuotas con saldo, para imputar una deducción por deuda. */
  installments: { id: string; period: string; totalDue: string }[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const register = useRegisterDepositReturn()
  const [returnedAt, setReturnedAt] = React.useState(todayIso())
  const [referenceAmount, setReferenceAmount] = React.useState("")
  const [method, setMethod] = React.useState<PaymentMethod>("TRANSFER")
  const [notes, setNotes] = React.useState("")
  const [deductions, setDeductions] = React.useState<DeductionRow[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [invalidRows, setInvalidRows] = React.useState<number[]>([])
  const [result, setResult] = React.useState<DepositReturn | null>(null)
  const money = (value: string) => formatMoney(value, deposit.currency)

  // En los modos automáticos la API conoce la referencia; solo se pide a mano
  // en MANUAL o cuando el alquiler está en otra moneda (no hay cotización).
  const needsReference =
    deposit.returnMode === "MANUAL" || deposit.suggestedReturn === null

  function addDeduction() {
    setDeductions((rows) => [
      ...rows,
      {
        key: Date.now(),
        concept: "DAMAGE",
        description: "",
        amount: "",
        installmentId: "",
      },
    ])
  }

  function updateDeduction(key: number, patch: Partial<DeductionRow>) {
    setDeductions((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row))
    )
  }

  async function submit() {
    setError(null)
    setInvalidRows([])
    if (
      needsReference &&
      !/[1-9]/.test(normalizeAmount(referenceAmount) ?? "")
    ) {
      setError("Indicá el monto de referencia, mayor que cero.")
      return
    }
    const bad = deductions
      .filter(
        (row) =>
          row.description.trim() === "" || normalizeAmount(row.amount) === null
      )
      .map((row) => row.key)
    if (bad.length > 0) {
      setInvalidRows(bad)
      setError(
        "Cada deducción necesita un motivo y un monto: sin motivo no se puede descontar."
      )
      return
    }
    try {
      const saved = await register.mutateAsync({
        contractId,
        returnedAt,
        referenceAmount: needsReference
          ? normalizeAmount(referenceAmount)!
          : undefined,
        method,
        notes: notes.trim() || undefined,
        deductions: deductions.map((row) => ({
          concept: row.concept,
          description: row.description.trim(),
          amount: normalizeAmount(row.amount)!,
          installmentId:
            row.concept === "DEBT" && row.installmentId
              ? row.installmentId
              : undefined,
        })),
      })
      toast.success("Devolución del depósito registrada.")
      setResult(saved)
    } catch (cause) {
      setError(
        depositReturnErrorMessage(cause, money, deposit.amount) ??
          apiErrorMessage(cause, "No se pudo registrar la devolución.")
      )
    }
  }

  if (result) {
    return (
      <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent className="sm:max-w-lg">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Depósito devuelto</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Esto es lo que quedó registrado. Los importes los calculó el
              sistema.
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <DepositReturnSummary result={result} />
          <ResponsiveDialogFooter>
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    )
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Devolver el depósito</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Depósito recibido: {money(deposit.amount)}. Se parte del monto de
            referencia, se descuentan las deducciones y se devuelve el resto.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="max-h-[65vh] overflow-y-auto px-4 sm:px-0">
          <FieldGroup>
            <Alert role="note">
              <Info aria-hidden />
              <AlertDescription>
                <p className="font-medium">
                  Modo del contrato:{" "}
                  {DEPOSIT_RETURN_MODE_LABELS[deposit.returnMode]}
                </p>
                <p>{referenceExplanation(deposit)}</p>
                {deposit.suggestedReturn !== null && (
                  <p className="mt-1">
                    Monto de referencia:{" "}
                    <span className="font-display num font-semibold">
                      {money(deposit.suggestedReturn)}
                    </span>
                  </p>
                )}
              </AlertDescription>
            </Alert>
            {needsReference && (
              <Field>
                <FieldLabel htmlFor="deposit-reference">
                  Monto de referencia ({deposit.currency})
                </FieldLabel>
                <Input
                  id="deposit-reference"
                  inputMode="decimal"
                  value={referenceAmount}
                  onChange={(event) => setReferenceAmount(event.target.value)}
                />
                <FieldDescription>
                  {normalizeAmount(referenceAmount)
                    ? money(normalizeAmount(referenceAmount)!)
                    : "Puede ser mayor que lo recibido."}
                </FieldDescription>
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="deposit-date">Fecha</FieldLabel>
                <Input
                  id="deposit-date"
                  type="date"
                  value={returnedAt}
                  onChange={(event) => setReturnedAt(event.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="deposit-method">Medio</FieldLabel>
                <Select
                  value={method}
                  onValueChange={(value) => setMethod(value as PaymentMethod)}
                >
                  <SelectTrigger id="deposit-method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CASH_PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Deducciones</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDeduction}
              >
                <Plus aria-hidden />
                Agregar
              </Button>
            </div>
            {deductions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin deducciones: se devuelve el monto de referencia completo.
              </p>
            )}
            {deductions.map((row, index) => (
              <div key={row.key} className="grid gap-3 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Deducción {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Quitar deducción ${index + 1}`}
                    onClick={() =>
                      setDeductions((rows) =>
                        rows.filter((r) => r.key !== row.key)
                      )
                    }
                  >
                    <X aria-hidden />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`deduction-concept-${row.key}`}>
                      Tipo
                    </FieldLabel>
                    <Select
                      value={row.concept}
                      onValueChange={(value) =>
                        updateDeduction(row.key, {
                          concept: value as DepositDeductionConcept,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`deduction-concept-${row.key}`}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          Object.keys(
                            DEPOSIT_DEDUCTION_LABELS
                          ) as DepositDeductionConcept[]
                        ).map((c) => (
                          <SelectItem key={c} value={c}>
                            {DEPOSIT_DEDUCTION_LABELS[c]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`deduction-amount-${row.key}`}>
                      Monto
                    </FieldLabel>
                    <Input
                      id={`deduction-amount-${row.key}`}
                      inputMode="decimal"
                      value={row.amount}
                      aria-invalid={invalidRows.includes(row.key)}
                      onChange={(event) =>
                        updateDeduction(row.key, { amount: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor={`deduction-description-${row.key}`}>
                    Motivo (obligatorio)
                  </FieldLabel>
                  <Input
                    id={`deduction-description-${row.key}`}
                    value={row.description}
                    aria-invalid={invalidRows.includes(row.key)}
                    onChange={(event) =>
                      updateDeduction(row.key, {
                        description: event.target.value,
                      })
                    }
                  />
                </Field>
                {row.concept === "DEBT" && installments.length > 0 && (
                  <Field>
                    <FieldLabel htmlFor={`deduction-installment-${row.key}`}>
                      Imputar a la cuota
                    </FieldLabel>
                    <Select
                      value={row.installmentId || "none"}
                      onValueChange={(value) =>
                        updateDeduction(row.key, {
                          installmentId: value === "none" ? "" : value,
                        })
                      }
                    >
                      <SelectTrigger
                        id={`deduction-installment-${row.key}`}
                        className="w-full"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin imputar</SelectItem>
                        {installments.map((installment) => (
                          <SelectItem
                            key={installment.id}
                            value={installment.id}
                          >
                            {installment.period} · debe{" "}
                            {money(installment.totalDue)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Crea un pago con el depósito en esa cuota.
                    </FieldDescription>
                  </Field>
                )}
              </div>
            ))}

            <Field>
              <FieldLabel htmlFor="deposit-notes">Observaciones</FieldLabel>
              <Textarea
                id="deposit-notes"
                rows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
            <FieldDescription>
              El monto a devolver lo calcula el sistema al registrar (referencia
              menos deducciones) y se muestra después.
            </FieldDescription>
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
            disabled={register.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={register.isPending}>
            Registrar devolución
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

/** Lo registrado, tal cual lo devolvió la API (strings, sin recalcular). */
export function DepositReturnSummary({ result }: { result: DepositReturn }) {
  const money = (value: string) => formatMoney(value, result.depositCurrency)
  return (
    <div className="flex flex-col gap-3 px-4 text-sm sm:px-0">
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
        <dt className="text-muted-foreground">Depósito recibido</dt>
        <dd className="text-right num">{money(result.depositAmount)}</dd>
        <dt className="text-muted-foreground">
          Monto de referencia ({DEPOSIT_RETURN_MODE_LABELS[result.mode]})
        </dt>
        <dd className="text-right num">{money(result.referenceAmount)}</dd>
      </dl>
      {result.deductions.length > 0 && (
        <div>
          <h3 className="mb-1 font-medium">Deducciones</h3>
          <ul className="flex flex-col gap-1">
            {result.deductions.map((deduction) => (
              <li
                key={deduction.id}
                className="flex items-start justify-between gap-4"
              >
                <span>
                  {DEPOSIT_DEDUCTION_LABELS[deduction.concept]}:{" "}
                  {deduction.description}
                </span>
                <span className="shrink-0 num">−{money(deduction.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="flex items-baseline justify-between gap-4 rounded-lg bg-muted p-3">
        <span className="font-medium">Devuelto al inquilino</span>
        <span className="font-display num text-title-sm font-semibold">
          {money(result.returnedAmount)}
        </span>
      </p>
    </div>
  )
}
