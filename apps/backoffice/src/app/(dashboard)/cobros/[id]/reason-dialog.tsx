"use client"

import * as React from "react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { Field, FieldError, FieldLabel } from "@adminprop/ui/components/field"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import { Textarea } from "@adminprop/ui/components/textarea"

export interface ReasonDialogProps {
  title: string
  description: string
  confirmLabel: string
  successMessage: string
  errorMessage: string
  /** Lo que se ejecuta con el motivo; si rechaza, se muestra el error. */
  onConfirm: (reason: string) => Promise<unknown>
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Anular un pago o un cargo (rediseño 4.7): nada se borra, queda la fila con
 * el motivo, quién y cuándo. El motivo es obligatorio.
 */
export function ReasonDialog({
  title,
  description,
  confirmLabel,
  successMessage,
  errorMessage,
  onConfirm,
  open,
  onOpenChange,
}: ReasonDialogProps) {
  const [reason, setReason] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function confirm() {
    const trimmed = reason.trim()
    if (trimmed.length < 3) {
      setError("Contá el motivo (al menos 3 caracteres).")
      return
    }
    setError(null)
    setPending(true)
    try {
      await onConfirm(trimmed)
      toast.success(successMessage)
      onOpenChange(false)
    } catch (cause) {
      setError(apiErrorMessage(cause, errorMessage))
    } finally {
      setPending(false)
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 sm:px-0">
          <Field data-invalid={error !== null}>
            <FieldLabel htmlFor="reason">Motivo</FieldLabel>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              aria-invalid={error !== null}
            />
            {error && <FieldError errors={[{ message: error }]} />}
          </Field>
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => void confirm()}
            disabled={pending}
          >
            {confirmLabel}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
