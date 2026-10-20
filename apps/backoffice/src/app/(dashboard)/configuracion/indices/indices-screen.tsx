"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import {
  apiErrorCode,
  apiErrorMessage,
  apiFieldErrors,
  useSession,
} from "@adminprop/session/client"
import type { IndexType } from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@adminprop/ui/components/field"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@adminprop/ui/components/tabs"

import { INDEX_TYPE_LABELS } from "@/lib/contracts"
import { useIndexValues, useRegisterIndexValue } from "@/lib/contracts-api"
import { formatPeriod } from "@/lib/dates"

const INDEX_TYPES: IndexType[] = ["ICL", "IPC"]

const dateTimeFormat = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
})

/**
 * Configuración → Índices (spec Fase 9, 3.8 y D-54): los valores mensuales
 * de ICL e IPC con los que se aplican los aumentos. Hasta que la Fase 13 los
 * traiga de la fuente oficial, un administrador los carga a mano.
 */
export function IndicesScreen() {
  const { user } = useSession()
  const canRegister = user?.role === "ADMIN"
  const [type, setType] = React.useState<IndexType>("ICL")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/configuracion"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Configuración
        </Link>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Índices
        </h1>
        <p className="text-sm text-muted-foreground">
          Valores mensuales de ICL e IPC: con ellos se calculan los aumentos de
          los contratos. Son los mismos para todas las inmobiliarias.
          {!canRegister && " Sólo un administrador puede cargarlos."}
        </p>
      </div>

      {canRegister && <RegisterForm onRegistered={setType} />}

      <Tabs value={type} onValueChange={(value) => setType(value as IndexType)}>
        <TabsList>
          {INDEX_TYPES.map((indexType) => (
            <TabsTrigger key={indexType} value={indexType}>
              {indexType}
            </TabsTrigger>
          ))}
        </TabsList>
        {INDEX_TYPES.map((indexType) => (
          <TabsContent key={indexType} value={indexType} className="pt-4">
            <IndexTable type={indexType} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function IndexTable({ type }: { type: IndexType }) {
  const query = useIndexValues(type)

  if (query.isPending) return <PageSkeleton cards={1} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudieron cargar los índices"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        }
      />
    )
  }
  if (query.data.length === 0) {
    return (
      <EmptyState
        title={`Todavía no hay valores de ${type}`}
        description="Sin el índice del mes, los aumentos de los contratos que lo usan quedan en espera."
      />
    )
  }
  return (
    <div className="rounded-xl border">
      <Table aria-label={`Valores de ${type}`}>
        <TableHeader>
          <TableRow>
            <TableHead>Mes</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead className="hidden sm:table-cell">Cargado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {query.data.map((value) => (
            <TableRow key={value.id}>
              <TableCell className="font-medium tabular-nums">
                {formatPeriod(value.period)}
              </TableCell>
              <TableCell className="text-right font-display tabular-nums">
                {value.value}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {value.source === "manual" ? "Manual" : value.source}
              </TableCell>
              <TableCell className="hidden text-muted-foreground sm:table-cell">
                {dateTimeFormat.format(new Date(value.createdAt))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

const schema = z.object({
  indexType: z.enum(["ICL", "IPC"]),
  period: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Ingresá el mes como AAAA-MM."),
  value: z
    .string()
    .trim()
    .regex(
      /^\d+([.,]\d{1,6})?$/,
      "Ingresá el valor publicado, con hasta 6 decimales."
    ),
})

type FormValues = z.infer<typeof schema>

function RegisterForm({
  onRegistered,
}: {
  onRegistered: (type: IndexType) => void
}) {
  const register = useRegisterIndexValue()
  const [error, setError] = React.useState<string | null>(null)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { indexType: "ICL", period: "", value: "" },
  })

  async function submit(values: FormValues) {
    setError(null)
    try {
      const saved = await register.mutateAsync({
        indexType: values.indexType,
        period: values.period,
        value: values.value.replace(",", "."),
      })
      toast.success(
        `${saved.indexType} de ${formatPeriod(saved.period)} cargado.`
      )
      form.reset({ indexType: values.indexType, period: "", value: "" })
      onRegistered(saved.indexType)
    } catch (cause) {
      const fields = apiFieldErrors(cause)
      let handled = false
      for (const [field, message] of Object.entries(fields)) {
        if (field in schema.shape) {
          form.setError(field as keyof FormValues, { message })
          handled = true
        }
      }
      switch (apiErrorCode(cause)) {
        case "INDEX_PERIOD_TAKEN":
          form.setError("period", {
            message: "Ese mes ya está cargado y no se pisa.",
          })
          handled = true
          break
        case "INDEX_INVALID_PERIOD":
          form.setError("period", { message: "Ingresá el mes como AAAA-MM." })
          handled = true
          break
        case "INDEX_INVALID_VALUE":
          form.setError("value", {
            message: "Ingresá el valor publicado, con hasta 6 decimales.",
          })
          handled = true
          break
      }
      if (!handled) {
        setError(apiErrorMessage(cause, "No se pudo cargar el índice."))
      }
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(submit)}
      noValidate
      className="rounded-xl border bg-card p-4"
      aria-label="Cargar un valor"
    >
      <h2 className="mb-3 font-display text-lg font-semibold">
        Cargar un valor
      </h2>
      {error && (
        <Alert variant="destructive" role="alert" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-[auto_1fr_1fr_auto] sm:items-start">
          <Controller
            name="indexType"
            control={form.control}
            render={({ field }) => (
              <Field className="sm:w-28">
                <FieldLabel htmlFor="index-type">Índice</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as IndexType)}
                >
                  <SelectTrigger id="index-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDEX_TYPES.map((indexType) => (
                      <SelectItem key={indexType} value={indexType}>
                        {indexType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />
          <Controller
            name="period"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="index-period">Mes</FieldLabel>
                <Input
                  {...field}
                  id="index-period"
                  type="month"
                  placeholder="2026-03"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="value"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="index-value">Valor</FieldLabel>
                <Input
                  {...field}
                  id="index-value"
                  inputMode="decimal"
                  autoComplete="off"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Button
            type="submit"
            className="sm:mt-6"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Cargando…" : "Cargar"}
          </Button>
        </div>
        <FieldDescription>
          {INDEX_TYPE_LABELS.ICL} y {INDEX_TYPE_LABELS.IPC}, tal como los
          publica el organismo. Un mes cargado no se pisa.
        </FieldDescription>
      </FieldGroup>
    </form>
  )
}
