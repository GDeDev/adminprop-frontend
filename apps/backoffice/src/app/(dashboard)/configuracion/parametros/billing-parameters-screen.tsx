"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, CalendarClock, Info, Percent } from "lucide-react"
import { toast } from "sonner"

import { useSession } from "@adminprop/session/client"
import type {
  TenantSettings,
  UpdateTenantSettingsRequest,
} from "@adminprop/shared-types"
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
import { StatCard } from "@adminprop/ui/components/stat-card"
import { Switch } from "@adminprop/ui/components/switch"

import {
  billingSettingsErrorMessage,
  MAX_PAYMENT_GRACE_DAYS,
  parseGraceDays,
  parseLateFeePercentage,
} from "@/lib/billing-settings"
import {
  useTenantSettings,
  useUpdateTenantSettings,
} from "@/lib/tenant-settings-api"

/** "0.50" → "0,50 %". Solo presentación del string que manda la API. */
function percentLabel(value: string): string {
  return `${value.replace(".", ",")} %`
}

/** Configuración → Parámetros de cobro de la inmobiliaria. Solo administradores. */
export function BillingParametersScreen() {
  const { user } = useSession()
  const settings = useTenantSettings(user?.role === "ADMIN")

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        title="Solo para administradores"
        description="Los parámetros de cobro los edita un administrador."
      />
    )
  }
  if (settings.isPending) return <PageSkeleton />
  if (settings.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          No se pudieron cargar los parámetros de la inmobiliaria.
        </AlertDescription>
      </Alert>
    )
  }
  return <ParametersForm settings={settings.data} />
}

