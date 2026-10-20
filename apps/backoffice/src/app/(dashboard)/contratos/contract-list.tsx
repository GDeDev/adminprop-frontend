"use client"

import * as React from "react"
import Link from "next/link"
import { FileText, Plus } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { ContractStatus, ContractSummary } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Label } from "@adminprop/ui/components/label"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"
import { Switch } from "@adminprop/ui/components/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import { LoadMore } from "@/components/load-more"
import { PropertySelect } from "@/components/property-select"
import { RenterSelect } from "@/components/renter-select"
import {
  CONTRACT_STATUS_LABELS,
  contractStatusMeta,
  formatMoney,
} from "@/lib/contracts"
import { useInfiniteContracts } from "@/lib/contracts-api"
import { formatDate } from "@/lib/dates"

type StatusFilter = ContractStatus | "ALL"

/** Listado de contratos (spec Fase 9, 5.1). */
export function ContractList() {
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const [expiringSoon, setExpiringSoon] = React.useState(false)
  const [propertyId, setPropertyId] = React.useState<string | null>(null)
  const [renterId, setRenterId] = React.useState<string | null>(null)

  const query = useInfiniteContracts({
    status: status === "ALL" ? undefined : status,
    expiringSoon: expiringSoon || undefined,
    propertyId: propertyId ?? undefined,
    renterId: renterId ?? undefined,
  })
  const contracts = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.pagination.total ?? 0
  const filtered =
    status !== "ALL" || expiringSoon || propertyId !== null || renterId !== null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Contratos
          </h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${total} en total` : " "}
          </p>
        </div>
        <Button asChild>
          <Link href="/contratos/nuevo">
            <Plus aria-hidden />
            Nuevo contrato
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[auto_1fr_1fr_auto]">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger
            className="w-full lg:w-44"
            aria-label="Filtrar por estado"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {(Object.keys(CONTRACT_STATUS_LABELS) as ContractStatus[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {CONTRACT_STATUS_LABELS[key]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <PropertySelect
          value={propertyId}
          onChange={(id) => setPropertyId(id)}
          aria-label="Filtrar por propiedad"
        />
        <RenterSelect
          value={renterId}
          onChange={(id) => setRenterId(id)}
          aria-label="Filtrar por inquilino"
        />
        <div className="flex min-h-11 items-center gap-2 md:min-h-9">
          <Switch
            id="contracts-expiring-soon"
            checked={expiringSoon}
            onCheckedChange={setExpiringSoon}
          />
          <Label htmlFor="contracts-expiring-soon">Sólo por vencer</Label>
        </div>
      </div>

      {query.isPending ? (
        <PageSkeleton cards={3} />
      ) : query.isError ? (
        <EmptyState
          title="No se pudieron cargar los contratos"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={
            filtered
              ? "No hay contratos con esos filtros"
              : "Todavía no cargaste contratos"
          }
          description={
            filtered
              ? "Probá con otros filtros."
              : "Empezá por el primero: necesitás una propiedad con propietario y un inquilino."
          }
          action={
            !filtered && (
              <Button asChild>
                <Link href="/contratos/nuevo">Nuevo contrato</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {contracts.map((contract) => (
              <li key={contract.id}>
                <ContractCard contract={contract} />
              </li>
            ))}
          </ul>
          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Alquiler</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id} className="relative">
                    <TableCell className="font-medium">
                      {/* El link cubre toda la fila (after:absolute). */}
                      <Link
                        href={`/contratos/${contract.id}`}
                        className="after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {contract.property?.address ?? "Propiedad eliminada"}
                      </Link>
                    </TableCell>
                    <TableCell>{contract.renter?.fullName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {contract.owner?.fullName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {periodLabel(contract)}
                    </TableCell>
                    <TableCell className="text-right font-display tabular-nums">
                      {formatMoney(contract.currentRent, contract.currency)}
                    </TableCell>
                    <TableCell>
                      <ContractBadges contract={contract} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <LoadMore
            hasMore={query.hasNextPage}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
    </div>
  )
}

function periodLabel(contract: Pick<ContractSummary, "startDate" | "endDate">) {
  return `${formatDate(contract.startDate)} → ${formatDate(contract.endDate)}`
}

/** Estado del contrato más la alerta de caución vencida (RN-16). */
export function ContractBadges({
  contract,
}: {
  contract: Pick<
    ContractSummary,
    "status" | "expiringSoon" | "expired" | "suretyExpired"
  >
}) {
  const meta = contractStatusMeta(contract)
  return (
    <span className="flex flex-wrap gap-1.5">
      <Badge variant={meta.badge}>{meta.label}</Badge>
      {contract.suretyExpired && (
        <Badge variant="outline">Caución vencida</Badge>
      )}
    </span>
  )
}

function ContractCard({ contract }: { contract: ContractSummary }) {
  return (
    <Link
      href={`/contratos/${contract.id}`}
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">
          {contract.property?.address ?? "Propiedad eliminada"}
        </p>
        <ContractBadges contract={contract} />
      </div>
      <p className="text-sm text-muted-foreground">
        {contract.renter?.fullName ?? "Sin inquilino"}
        {contract.owner && ` · Propietario: ${contract.owner.fullName}`}
      </p>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          {periodLabel(contract)}
        </span>
        <span className="font-display font-medium tabular-nums">
          {formatMoney(contract.currentRent, contract.currency)}
        </span>
      </div>
    </Link>
  )
}
