"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CalendarPlus, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  BillingSummaryByCurrency,
  CollectionMode,
  InstallmentStatus,
  InstallmentSummary,
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
import { Skeleton } from "@adminprop/ui/components/skeleton"
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
import {
  COLLECTION_MODE_LABELS,
  COLLECTION_MODE_SHORT,
  currentPeriod,
  INSTALLMENT_STATUS_META,
  installmentStatusMeta,
  isZero,
  periodLabel,
  shiftPeriod,
} from "@/lib/billing"
import {
  useBillingSummary,
  useGenerateInstallments,
  useInfiniteInstallments,
} from "@/lib/billing-api"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"

import { PendingPayments } from "./pending-payments"

type StatusFilter = InstallmentStatus | "ALL"
type ModeFilter = CollectionMode | "ALL"
type Tab = "installments" | "payments"

const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/

/** Cobros del mes (spec 5.1): resumen, cuotas con su estado y pagos por confirmar. */
export function BillingScreen() {
  const searchParams = useSearchParams()
  // Desde la ficha del inquilino se llega con `?renterId=`: todas sus cuotas.
  const renterId = searchParams.get("renterId")
  const [period, setPeriod] = React.useState(currentPeriod())
  const [tab, setTab] = React.useState<Tab>("installments")
  const [generating, setGenerating] = React.useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Cobros
          </h1>
          <p className="text-sm text-muted-foreground">
            Cuotas del mes, punitorios y pagos.
          </p>
        </div>
        <Button variant="outline" onClick={() => setGenerating(true)}>
          <CalendarPlus aria-hidden />
          Generar cuotas
        </Button>
      </div>

      {renterId ? (
        <p className="text-sm text-muted-foreground">
          Mostrando todas las cuotas de un inquilino.{" "}
          <Link href="/cobros" className="underline">
            Ver el mes completo
          </Link>
        </p>
      ) : (
        <>
          <PeriodPicker period={period} onChange={setPeriod} />
          <Summary period={period} />
        </>
      )}

      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList aria-label="Qué ver">
          <TabsTrigger value="installments">Cuotas</TabsTrigger>
          <TabsTrigger value="payments">Pagos por confirmar</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "installments" ? (
        <InstallmentList
          period={renterId ? undefined : period}
          renterId={renterId ?? undefined}
        />
      ) : (
        <PendingPayments />
      )}

      {generating && (
        <GenerateDialog
          defaultPeriod={period}
          open
          onOpenChange={(open) => !open && setGenerating(false)}
        />
      )}
    </div>
  )
}

function PeriodPicker({
  period,
  onChange,
}: {
  period: string
  onChange: (period: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Mes anterior"
        onClick={() => onChange(shiftPeriod(period, -1))}
      >
        <ChevronLeft aria-hidden />
      </Button>
      <Input
        type="month"
        aria-label="Mes"
        className="w-44"
        value={period}
        onChange={(event) => {
          if (PERIOD.test(event.target.value)) onChange(event.target.value)
        }}
      />
      <Button
        variant="outline"
        size="icon"
        aria-label="Mes siguiente"
        onClick={() => onChange(shiftPeriod(period, 1))}
      >
        <ChevronRight aria-hidden />
      </Button>
      <span className="font-display text-lg font-semibold capitalize">
        {periodLabel(period)}
      </span>
    </div>
  )
}

/** Totales del mes por moneda (spec 3.2). */
function Summary({ period }: { period: string }) {
  const query = useBillingSummary(period)
  if (query.isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    )
  }
  if (query.isError) {
    return (
      <p className="text-sm text-destructive">
        {apiErrorMessage(query.error, "No se pudo cargar el resumen del mes.")}
      </p>
    )
  }
  if (query.data.byCurrency.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Sin cuotas generadas para este mes.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3">
      {query.data.byCurrency.map((row) => (
        <SummaryRow key={row.currency} row={row} />
      ))}
    </div>
  )
}