function ParametersForm({ settings }: { settings: TenantSettings }) {
  const update = useUpdateTenantSettings()
  const [percentage, setPercentage] = React.useState(
    settings.dailyLateFeePercentage ?? ""
  )
  const [graceDays, setGraceDays] = React.useState(
    String(settings.paymentGraceDays)
  )
  const [autoApplyCredit, setAutoApplyCredit] = React.useState(
    settings.autoApplyCreditOnGeneration
  )
  const [errors, setErrors] = React.useState<{
    percentage?: string
    graceDays?: string
  }>({})
  const [formError, setFormError] = React.useState<string | null>(null)

  // El % no se puede quitar una vez fijado (D-228): si ya hay uno, el campo
  // no puede quedar vacío; para "sin punitorio" se usa 0.
  const percentageLocked = settings.dailyLateFeePercentage !== null

  async function save(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)
    const next: typeof errors = {}
    const body: UpdateTenantSettingsRequest = {}

    if (percentage.trim() === "") {
      if (percentageLocked) {
        next.percentage =
          "Una vez fijado, el punitorio no se puede quitar. Si no querés cobrar punitorio, ingresá 0."
      }
    } else {
      const parsed = parseLateFeePercentage(percentage)
      if ("error" in parsed) next.percentage = parsed.error
      else if (parsed.value !== settings.dailyLateFeePercentage) {
        body.dailyLateFeePercentage = parsed.value
      }
    }

    const grace = parseGraceDays(graceDays)
    if ("error" in grace) next.graceDays = grace.error
    else if (grace.value !== settings.paymentGraceDays) {
      body.paymentGraceDays = grace.value
    }

    if (autoApplyCredit !== settings.autoApplyCreditOnGeneration) {
      body.autoApplyCreditOnGeneration = autoApplyCredit
    }

    setErrors(next)
    if (Object.keys(next).length > 0) return
    if (Object.keys(body).length === 0) {
      toast.info("No hay cambios para guardar.")
      return
    }
    try {
      await update.mutateAsync(body)
      toast.success("Parámetros de cobro guardados.")
    } catch (cause) {
      setFormError(billingSettingsErrorMessage(cause))
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/configuracion">
            <ChevronLeft aria-hidden />
            Configuración
          </Link>
        </Button>
        <h1 className="mt-2 font-display text-title-lg font-semibold md:text-display-md">
          Parámetros de cobro
        </h1>
        <p className="text-sm text-muted-foreground">
          Valores por defecto de la inmobiliaria. Cada contrato puede fijar los
          suyos.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Punitorio diario"
          icon={Percent}
          value={
            settings.dailyLateFeePercentage === null
              ? "Sin definir"
              : percentLabel(settings.dailyLateFeePercentage)
          }
          animate={false}
          hint="Lo heredan los contratos que no fijan el suyo."
        />
        <StatCard
          label="El punitorio corre desde el día"
          icon={CalendarClock}
          value={String(settings.lateFeeStartDay)}
          animate={false}
          hint={`${settings.paymentGraceDays} días de gracia.`}
        />
      </div>

      <Alert role="note">
        <Info aria-hidden />
        <AlertDescription>
          <p>
            Ya no hay un 5 % por defecto. Si la inmobiliaria no definió un
            punitorio diario, cada contrato nuevo, renovado o con términos
            cambiados tiene que indicar el suyo. Cambiar el valor afecta solo a
            las cuotas que se generen de ahí en adelante; las ya generadas
            conservan el suyo.
          </p>
        </AlertDescription>
      </Alert>

      <form onSubmit={(event) => void save(event)} noValidate>
        <FieldGroup>
          <Field data-invalid={errors.percentage !== undefined}>
            <FieldLabel htmlFor="late-fee-percentage">
              Punitorio diario por defecto (%)
            </FieldLabel>
            <Input
              id="late-fee-percentage"
              inputMode="decimal"
              value={percentage}
              placeholder="0,50"
              aria-invalid={errors.percentage !== undefined}
              onChange={(event) => setPercentage(event.target.value)}
            />
            {errors.percentage ? (
              <FieldError>{errors.percentage}</FieldError>
            ) : (
              <FieldDescription>
                Interés simple sobre el alquiler impago de cada día, de 0 a 100
                con hasta 2 decimales. 0 significa sin punitorio. Una vez fijado
                no se puede quitar.
              </FieldDescription>
            )}
          </Field>
          <Field data-invalid={errors.graceDays !== undefined}>
            <FieldLabel htmlFor="payment-grace-days">
              Días de gracia por defecto
            </FieldLabel>
            <Input
              id="payment-grace-days"
              inputMode="numeric"
              value={graceDays}
              aria-invalid={errors.graceDays !== undefined}
              onChange={(event) => setGraceDays(event.target.value)}
            />
            {errors.graceDays ? (
              <FieldError>{errors.graceDays}</FieldError>
            ) : (
              <FieldDescription>
                Días del mes sin punitorio, de 0 a {MAX_PAYMENT_GRACE_DAYS}. El
                punitorio corre desde el día siguiente.
              </FieldDescription>
            )}
          </Field>
          <Field orientation="horizontal">
            <Switch
              id="auto-apply-credit"
              checked={autoApplyCredit}
              onCheckedChange={setAutoApplyCredit}
              aria-describedby="auto-apply-credit-help"
            />
            <div className="flex flex-col gap-1">
              <FieldLabel htmlFor="auto-apply-credit">
                Aplicar el saldo a favor al generar la cuota
              </FieldLabel>
              <FieldDescription id="auto-apply-credit-help">
                Apagado (lo normal): el saldo a favor del inquilino se aplica a
                mano o al registrar un pago. Encendido: al generar la cuota del
                mes se descuenta solo, de los créditos más viejos a los más
                nuevos y hasta lo que debe la cuota. Aplica solo a las cuotas
                que se generen de ahí en adelante.
              </FieldDescription>
            </div>
          </Field>
        </FieldGroup>
        {formError && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        )}
        <div className="mt-6">
          <Button type="submit" disabled={update.isPending}>
            Guardar
          </Button>
        </div>
      </form>
    </div>
  )
}
