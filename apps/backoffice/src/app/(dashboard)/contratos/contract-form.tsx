"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft, FileText, X } from "lucide-react"
import {
  Controller,
  useForm,
  useWatch,
  type UseFormSetError,
} from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  apiErrorCode,
  apiErrorMessage,
  apiFieldErrors,
} from "@adminprop/session/client"
import type {
  ContractDetail,
  CreateContractRequest,
  Currency,
  RentUpdateFrequency,
  RentUpdateType,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { Textarea } from "@adminprop/ui/components/textarea"
import { cn } from "@adminprop/ui/lib/utils"

import { GuarantorSelect } from "@/components/guarantor-select"
import { PropertySelect } from "@/components/property-select"
import { RenterSelect } from "@/components/renter-select"
import {
  CURRENCY_LABELS,
  documentProblem,
  formatMoney,
  normalizeAmount,
  RENT_UPDATE_FREQUENCY_LABELS,
  RENT_UPDATE_TYPE_LABELS,
  usesIndex,
} from "@/lib/contracts"
import {
  useCreateContract,
  useRenewContract,
  useUploadContractDocument,
} from "@/lib/contracts-api"
import { addDays, formatDate } from "@/lib/dates"
import { useProperty } from "@/lib/properties-api"
import { useRenter } from "@/lib/renters-api"

import { SuretyFields, suretySchema } from "./[id]/edit-contract-dialog"

const DATE = /^\d{4}-\d{2}-\d{2}$/

const amount = (message: string) =>
  z.string().refine((value) => normalizeAmount(value) !== null, { message })

const schema = z
  .object({
    propertyId: z.string().min(1, "Elegí la propiedad."),
    renterId: z.string().min(1, "Elegí el inquilino."),
    guarantorId: z.string().nullable(),
    initialRent: amount("Ingresá el alquiler inicial.").refine(
      (value) => /[1-9]/.test(normalizeAmount(value) ?? ""),
      { message: "El alquiler tiene que ser mayor a cero." }
    ),
    currency: z.enum(["ARS", "USD"]),
    rentUpdateType: z.enum(["ICL", "IPC", "FIXED", "OTHER"]),
    rentUpdateFrequency: z.enum(["MONTHLY", "QUARTERLY", "FOUR_MONTHLY"]),
    deposit: amount("Ingresá el depósito (puede ser 0)."),
    surety: suretySchema,
    startDate: z.string().regex(DATE, "Ingresá la fecha de inicio."),
    endDate: z.string().regex(DATE, "Ingresá la fecha de fin."),
    notes: z.string().max(5000),
  })
  .superRefine((values, ctx) => {
    if (
      DATE.test(values.startDate) &&
      DATE.test(values.endDate) &&
      values.endDate <= values.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "La fecha de fin tiene que ser posterior a la de inicio.",
      })
    }
  })

type FormValues = z.infer<typeof schema>
type FieldName = keyof FormValues

const STEPS: { title: string; fields: FieldName[] }[] = [
  { title: "Propiedad", fields: ["propertyId"] },
  { title: "Inquilino", fields: ["renterId", "guarantorId"] },
  {
    title: "Condiciones",
    fields: [
      "initialRent",
      "currency",
      "rentUpdateType",
      "rentUpdateFrequency",
      "deposit",
    ],
  },
  { title: "Caución", fields: ["surety"] },
  { title: "Fechas", fields: ["startDate", "endDate", "notes"] },
]

/** Paso al que pertenece un campo (también los anidados: `surety.x`). */
function stepOf(field: string): number {
  const root = field.split(".")[0] as FieldName
  return STEPS.findIndex((step) => step.fields.includes(root))
}

/** Borrador del alta en el navegador (DT-36). Sólo datos, no el PDF. */
const DRAFT_KEY = "adminprop:contract-draft"

const EMPTY: FormValues = {
  propertyId: "",
  renterId: "",
  guarantorId: null,
  initialRent: "",
  currency: "ARS",
  rentUpdateType: "ICL",
  rentUpdateFrequency: "QUARTERLY",
  deposit: "",
  surety: {
    hasSurety: false,
    insurerName: "",
    insurerAlertEmail: "",
    policyNumber: "",
    policyExpiresAt: "",
  },
  startDate: "",
  endDate: "",
  notes: "",
}

