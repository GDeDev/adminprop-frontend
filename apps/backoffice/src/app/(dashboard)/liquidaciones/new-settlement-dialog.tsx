"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { apiErrorCode, apiErrorMessage } from "@adminprop/session/client"
import { Button } from "@adminprop/ui/components/button"
import { Input } from "@adminprop/ui/components/input"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"

import { PropertySelect } from "@/components/property-select"
import { currentPeriod } from "@/lib/billing"
import { useInfiniteContracts } from "@/lib/contracts-api"
import { useCreateSettlement } from "@/lib/settlements-api"

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/

/**
 * Liquidación a mano (rediseño 4.1): se elige la propiedad (su contrato
 * activo o el último) y el mes de la liquidación. Toma los pagos cobrados
 * por la inmobiliaria que todavía no se liquidaron y los gastos pendientes.
 */
export function NewSettlementDialog({
  contractId,
  open,
  onOpenChange,
}: {
  /** Desde la ficha del contrato ya viene fijo. */
  contractId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const create = useCreateSettlement()
  const [propertyId, setPropertyId] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState(currentPeriod())
  const [error, setError] = React.useState<string | null>(null)
  const contracts = useInfiniteContracts({
    propertyId: propertyId ?? undefined,
  })
  const propertyContract = contracts.data?.pages[0]?.data[0] ?? null
  const resolvedContractId = contractId ?? propertyContract?.id ?? null

  async function confirm() {
    if (!resolvedContractId) {
      setError(
        propertyId ? "Esa propiedad no tiene contratos." : "Elegí la propiedad."
      )
      return
    }
    setError(null)
    try {
      const settlement = await create.mutateAsync({
        contractId: resolvedContractId,
        period,
      })
      toast.success("Liquidación creada.")
      onOpenChange(false)
      router.push(`/liquidaciones/${settlement.id}`)
    } catch (cause) {
      switch (apiErrorCode(cause)) {
        case "SETTLEMENT_NOTHING_TO_SETTLE":
          setError(
            "No hay pagos cobrados por la inmobiliaria ni gastos pendientes para liquidar."
          )
          break
        case "SETTLEMENT_DRAFT_EXISTS":
          setError(
            "Ese contrato ya tiene una liquidación pendiente: confirmala o cancelala antes."
          )
          break
        default:
          setError(apiErrorMessage(cause, "No se pudo crear la liquidación."))
      }
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nueva liquidación</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Toma los pagos que cobró la inmobiliaria y todavía no se liquidaron,
            más los gastos adelantados pendientes del contrato.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="flex flex-col gap-4 px-4 sm:px-0">
          {!contractId && (
            <div>
              <PropertySelect
                value={propertyId}
                onChange={(id) => setPropertyId(id)}
                aria-label="Propiedad"
              />
              {propertyId && contracts.isSuccess && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {propertyContract
                    ? `Contrato de ${propertyContract.renter?.fullName ?? "sin inquilino"}`
                    : "La propiedad no tiene contratos."}
                </p>
              )}
            </div>
          )}
          <div>
            <label className="text-sm font-medium" htmlFor="settlement-period">
              Mes de la liquidación
            </label>
            <Input
              id="settlement-period"
              type="month"
              className="mt-1 w-44"
              value={period}
              onChange={(event) => {
                if (PERIOD.test(event.target.value))
                  setPeriod(event.target.value)
              }}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} disabled={create.isPending}>
            Crear
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
