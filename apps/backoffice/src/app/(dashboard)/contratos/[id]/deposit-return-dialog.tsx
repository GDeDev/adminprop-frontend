"use client"

import * as React from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"

import { apiErrorCode, apiErrorMessage } from "@adminprop/session/client"
import type {
  ContractAccountDeposit,
  DepositDeductionConcept,
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

import { CASH_PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from "@/lib/billing"
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

/**
 * Devolución del depósito (Micaela #1, PRD 11.5): lo devuelto más las
 * deducciones justificadas tienen que sumar el depósito; la API lo valida
 * (`DEPOSIT_RETURN_UNBALANCED`). Una deuda con cuota crea un pago en ella.
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
  const [returnedAmount, setReturnedAmount] = React.useState(
    deposit.suggestedReturn ?? ""
  )
  const [method, setMethod] = React.useState<PaymentMethod>("TRANSFER")
  const [notes, setNotes] = React.useState("")
  const [deductions, setDeductions] = React.useState<DeductionRow[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const money = (value: string) => formatMoney(value, deposit.currency)

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
    if (normalizeAmount(returnedAmount) === null) {
      setError("Ingresá el monto devuelto (puede ser 0).")
      return
    }
    for (const row of deductions) {
      if (
        row.description.trim() === "" ||
        normalizeAmount(row.amount) === null
      ) {
        setError("Cada deducción necesita descripción y monto.")
        return
      }
    }
    try {
      await register.mutateAsync({
        contractId,
        returnedAt,
        returnedAmount: normalizeAmount(returnedAmount)!,
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
      onOpenChange(false)
    } catch (cause) {
      switch (apiErrorCode(cause)) {
        case "DEPOSIT_RETURN_UNBALANCED":
          setError(
            `Lo devuelto más las deducciones tiene que sumar ${money(deposit.amount)}.`
          )
          break
        case "DEPOSIT_RETURN_CONTRACT_ACTIVE":
          setError(
            "El contrato sigue vigente: el depósito se devuelve al terminar."
          )
          break
        default:
          setError(
            apiErrorMessage(cause, "No se pudo registrar la devolución.")
          )
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Devolver el depósito</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Depósito recibido: {money(deposit.amount)}.
            {deposit.suggestedReturn &&
              ` Según el contrato corresponde devolver ${money(deposit.suggestedReturn)}.`}{" "}
            Lo devuelto más las deducciones tiene que sumar el depósito.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="max-h-[65vh] overflow-y-auto px-4 sm:px-0">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="deposit-amount">Monto devuelto</FieldLabel>
                <Input
                  id="deposit-amount"
                  inputMode="decimal"
                  value={returnedAmount}
                  onChange={(event) => setReturnedAmount(event.target.value)}
                />
                {normalizeAmount(returnedAmount) && (
                  <FieldDescription>
                    {money(normalizeAmount(returnedAmount)!)}
                  </FieldDescription>
                )}
              </Field>
              <Field>
                <FieldLabel htmlFor="deposit-date">Fecha</FieldLabel>
                <Input
                  id="deposit-date"
                  type="date"
                  value={returnedAt}
                  onChange={(event) => setReturnedAt(event.target.value)}
                />
              </Field>
            </div>
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
                Sin deducciones: se devuelve todo.
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
                      Concepto
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
                      onChange={(event) =>
                        updateDeduction(row.key, { amount: event.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor={`deduction-description-${row.key}`}>
                    Justificación
                  </FieldLabel>
                  <Input
                    id={`deduction-description-${row.key}`}
                    value={row.description}
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