/** Un borrador está a medio cargar: se validan los tipos, no las reglas. */
const draftSchema = z
  .object({
    propertyId: z.string(),
    renterId: z.string(),
    guarantorId: z.string().nullable(),
    initialRent: z.string(),
    currency: z.enum(["ARS", "USD"]),
    rentUpdateType: z.enum(["ICL", "IPC", "FIXED", "OTHER"]),
    rentUpdateFrequency: z.enum(["MONTHLY", "QUARTERLY", "FOUR_MONTHLY"]),
    deposit: z.string(),
    surety: z
      .object({
        hasSurety: z.boolean(),
        insurerName: z.string(),
        insurerAlertEmail: z.string(),
        policyNumber: z.string(),
        policyExpiresAt: z.string(),
      })
      .partial(),
    startDate: z.string(),
    endDate: z.string(),
    notes: z.string(),
  })
  .partial()

function readDraft(): FormValues | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = draftSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) return null
    return {
      ...EMPTY,
      ...parsed.data,
      surety: { ...EMPTY.surety, ...parsed.data.surety },
    }
  } catch {
    return null
  }
}

function renewalValues(original: ContractDetail): FormValues {
  return {
    propertyId: original.property?.id ?? "",
    renterId: original.renter?.id ?? "",
    guarantorId: original.guarantor?.id ?? null,
    initialRent: original.currentRent,
    currency: original.currency,
    rentUpdateType: original.rentUpdateType,
    rentUpdateFrequency: original.rentUpdateFrequency,
    deposit: original.deposit,
    surety: {
      hasSurety: original.hasSurety,
      insurerName: original.surety?.insurerName ?? "",
      insurerAlertEmail: original.surety?.insurerAlertEmail ?? "",
      policyNumber: original.surety?.policyNumber ?? "",
      policyExpiresAt: original.surety?.policyExpiresAt ?? "",
    },
    // La renovación arranca cuando termina el original.
    startDate: addDays(original.endDate, 1),
    endDate: "",
    notes: original.notes ?? "",
  }
}

/**
 * Errores de la API → campo. Devuelve el nombre del primer campo marcado
 * (para volver a su paso) o null si no hubo ninguno.
 */
function applyApiErrors(
  error: unknown,
  setError: UseFormSetError<FormValues>
): string | null {
  const marked: string[] = []
  const fields = apiFieldErrors(error)
  for (const [field, message] of Object.entries(fields)) {
    const name = field.startsWith("surety.")
      ? field
      : field in suretySchema.shape
        ? `surety.${field}`
        : field
    if (stepOf(name) >= 0) {
      setError(name as FieldName, { message })
      marked.push(name)
    }
  }
  const byCode: Record<string, [string, string]> = {
    CONTRACT_PROPERTY_ALREADY_RENTED: [
      "propertyId",
      "Esa propiedad ya tiene un contrato activo.",
    ],
    CONTRACT_INVALID_PROPERTY: ["propertyId", "Esa propiedad ya no existe."],
    CONTRACT_PROPERTY_WITHOUT_OWNER: [
      "propertyId",
      "La propiedad no tiene propietario. Asignale uno desde su ficha.",
    ],
    CONTRACT_RENTER_ALREADY_ACTIVE: [
      "renterId",
      "Ese inquilino ya es titular de otro contrato activo.",
    ],
    CONTRACT_INVALID_RENTER: ["renterId", "Ese inquilino ya no existe."],
    CONTRACT_INVALID_GUARANTOR: [
      "guarantorId",
      "Ese garante ya no existe. Elegí otro.",
    ],
    CONTRACT_SURETY_EMAIL_REQUIRED: [
      "surety.insurerAlertEmail",
      "Con caución, el email de alerta es obligatorio.",
    ],
    CONTRACT_DATES_INVALID: [
      "endDate",
      "La fecha de fin tiene que ser posterior a la de inicio.",
    ],
    CONTRACT_INVALID_DATE: ["startDate", "Ingresá una fecha válida."],
    CONTRACT_RENEWAL_START_INVALID: [
      "startDate",
      "La renovación no puede empezar antes que el contrato original.",
    ],
  }
  const code = apiErrorCode(error)
  const match = code ? byCode[code] : undefined
  if (match) {
    setError(match[0] as FieldName, { message: match[1] })
    marked.push(match[0])
  }
  return marked.sort((a, b) => stepOf(a) - stepOf(b))[0] ?? null
}

/**
 * Alta de contrato como wizard (spec Fase 9, 5.3), el más largo del sistema,
 * con borrador en el navegador como el de propiedades. Con `original` es una
 * renovación (spec 3.7): mismos pasos precargados, la propiedad fija, y al
 * confirmar el original queda finalizado.
 */
