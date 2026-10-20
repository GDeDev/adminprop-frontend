"use client"

import * as React from "react"
import type { UseQueryResult } from "@tanstack/react-query"
import { Building2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  Currency,
  PropertyService,
  ServiceScope,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
import { Skeleton } from "@adminprop/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import { formatDate } from "@/lib/dates"
import {
  INCREASE_FREQUENCY_LABELS,
  SERVICE_PAYER_LABELS,
  SERVICE_SCOPE_LABELS,
  serviceStatusMeta,
} from "@/lib/services"
import { useDeleteService } from "@/lib/services-api"

import { ServiceFormDialog } from "./service-form-dialog"

/** Una fila: un servicio de la propiedad o, visto desde el contrato, con `scope`. */
export type ServiceRow = PropertyService & { scope?: ServiceScope }

export interface ServicesSectionProps {
  /** Sin propiedad (eliminada) se lista pero no se puede agregar. */
  propertyId: string | null
  /** Desde la ficha del contrato: los nuevos son de ese contrato (DT-54). */
  contractId?: string
  defaultCurrency?: Currency
  query: UseQueryResult<ServiceRow[]>
}

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; service: ServiceRow }
  | { kind: "delete"; service: ServiceRow }
  | null

/**
 * Sección "Servicios" de las fichas de propiedad y contrato (spec 5.1):
 * tabla en desktop, lista en mobile, alta rápida y edición en un diálogo.
 */
export function ServicesSection({
  propertyId,
  contractId,
  defaultCurrency,
  query,
}: ServicesSectionProps) {
  const [dialog, setDialog] = React.useState<DialogState>(null)
  // Cambia en cada apertura: el diálogo se monta de nuevo y arranca limpio.
  const [dialogKey, setDialogKey] = React.useState(0)

  function open(state: DialogState) {
    setDialogKey((k) => k + 1)
    setDialog(state)
  }

  return (
    <section className="rounded-xl border bg-card p-4 md:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Servicios</h2>
        {propertyId && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => open({ kind: "create" })}
          >
            <Plus aria-hidden />
            Agregar servicio
          </Button>
        )}
      </div>

      {query.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(query.error, "No se pudieron cargar los servicios.")}
        </p>
      ) : query.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin servicios cargados. Expensas, luz, gas: lo que tenga la propiedad
          y quién lo paga.
        </p>
      ) : (
        <ServiceRows
          services={query.data}
          onEdit={(service) => open({ kind: "edit", service })}
          onDelete={(service) => open({ kind: "delete", service })}
        />
      )}

      {dialog?.kind === "create" && propertyId && (
        <ServiceFormDialog
          key={dialogKey}
          propertyId={propertyId}
          contractId={contractId}
          defaultCurrency={defaultCurrency}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "edit" && (
        <ServiceFormDialog
          key={dialogKey}
          propertyId={dialog.service.propertyId}
          service={dialog.service}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "delete" && (
        <DeleteServiceDialog
          key={dialogKey}
          service={dialog.service}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
    </section>
  )
}

function ServiceRows({
  services,
  onEdit,
  onDelete,
}: {
  services: ServiceRow[]
  onEdit: (service: ServiceRow) => void
  onDelete: (service: ServiceRow) => void
}) {
  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {services.map((service) => {
          const status = serviceStatusMeta(service)
          return (
            <li key={service.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium">{typeName(service)}</p>
                  <p className="text-muted-foreground">
                    Paga el {SERVICE_PAYER_LABELS[service.paidBy].toLowerCase()}{" "}
                    · {service.currency}
                  </p>
                </div>
                <RowActions
                  service={service}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {status && <Badge variant={status.badge}>{status.label}</Badge>}
                <ServiceMarks service={service} />
              </div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <dt>Vence</dt>
                <dd className="tabular-nums">{dueDateLabel(service)}</dd>
                <dt>Aumenta</dt>
                <dd>{increaseLabel(service)}</dd>
              </dl>
            </li>
          )
        })}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Servicio</TableHead>
              <TableHead>Quién paga</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Aumento</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => {
              const status = serviceStatusMeta(service)
              return (
                <TableRow key={service.id}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{typeName(service)}</span>
                      <ServiceMarks service={service} />
                    </div>
                  </TableCell>
                  <TableCell>
                    {SERVICE_PAYER_LABELS[service.paidBy]} · {service.currency}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {dueDateLabel(service)}
                  </TableCell>
                  <TableCell>
                    {status ? (
                      <Badge variant={status.badge}>{status.label}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {increaseLabel(service)}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      service={service}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

/** Alcance (desde el contrato) y la marca de gestión por la inmobiliaria. */
function ServiceMarks({ service }: { service: ServiceRow }) {
  return (
    <>
      {service.scope && (
        <Badge variant="outline">{SERVICE_SCOPE_LABELS[service.scope]}</Badge>
      )}
      {service.managedByAgency && (
        <Badge variant="alquilada">
          <Building2 aria-hidden />
          Gestiona la inmobiliaria
        </Badge>
      )}
    </>
  )
}

function RowActions({
  service,
  onEdit,
  onDelete,
}: {
  service: ServiceRow
  onEdit: (service: ServiceRow) => void
  onDelete: (service: ServiceRow) => void
}) {
  const name = typeName(service)
  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Editar ${name}`}
        onClick={() => onEdit(service)}
      >
        <Pencil aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Eliminar ${name}`}
        onClick={() => onDelete(service)}
      >
        <Trash2 aria-hidden />
      </Button>
    </div>
  )
}

function DeleteServiceDialog({
  service,
  open,
  onOpenChange,
}: {
  service: ServiceRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteService()

  async function confirm() {
    try {
      await remove.mutateAsync(service.id)
      toast.success("Servicio eliminado.")
      onOpenChange(false)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo eliminar el servicio."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>¿Eliminar el servicio?</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {typeName(service)} deja de aparecer en la propiedad y sus
            contratos.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={remove.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => void confirm()}
            disabled={remove.isPending}
          >
            Eliminar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function typeName(service: ServiceRow): string {
  if (!service.serviceType) return "Tipo eliminado"
  return service.serviceType.isActive
    ? service.serviceType.name
    : `${service.serviceType.name} (desactivado)`
}

function dueDateLabel(service: ServiceRow): string {
  return service.hasDueDate ? formatDate(service.dueDate) : "Sin vencimiento"
}

function increaseLabel(service: ServiceRow): string {
  return service.hasIncrease && service.increaseFrequency
    ? INCREASE_FREQUENCY_LABELS[service.increaseFrequency]
    : "Sin aumentos"
}
