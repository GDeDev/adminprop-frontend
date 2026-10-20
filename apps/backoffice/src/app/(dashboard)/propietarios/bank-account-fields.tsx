"use client"

import Link from "next/link"
import {
  Controller,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from "react-hook-form"
import { z } from "zod"

import type { OwnerRef } from "@adminprop/shared-types"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"

/** "0170099 22000006789-1234" → sólo dígitos. */
export function cbuDigits(value: string): string {
  return value.replace(/[\s-]/g, "")
}

/**
 * Sólo el largo se valida acá; los dígitos verificadores los chequea la API
 * (D-40) y el error vuelve al campo con `OWNER_INVALID_CBU`.
 */
export const bankAccountSchema = z.object({
  cbu: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{22}$/.test(cbuDigits(value)), {
      message: "El CBU tiene 22 dígitos.",
    }),
  alias: z.string().trim().max(50),
  bankName: z.string().trim().max(100),
  holder: z.string().trim().max(150),
})

export type BankAccountValues = z.infer<typeof bankAccountSchema>

export function emptyBankAccount(): BankAccountValues {
  return { cbu: "", alias: "", bankName: "", holder: "" }
}

const FIELDS: {
  key: keyof BankAccountValues
  label: string
  autoComplete?: string
  inputMode?: "numeric"
}[] = [
  { key: "cbu", label: "CBU", inputMode: "numeric" },
  { key: "alias", label: "Alias" },
  { key: "bankName", label: "Banco" },
  { key: "holder", label: "Titular", autoComplete: "name" },
]

/**
 * Los cuatro campos de la cuenta, para el alta y para el diálogo de cambio.
 * `sharedWith`: otros propietarios con el mismo CBU (aviso, no bloqueo).
 */
export function BankAccountFields<TValues extends FieldValues>({
  form,
  prefix,
  sharedWith,
}: {
  form: UseFormReturn<TValues>
  /** "bankAccount" cuando los campos están anidados; "" si son de primer nivel. */
  prefix: string
  sharedWith: OwnerRef[]
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map(({ key, label, autoComplete, inputMode }) => {
        const name = (prefix ? `${prefix}.${key}` : key) as Path<TValues>
        const id = `bank-${key}`
        return (
          <Controller
            key={key}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field
                data-invalid={fieldState.invalid}
                className={key === "cbu" ? "sm:col-span-2" : ""}
              >
                <FieldLabel htmlFor={id}>{label}</FieldLabel>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  id={id}
                  inputMode={inputMode}
                  autoComplete={autoComplete}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : key === "cbu" && sharedWith.length > 0 ? (
                  <FieldDescription className="text-warning-foreground">
                    Mismo CBU que{" "}
                    {sharedWith.map((owner, index) => (
                      <span key={owner.id}>
                        {index > 0 && ", "}
                        <Link
                          href={`/propietarios/${owner.id}`}
                          className="underline"
                        >
                          {owner.fullName}
                        </Link>
                      </span>
                    ))}
                    . Se puede guardar igual.
                  </FieldDescription>
                ) : key === "cbu" ? (
                  <FieldDescription>
                    22 dígitos. Se verifica que sea un CBU real.
                  </FieldDescription>
                ) : null}
              </Field>
            )}
          />
        )
      })}
    </div>
  )
}
