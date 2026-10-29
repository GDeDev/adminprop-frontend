"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Receipt } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  FeeReceivable,
  OwnerStatementSummary,
  SettlementStatus,
  SettlementSummary,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@adminprop/ui/components/responsive-dialog"
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
import { Tabs, TabsList, TabsTrigger } from "@adminprop/ui/components/tabs"

import { LoadMore } from "@/components/load-more"
import { OwnerSelect } from "@/components/owner-select"
import { PropertySelect } from "@/components/property-select"
import { currentPeriod, isZero, periodLabel } from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"
import {
  FEE_PAYER_LABELS,
  FEE_RECEIVABLE_STATUS_META,
  FEE_SOURCE_LABELS,
  SEND_MODE_LABELS,
  SETTLEMENT_STATUS_META,
  settlementLabel,
  STATEMENT_STATUS_META,
} from "@/lib/settlements"
import {
  useCreateStatement,
  useInfiniteFeeReceivables,
  useInfiniteSettlements,
  useInfiniteStatements,
} from "@/lib/settlements-api"

import { FeePaymentDialog } from "./fee-payment-dialog"
import { NewSettlementDialog } from "./new-settlement-dialog"

type Tab = "settlements" | "statements" | "fees"
type StatusFilter = SettlementStatus | "ALL"
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/

/** Liquidaciones (rediseño Fase 12, sección 7): liquidaciones, consolidados y honorarios. */
export function SettlementsScreen() {
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab")
  const [tab, setTab] = React.useState<Tab>(
    initialTab === "statements" || initialTab === "fees"
      ? initialTab
      : "settlements"
  )
  const [creating, setCreating] = React.useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Liquidaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Lo que se le liquida a cada propietario, los resúmenes mensuales y
            los honorarios de la inmobiliaria.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Nueva liquidación
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList aria-label="Qué ver">
          <TabsTrigger value="settlements">Liquidaciones</TabsTrigger>
          <TabsTrigger value="statements">Consolidados</TabsTrigger>
          <TabsTrigger value="fees">Honorarios</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "settlements" && <SettlementList />}
      {tab === "statements" && <StatementList />}
      {tab === "fees" && <FeeReceivableList />}

      {creating && (
        <NewSettlementDialog
          open
          onOpenChange={(open) => !open && setCreating(false)}
        />
      )}
    </div>
  )
}