export function ContractForm({ original }: { original?: ContractDetail }) {
  const router = useRouter()
  const renewing = original !== undefined
  const [step, setStep] = React.useState(0)
  const [pdf, setPdf] = React.useState<File | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [initialDraft] = React.useState(() =>
    renewing || typeof window === "undefined" ? null : readDraft()
  )
  const [draftRestored, setDraftRestored] = React.useState(
    initialDraft !== null
  )

  const create = useCreateContract()
  const renew = useRenewContract()
  const upload = useUploadContractDocument()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: renewing ? renewalValues(original) : (initialDraft ?? EMPTY),
  })

  const values = useWatch({ control: form.control })
  React.useEffect(() => {
    if (renewing) return
    try {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values))
    } catch {
      // Sin storage (modo privado): el wizard funciona igual, sin borrador.
    }
  }, [renewing, values])

  const propertyId = values.propertyId ?? ""
  const renterId = values.renterId ?? ""
  const property = useProperty(propertyId, !renewing)
  const renter = useRenter(renterId)

  // Al elegir un inquilino, su garante actual queda precargado (una vez por
  // inquilino: si después lo cambian a mano, no se pisa).
  const prefilledFor = React.useRef<string | null>(
    original?.renter?.id ?? initialDraft?.renterId ?? null
  )
  React.useEffect(() => {
    const data = renter.data
    if (!data || data.id !== renterId || prefilledFor.current === data.id) {
      return
    }
    prefilledFor.current = data.id
    form.setValue("guarantorId", data.guarantor?.id ?? null)
  }, [renter.data, renterId, form])

  function discardDraft() {
    try {
      window.localStorage.removeItem(DRAFT_KEY)
    } catch {
      // nada que borrar
    }
    form.reset(EMPTY)
    setDraftRestored(false)
    setStep(0)
  }

  async function next() {
    const fields = STEPS[step]!.fields
    if (!(await form.trigger(fields))) return
    if (step === 0 && !renewing && property.data && !property.data.owner) {
      form.setError("propertyId", {
        message: "La propiedad no tiene propietario. Asignale uno primero.",
      })
      return
    }
    setStep((s) => s + 1)
  }

  async function onSubmit(data: FormValues) {
    setError(null)
    const body: Omit<CreateContractRequest, "propertyId"> = {
      renterId: data.renterId,
      guarantorId: data.guarantorId,
      startDate: data.startDate,
      endDate: data.endDate,
      initialRent: normalizeAmount(data.initialRent)!,
      currency: data.currency,
      rentUpdateType: data.rentUpdateType,
      rentUpdateFrequency: data.rentUpdateFrequency,
      deposit: normalizeAmount(data.deposit)!,
      hasSurety: data.surety.hasSurety,
      insurerName: data.surety.insurerName || null,
      insurerAlertEmail: data.surety.insurerAlertEmail || null,
      policyNumber: data.surety.policyNumber || null,
      policyExpiresAt: data.surety.policyExpiresAt || null,
      notes: data.notes.trim() || null,
    }
    try {
      const saved = renewing
        ? await renew.mutateAsync({ id: original.id, ...body })
        : await create.mutateAsync({ propertyId: data.propertyId, ...body })

      if (!renewing) {
        try {
          window.localStorage.removeItem(DRAFT_KEY)
        } catch {
          // ignorado
        }
      }

      if (pdf) {
        try {
          await upload.mutateAsync({
            id: saved.id,
            kind: "contract",
            file: pdf,
          })
        } catch (cause) {
          toast.error(
            `El contrato se guardó, pero el PDF no se subió: ${apiErrorMessage(cause, "probá de nuevo desde la ficha.")}`
          )
        }
      }

      toast.success(renewing ? "Contrato renovado." : "Contrato creado.")
      router.push(`/contratos/${saved.id}`)
    } catch (cause) {
      const first = applyApiErrors(cause, form.setError)
      setError(apiErrorMessage(cause, "No se pudo guardar el contrato."))
      // Volver al paso del primer campo con error.
      if (first) setStep(stepOf(first))
    }
  }

  const isLast = step === STEPS.length - 1
  const submitting = form.formState.isSubmitting
  const backHref = renewing ? `/contratos/${original.id}` : "/contratos"
  const guarantorLabel =
    values.guarantorId && values.guarantorId === renter.data?.guarantor?.id
      ? renter.data.guarantor.fullName
      : values.guarantorId && values.guarantorId === original?.guarantor?.id
        ? original.guarantor.fullName
        : undefined

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div>
        <Link
          href={backHref}
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          {renewing ? "Volver al contrato" : "Contratos"}
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          {renewing ? "Renovar contrato" : "Nuevo contrato"}
        </h1>
        {renewing && (
          <p className="text-sm text-muted-foreground">
            Se crea un contrato nuevo con estos datos y el actual queda
            finalizado.
          </p>
        )}
      </div>

      <ol
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${STEPS.length}, 1fr)` }}
      >
        {STEPS.map((s, index) => (
          <li key={s.title} className="flex flex-col gap-1">
            <span
              className={cn(
                "h-1.5 rounded-full",
                index <= step ? "bg-primary" : "bg-muted"
              )}
            />
            <span
              className={cn(
                "text-xs",
                index === step ? "font-medium" : "text-muted-foreground"
              )}
              aria-current={index === step ? "step" : undefined}
            >
              {index + 1}. {s.title}
            </span>
          </li>
        ))}
      </ol>

      {draftRestored && (
        <Alert>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            Recuperamos lo que habías cargado.
            <Button variant="ghost" size="sm" onClick={discardDraft}>
              Empezar de cero
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (isLast) void form.handleSubmit(onSubmit)()
          else void next()
        }}
        noValidate
        className="flex flex-col gap-6"
      >
        {/* Paso 1: propiedad → propietario */}
        <FieldGroup className={step === 0 ? "" : "hidden"}>
          {renewing ? (
            <ReadOnlyBox label="Propiedad">
              {original.property?.address ?? "—"}
              <span className="block text-muted-foreground">
                Propietario: {original.owner?.fullName ?? "—"}
              </span>
            </ReadOnlyBox>
          ) : (
            <Controller
              name="propertyId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="contract-property">Propiedad</FieldLabel>
                  <PropertySelect
                    id="contract-property"
                    value={field.value || null}
                    withoutActiveContract
                    placeholder="Elegí la propiedad"
                    onChange={(id) => field.onChange(id ?? "")}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      Sólo las que no tienen un contrato activo.{" "}
                      <Link href="/propiedades/nueva" className="underline">
                        Cargar una propiedad nueva
                      </Link>
                      .
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
          )}
          {!renewing && propertyId && property.data && (
            <OwnerBox property={property.data} />
          )}
        </FieldGroup>

        {/* Paso 2: inquilino → garante */}
        <FieldGroup className={step === 1 ? "" : "hidden"}>
          <Controller
            name="renterId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contract-renter">Inquilino</FieldLabel>
                <RenterSelect
                  id="contract-renter"
                  value={field.value || null}
                  selectedLabel={
                    original?.renter?.id === field.value
                      ? original?.renter?.fullName
                      : undefined
                  }
                  withoutActiveContract
                  placeholder="Elegí el inquilino"
                  onChange={(id) => field.onChange(id ?? "")}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Sólo los que no son titulares de otro contrato activo.{" "}
                    <Link href="/inquilinos/nuevo" className="underline">
                      Cargar un inquilino nuevo
                    </Link>
                    .
                  </FieldDescription>
                )}
              </Field>
            )}
          />
          <Controller
            name="guarantorId"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contract-guarantor">Garante</FieldLabel>
                <GuarantorSelect
                  id="contract-guarantor"
                  value={field.value}
                  selectedLabel={guarantorLabel}
                  onChange={(id) => field.onChange(id)}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Se precarga el garante del inquilino; se puede cambiar o
                    crear uno nuevo desde ahí mismo.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Paso 3: condiciones económicas */}
        <FieldGroup className={step === 2 ? "" : "hidden"}>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <Controller
              name="initialRent"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="contract-initial-rent">
                    Alquiler inicial
                  </FieldLabel>
                  <Input
                    {...field}
                    id="contract-initial-rent"
                    inputMode="decimal"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      {normalizeAmount(field.value)
                        ? formatMoney(
                            normalizeAmount(field.value)!,
                            values.currency ?? "ARS"
                          )
                        : "Mensual, con coma o punto para los centavos."}
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
            <Controller
              name="currency"
              control={form.control}
              render={({ field }) => (
                <Field className="sm:w-44">
                  <FieldLabel htmlFor="contract-currency">Moneda</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as Currency)}
                  >
                    <SelectTrigger id="contract-currency" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CURRENCY_LABELS) as Currency[]).map((c) => (
                        <SelectItem key={c} value={c}>
                          {CURRENCY_LABELS[c]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="rentUpdateType"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="contract-update-type">
                    Actualización
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as RentUpdateType)
                    }
                  >
                    <SelectTrigger id="contract-update-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(RENT_UPDATE_TYPE_LABELS) as RentUpdateType[]
                      ).map((t) => (
                        <SelectItem key={t} value={t}>
                          {RENT_UPDATE_TYPE_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>
                    {usesIndex(field.value)
                      ? "El aumento sale del índice del mes (Configuración → Índices)."
                      : "El monto de cada aumento se carga a mano."}
                  </FieldDescription>
                </Field>
              )}
            />
            <Controller
              name="rentUpdateFrequency"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="contract-update-frequency">
                    Frecuencia del aumento
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value as RentUpdateFrequency)
                    }
                  >
                    <SelectTrigger
                      id="contract-update-frequency"
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        Object.keys(
                          RENT_UPDATE_FREQUENCY_LABELS
                        ) as RentUpdateFrequency[]
                      ).map((f) => (
                        <SelectItem key={f} value={f}>
                          {RENT_UPDATE_FREQUENCY_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />
          </div>
          <Controller
            name="deposit"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="sm:max-w-xs">
                <FieldLabel htmlFor="contract-deposit">
                  Depósito en garantía
                </FieldLabel>
                <Input
                  {...field}
                  id="contract-deposit"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Queda fijo: no sigue a los aumentos.
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        </FieldGroup>

        {/* Paso 4: caución */}
        <FieldGroup className={step === 3 ? "" : "hidden"}>
          <SuretyFields form={form} prefix="contract" />
          {values.surety?.hasSurety && (
            <FieldDescription>
              La póliza en PDF se sube después, desde la ficha del contrato.
            </FieldDescription>
          )}
        </FieldGroup>

        {/* Paso 5: fechas y documento */}
        <FieldGroup className={step === 4 ? "" : "hidden"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              name="startDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="contract-start-date">Inicio</FieldLabel>
                  <Input
                    {...field}
                    id="contract-start-date"
                    type="date"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    renewing && (
                      <FieldDescription>
                        El contrato actual termina el{" "}
                        {formatDate(original.endDate)}.
                      </FieldDescription>
                    )
                  )}
                </Field>
              )}
            />
            <Controller
              name="endDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="contract-end-date">Fin</FieldLabel>
                  <Input
                    {...field}
                    id="contract-end-date"
                    type="date"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>Último día, inclusive.</FieldDescription>
                  )}
                </Field>
              )}
            />
          </div>
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contract-notes">
                  Observaciones internas
                </FieldLabel>
                <Textarea {...field} id="contract-notes" rows={3} />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <PdfPicker file={pdf} onChange={setPdf} />
          <p className="text-sm text-muted-foreground">
            Los servicios de la propiedad y quién paga cada uno se cargan en la
            próxima etapa.
          </p>
        </FieldGroup>

        <div className="flex justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0 || submitting}
          >
            Atrás
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? "Guardando…"
              : isLast
                ? renewing
                  ? "Renovar contrato"
                  : "Crear contrato"
                : "Siguiente"}
          </Button>
        </div>
      </form>
    </div>
  )
}

/** Paso 1: el propietario sale de la propiedad (D-58); sin propietario no hay contrato. */
function OwnerBox({
  property,
}: {
  property: NonNullable<ReturnType<typeof useProperty>["data"]>
}) {
  if (!property.owner) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Esta propiedad no tiene propietario y sin propietario no se puede
          hacer el contrato.{" "}
          <Link
            href={`/propiedades/${property.id}/editar`}
            className="underline"
          >
            Asignale uno
          </Link>{" "}
          y volvé.
        </AlertDescription>
      </Alert>
    )
  }
  return (
    <ReadOnlyBox label="Propietario">
      {property.owner.fullName}
      <span className="block text-muted-foreground">
        Sale de la propiedad; los honorarios se fijan al crear el contrato.
      </span>
    </ReadOnlyBox>
  )
}

function ReadOnlyBox({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-muted p-3 text-sm">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  )
}

/** Paso 5: el PDF del contrato firmado. Se sube después de crearlo (DT-35). */
function PdfPicker({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  function pick(list: FileList | null) {
    const picked = list?.[0]
    if (!picked) return
    const problem = documentProblem(picked)
    if (problem) {
      toast.warning(problem)
      return
    }
    onChange(picked)
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="contract-pdf"
        className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground hover:bg-muted"
      >
        <FileText aria-hidden className="size-6" />
        {file
          ? "Cambiar el PDF del contrato"
          : "Adjuntar el contrato firmado (PDF, hasta 10 MB)"}
        <input
          id="contract-pdf"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(event) => {
            pick(event.target.files)
            event.target.value = ""
          }}
        />
      </label>
      {file ? (
        <p className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
          <span className="truncate">{file.name}</span>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Quitar el PDF"
            onClick={() => onChange(null)}
          >
            <X aria-hidden />
          </Button>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Podés saltear este paso y subirlo después desde la ficha.
        </p>
      )}
    </div>
  )
}
