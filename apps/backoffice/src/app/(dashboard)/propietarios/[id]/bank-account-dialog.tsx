"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import {
  apiErrorCode,
  apiErrorMessage,
  apiFieldErrors,
} from "@adminprop/session/client"
import type { OwnerDetail } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

import { useOwnerDataCheck, useUpdateOwnerBankAccount } from "@/lib/owners-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

import {
  BankAccountFields,
  bankAccountSchema,
  cbuDigits,
  type BankAccountValues,
} from "../bank-account-fields"

/**
 * Cambio de cuenta bancaria (spec 3.5): acción separada de la edición, con
 * su propio registro en la auditoría. Un CBU repetido avisa, no bloquea.
 */
export function BankAccountDialog({
  owner,
  open,
  onOpenChange,
}: {
  owner: OwnerDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateOwnerBankAccount()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<BankAccountValues>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      cbu: owner.bankAccount.cbu ?? "",
      alias: owner.bankAccount.alias ?? "",
      bankName: owner.bankAccount.bankName ?? "",
      holder: owner.bankAccount.holder ?? "",
    },
  })

  const cbu = useDebouncedValue(
    cbuDigits(useWatch({ control: form.control, name: "cbu" }))
  )
  const check = useOwnerDataCheck({
    cbu: cbu.length === 22 && cbu !== owner.bankAccount.cbu ? cbu : undefined,
    excludeId: owner.id,
  })

  async function onSubmit(values: BankAccountValues) {
    setError(null)
    try {
      await update.mutateAsync({
        id: owner.id,
        cbu: cbuDigits(values.cbu) || null,
        alias: values.alias || null,
        bankName: values.bankName || null,
        holder: values.holder || null,
      })
      toast.success("Cuenta bancaria actualizada.")
      onOpenChange(false)
    } catch (cause) {
      const fields = apiFieldErrors(cause)
      if (fields.cbu) form.setError("cbu", { message: fields.cbu })
      if (apiErrorCode(cause) === "OWNER_INVALID_CBU") {
        form.setError("cbu", { message: "El CBU no es válido." })
      } else if (!fields.cbu) {
        setError(apiErrorMessage(cause, "No se pudo guardar la cuenta."))
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Cuenta bancaria de {owner.fullName}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Acá se le transfieren las liquidaciones. El cambio queda registrado
            con quién lo hizo y qué valor había antes.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form
          id="bank-account-form"
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4 px-4 md:px-0"
        >
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <BankAccountFields
            form={form}
            prefix=""
            sharedWith={check.data?.cbuSharedWith ?? []}
          />
        </form>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={form.formState.isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="bank-account-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Guardando…" : "Guardar cuenta"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