function SettlementList() {
  const [ownerId, setOwnerId] = React.useState<string | null>(null)
  const [propertyId, setPropertyId] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState("")
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const query = useInfiniteSettlements({
    ownerId: ownerId ?? undefined,
    propertyId: propertyId ?? undefined,
    period: period || undefined,
    status: status === "ALL" ? undefined : status,
  })
  const settlements = query.data?.pages.flatMap((page) => page.data) ?? []
  const filtered =
    ownerId !== null || propertyId !== null || period !== "" || status !== "ALL"

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto]">
        <OwnerSelect value={ownerId} onChange={(id) => setOwnerId(id)} />
        <PropertySelect
          value={propertyId}
          onChange={(id) => setPropertyId(id)}
          aria-label="Filtrar por propiedad"
        />
        <Input
          type="month"
          aria-label="Filtrar por mes"
          className="w-full lg:w-44"
          value={period}
          onChange={(event) => {
            const value = event.target.value
            if (value === "" || PERIOD.test(value)) setPeriod(value)
          }}
        />
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
            {(Object.keys(SETTLEMENT_STATUS_META) as SettlementStatus[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {SETTLEMENT_STATUS_META[key].label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      {query.isPending ? (
        <PageSkeleton cards={3} />
      ) : query.isError ? (
        <EmptyState
          title="No se pudieron cargar las liquidaciones"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : settlements.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={
            filtered
              ? "No hay liquidaciones con esos filtros"
              : "Todavía no hay liquidaciones"
          }
          description={
            filtered
              ? "Probá con otros filtros."
              : "Se crean solas cuando una cuota se termina de pagar, o a mano con «Nueva liquidación»."
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {settlements.map((settlement) => (
              <li key={settlement.id}>
                <SettlementCard settlement={settlement} />
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Propietario</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Mes</TableHead>
                  <TableHead className="text-right">Alquiler</TableHead>
                  <TableHead className="text-right">Honorarios</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settlements.map((settlement) => (
                  <SettlementRow key={settlement.id} settlement={settlement} />
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

export function SettlementBadges({
  settlement,
}: {
  settlement: Pick<
    SettlementSummary,
    "status" | "hasVoidedPayments" | "statementId"
  >
}) {
  const meta = SETTLEMENT_STATUS_META[settlement.status]
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={meta.badge}>{meta.label}</Badge>
      {settlement.hasVoidedPayments && (
        <Badge variant="outline">Con pago anulado</Badge>
      )}
      {settlement.statementId && (
        <Badge variant="outline">En consolidado</Badge>
      )}
    </div>
  )
}

function SettlementRow({ settlement }: { settlement: SettlementSummary }) {
  const money = (amount: string) => formatMoney(amount, settlement.currency)
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/liquidaciones/${settlement.id}`}
          className="font-medium hover:underline"
        >
          {settlement.owner?.fullName ?? "Sin propietario"}
        </Link>
      </TableCell>
      <TableCell>
        {settlement.property?.address ?? "Propiedad eliminada"}
      </TableCell>
      <TableCell className="capitalize tabular-nums">
        {settlementLabel(settlement)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {money(settlement.rentTotal)}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {settlement.feeDeducted
          ? `−${money(settlement.feeTotal)}`
          : money(settlement.feeTotal)}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {money(settlement.netAmount)}
        {!isZero(settlement.transferredTotal) && (
          <p className="text-xs text-muted-foreground">
            transferido {money(settlement.transferredTotal)}
          </p>
        )}
      </TableCell>
      <TableCell>
        <SettlementBadges settlement={settlement} />
      </TableCell>
    </TableRow>
  )
}

function SettlementCard({ settlement }: { settlement: SettlementSummary }) {
  const money = (amount: string) => formatMoney(amount, settlement.currency)
  return (
    <Link
      href={`/liquidaciones/${settlement.id}`}
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">
          {settlement.owner?.fullName ?? "Sin propietario"}
        </p>
        <SettlementBadges settlement={settlement} />
      </div>
      <p className="text-sm text-muted-foreground">
        {settlement.property?.address ?? "Propiedad eliminada"} ·{" "}
        {settlementLabel(settlement)}
      </p>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          Alquiler {money(settlement.rentTotal)}
        </span>
        <span className="font-display font-medium tabular-nums">
          Neto {money(settlement.netAmount)}
        </span>
      </div>
    </Link>
  )
}

function StatementList() {
  const [creating, setCreating] = React.useState(false)
  const query = useInfiniteStatements({})
  const statements = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setCreating(true)}>
          <Plus aria-hidden />
          Nuevo consolidado
        </Button>
      </div>
      {query.isPending ? (
        <PageSkeleton cards={2} />
      ) : query.isError ? (
        <EmptyState
          title="No se pudieron cargar los consolidados"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : statements.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Todavía no hay consolidados"
          description="Un consolidado agrupa las liquidaciones confirmadas de un propietario en un mes. Se cierra a mano."
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {statements.map((statement) => (
              <li key={statement.id}>
                <StatementCard statement={statement} />
              </li>
            ))}
          </ul>
          <LoadMore
            hasMore={query.hasNextPage}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
      {creating && (
        <NewStatementDialog
          open
          onOpenChange={(open) => !open && setCreating(false)}
        />
      )}
    </div>
  )
}

function StatementCard({ statement }: { statement: OwnerStatementSummary }) {
  const meta = STATEMENT_STATUS_META[statement.status]
  return (
    <Link
      href={`/liquidaciones/consolidados/${statement.id}`}
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">
          {statement.owner?.fullName ?? "Sin propietario"} ·{" "}
          <span className="capitalize">{periodLabel(statement.period)}</span>
        </p>
        <Badge variant={meta.badge}>{meta.label}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">
        {statement.settlementsCount}{" "}
        {statement.settlementsCount === 1 ? "liquidación" : "liquidaciones"} ·{" "}
        {SEND_MODE_LABELS[statement.sendMode]}
        {statement.closedAt &&
          ` · cerrado el ${formatDate(statement.closedAt.slice(0, 10))}`}
      </p>
      <p className="text-sm tabular-nums">
        {statement.totals.length === 0
          ? "Sin totales todavía"
          : statement.totals
              .map((t) => `Neto ${formatMoney(t.netTotal, t.currency)}`)
              .join(" · ")}
      </p>
    </Link>
  )
}

/** Un consolidado por propietario y mes (A-21: se eligen las liquidaciones a mano). */
function NewStatementDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const create = useCreateStatement()
  const [ownerId, setOwnerId] = React.useState<string | null>(null)
  const [period, setPeriod] = React.useState(currentPeriod())
  const [error, setError] = React.useState<string | null>(null)

  async function confirm() {
    if (!ownerId) {
      setError("Elegí el propietario.")
      return
    }
    setError(null)
    try {
      const statement = await create.mutateAsync({ ownerId, period })
      toast.success("Consolidado creado. Agregale las liquidaciones.")
      onOpenChange(false)
      router.push(`/liquidaciones/consolidados/${statement.id}`)
    } catch (cause) {
      setError(apiErrorMessage(cause, "No se pudo crear el consolidado."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Nuevo consolidado</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            El resumen mensual de un propietario. Después se eligen las
            liquidaciones confirmadas que entran y se cierra.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="flex flex-col gap-4 px-4 sm:px-0">
          <OwnerSelect value={ownerId} onChange={(id) => setOwnerId(id)} />
          <div>
            <label className="text-sm font-medium" htmlFor="statement-period">
              Mes
            </label>
            <Input
              id="statement-period"
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

/** Honorarios pendientes de cobro (Micaela 9B y 10): lo que deben los propietarios. */
function FeeReceivableList() {
  const [paying, setPaying] = React.useState<FeeReceivable | null>(null)
  const query = useInfiniteFeeReceivables({})
  const receivables = query.data?.pages.flatMap((page) => page.data) ?? []
  const pending = receivables.filter(
    (r) => r.status === "PENDING" || r.status === "PARTIAL"
  )

  return (
    <div className="flex flex-col gap-4">
      {query.isPending ? (
        <PageSkeleton cards={2} />
      ) : query.isError ? (
        <EmptyState
          title="No se pudieron cargar los honorarios"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : receivables.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No hay honorarios a cobrar"
          description="Acá aparecen los honorarios que no se descontaron en una liquidación: cuando cobra el propietario directo o cuando los paga después."
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {pending.length} pendientes de {receivables.length}. El detalle por
            propietario está en su ficha, en «Cuenta de honorarios».
          </p>
          <ul className="flex flex-col divide-y rounded-xl border bg-card px-4 text-sm">
            {receivables.map((receivable) => {
              const meta = FEE_RECEIVABLE_STATUS_META[receivable.status]
              return (
                <li
                  key={receivable.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {receivable.owner ? (
                        <Link
                          href={`/propietarios/${receivable.owner.id}`}
                          className="hover:underline"
                        >
                          {receivable.owner.fullName}
                        </Link>
                      ) : (
                        "Sin propietario"
                      )}
                      <span className="font-normal text-muted-foreground">
                        {" · "}
                        {receivable.property?.address ??
                          "Propiedad eliminada"}{" "}
                        · cuota {receivable.installmentPeriod}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {FEE_SOURCE_LABELS[receivable.source]} · paga{" "}
                      {FEE_PAYER_LABELS[receivable.payer].toLowerCase()}
                      {receivable.needsReview &&
                        " · revisar: el pago de origen se anuló"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">
                      {formatMoney(receivable.amount, receivable.currency)}
                      {!isZero(receivable.paidAmount) && (
                        <span className="text-xs font-normal text-muted-foreground">
                          {" "}
                          (cobrado{" "}
                          {formatMoney(
                            receivable.paidAmount,
                            receivable.currency
                          )}
                          )
                        </span>
                      )}
                    </span>
                    <Badge variant={meta.badge}>{meta.label}</Badge>
                    {receivable.owner &&
                      (receivable.status === "PENDING" ||
                        receivable.status === "PARTIAL") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPaying(receivable)}
                        >
                          Registrar pago
                        </Button>
                      )}
                  </div>
                </li>
              )
            })}
          </ul>
          <LoadMore
            hasMore={query.hasNextPage}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
      {paying?.owner && (
        <FeePaymentDialog
          key={paying.id}
          owner={paying.owner}
          contractId={paying.contract.id}
          defaultCurrency={paying.currency}
          defaultPayer={paying.payer}
          open
          onOpenChange={(open) => !open && setPaying(null)}
        />
      )}
    </div>
  )
}
