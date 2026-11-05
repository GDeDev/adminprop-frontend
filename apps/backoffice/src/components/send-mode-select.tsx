"use client"

import type { StatementSendMode } from "@adminprop/shared-types"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@adminprop/ui/components/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { SEND_MODE_LABELS } from "@/lib/settlements"

/** Qué mails salen con cada modo, según dónde se elige (D-229). */
export const SEND_MODE_HELP: Record<
  "owner" | "close",
  Record<StatementSendMode, string>
> = {
  owner: {
    SUMMARY:
      "Recibe un solo email por mes con el consolidado. No se le manda el comprobante de cada liquidación cuando se confirma.",
    RECEIPTS:
      "Recibe el comprobante de cada liquidación cuando se confirma. No se le manda el email del consolidado.",
    BOTH: "Recibe el comprobante de cada liquidación cuando se confirma y, además, el email del consolidado al cerrarlo.",
  },
  close: {
    SUMMARY:
      "Se envía solo el email del consolidado. Los comprobantes que ya salieron al confirmar las liquidaciones no se pueden retirar: para evitarlos, dejá al propietario en «Solo el resumen» antes de confirmar.",
    RECEIPTS:
      "No se envía el email del consolidado. Se reenvían los comprobantes individuales que hayan quedado retenidos.",
    BOTH: "Se envía el email del consolidado y se reenvían los comprobantes individuales que hayan quedado retenidos. Los ya enviados no se duplican.",
  },
}

/**
 * Selector del modo de envío (solo resumen / comprobantes individuales /
 * ambos) con el texto de lo que se envía. Los PDF se generan igual y están en
 * el portal del propietario: el modo controla solo los emails.
 */
export function SendModeSelect({
  id,
  value,
  onChange,
  context,
  label,
}: {
  id: string
  value: StatementSendMode
  onChange: (value: StatementSendMode) => void
  context: "owner" | "close"
  label: string
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value}
        onValueChange={(next) => onChange(next as StatementSendMode)}
      >
        <SelectTrigger
          id={id}
          className="w-full"
          aria-describedby={`${id}-help`}
        >
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
      <FieldDescription id={`${id}-help`}>
        {SEND_MODE_HELP[context][value]} Los PDF se generan igual y quedan
        disponibles en el portal del propietario.
      </FieldDescription>
    </Field>
  )
}