function SummaryRow({ row }: { row: BillingSummaryByCurrency }) {
  const money = (amount: string) => formatMoney(amount, row.currency)
  return (
    <section
      aria-label={`Resumen en ${row.currency}`}
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      <Stat
        label={`Cobrado · ${row.currency}`}
        value={money(row.collectedTotal)}
        hint={
          isZero(row.collectedByOwner)
            ? `${row.paid} de ${row.total} cuotas cobradas`
            : `${money(row.collectedByOwner)} cobrado por propietarios`
        }
      />
      <Stat
        label="Pendiente"
        value={money(row.balanceTotal)}
        hint={`${row.pending} pendientes · ${row.partial} parciales`}
        tone={isZero(row.balanceTotal) ? "muted" : "warning"}
      />
      <Stat
        label="Vencidas"
        value={String(row.overdue)}
        hint={`Punitorios devengados: ${money(row.lateFeeAccrued)}`}
        tone={row.overdue > 0 ? "destructive" : "muted"}
      />
      <Stat
        label="Honorarios devengados"
        value={money(row.feeAccruedOnCollected)}
        hint={`Sobre lo cobrado · ${money(row.feeAccruedOnBase)} sobre el total`}
      />
    </section>
  )
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  hint?: string
  tone?: "default" | "muted" | "warning" | "destructive"
}) {
  const color =
    tone === "destructive"
      ? "text-destructive"
      : tone === "warning"
        ? "text-warning"
        : tone === "muted"
          ? "text-muted-foreground"
          : ""
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-display text-xl font-semibold tabular-nums ${color}`}>
        {value}
      </p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function InstallmentList({
  period,
  renterId,
}: {
  period?: string
  renterId?: string
}) {
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const [mode, setMode] = React.useState<ModeFilter>("ALL")
  const query = useInfiniteInstallments({
    period,
    renterId,
    status: status === "ALL" ? undefined : status,
    collectionMode: mode === "ALL" ? undefined : mode,
  })
  const installments = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.pagination.total ?? 0
  const filtered = status !== "ALL" || mode !== "ALL"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger className="w-44" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {(Object.keys(INSTALLMENT_STATUS_META) as InstallmentStatus[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {INSTALLMENT_STATUS_META[key].label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          value={mode}
          onValueChange={(value) => setMode(value as ModeFilter)}
        >
          <SelectTrigger className="w-56" aria-label="Filtrar por quién cobra">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Cobra cualquiera</SelectItem>
            {(Object.keys(COLLECTION_MODE_LABELS) as CollectionMode[]).map(
              (key) => (
                <SelectItem key={key} value={key}>
                  {COLLECTION_MODE_LABELS[key]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {query.data ? `${total} cuotas` : " "}
        </span>
      </div>

      {query.isPending ? (
        <PageSkeleton cards={3} />
      ) : query.isError ? (
        <EmptyState
          title="No se pudieron cargar las cuotas"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : installments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={
            filtered
              ? "No hay cuotas con esos filtros"
              : "No hay cuotas para este mes"
          }
          description={
            filtered
              ? "Probá con otros filtros."
              : "Las cuotas se generan el día configurado de la inmobiliaria, o ahora con «Generar cuotas»."
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {installments.map((installment) => (
              <li key={installment.id}>
                <InstallmentCard installment={installment} />
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inquilino</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Cobra</TableHead>
                  <TableHead className="text-right">Alquiler</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installments.map((installment) => (
                  <InstallmentRow
                    key={installment.id}
                    installment={installment}
                  />
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

/** Badges de una cuota: estado y, si hay, pagos informados sin confirmar. */
export function InstallmentBadges({
  installment,
}: {
  installment: Pick<
    InstallmentSummary,
    "status" | "feeDays" | "pendingConfirmationTotal" | "lateFeeWaived"
  >
}) {
  const meta = installmentStatusMeta(installment)
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant={meta.badge}>{meta.label}</Badge>
      {!isZero(installment.pendingConfirmationTotal) && (
        <Badge variant="outline">Pago sin confirmar</Badge>
      )}
      {installment.lateFeeWaived && (
        <Badge variant="outline">Punitorio condonado</Badge>
      )}
    </div>
  )
}

function InstallmentRow({ installment }: { installment: InstallmentSummary }) {
  const money = (amount: string) => formatMoney(amount, installment.currency)
  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/cobros/${installment.id}`}
          className="font-medium hover:underline"
        >
          {installment.renter?.fullName ?? "Sin inquilino"}
        </Link>
        {installment.paidAt && (
          <p className="text-xs text-muted-foreground">
            Pagó el {formatDate(installment.paidAt)}
          </p>
        )}
      </TableCell>
      <TableCell>
        {installment.property?.address ?? "Propiedad eliminada"}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {COLLECTION_MODE_SHORT[installment.collectionMode]}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {money(installment.baseAmount)}
      </TableCell>
      <TableCell className="text-right font-medium tabular-nums">
        {money(installment.totalDue)}
      </TableCell>
      <TableCell>
        <InstallmentBadges installment={installment} />
      </TableCell>
    </TableRow>
  )
}

function InstallmentCard({ installment }: { installment: InstallmentSummary }) {
  const money = (amount: string) => formatMoney(amount, installment.currency)
  return (
    <Link
      href={`/cobros/${installment.id}`}
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">
          {installment.renter?.fullName ?? "Sin inquilino"}
        </p>
        <InstallmentBadges installment={installment} />
      </div>
      <p className="text-sm text-muted-foreground">
        {installment.property?.address ?? "Propiedad eliminada"} ·{" "}
        {COLLECTION_MODE_SHORT[installment.collectionMode]}
      </p>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground tabular-nums">
          Alquiler {money(installment.baseAmount)}
        </span>
        <span className="font-display font-medium tabular-nums">
          Saldo {money(installment.totalDue)}
        </span>
      </div>
    </Link>
  )
}

/** Spec 3.1: genera las cuotas de un mes; correrlo de nuevo no duplica. */
function GenerateDialog({
  defaultPeriod,
  open,
  onOpenChange,
}: {
  defaultPeriod: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [period, setPeriod] = React.useState(defaultPeriod)
  const generate = useGenerateInstallments()

  async function confirm() {
    try {
      const result = await generate.mutateAsync(period)
      toast.success(
        result.created === 0
          ? `Las ${result.skipped} cuotas de ${periodLabel(result.period)} ya estaban generadas.`
          : `${result.created} cuotas generadas para ${periodLabel(result.period)}${
              result.skipped > 0 ? ` (${result.skipped} ya existían)` : ""
            }.`
      )
      onOpenChange(false)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudieron generar las cuotas."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Generar cuotas</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Una cuota por cada contrato activo del mes, con el alquiler vigente.
            Las que ya existen no se duplican.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 sm:px-0">
          <label className="text-sm font-medium" htmlFor="generate-period">
            Mes
          </label>
          <Input
            id="generate-period"
            type="month"
            className="mt-1 w-44"
            value={period}
            onChange={(event) => {
              if (PERIOD.test(event.target.value)) setPeriod(event.target.value)
            }}
          />
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generate.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} disabled={generate.isPending}>
            Generar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
