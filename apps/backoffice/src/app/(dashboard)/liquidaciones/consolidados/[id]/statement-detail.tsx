"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronLeft, Lock, LockOpen, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type {
  OwnerStatementDetail,
  SettlementSummary,
  StatementSendMode,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Checkbox } from "@adminprop/ui/components/checkbox"
import { ConfirmDialog } from "@adminprop/ui/components/confirm-dialog"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Label } from "@adminprop/ui/components/label"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"
import { StatCard } from "@adminprop/ui/components/stat-card"

import { DownloadPdfButton } from "@/components/download-pdf-button"
import { SendModeSelect } from "@/components/send-mode-select"
import { periodLabel } from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"
import {
  adjustmentBreakdown,
  SEND_MODE_LABELS,
  SETTLEMENT_STATUS_META,
  signedMoney,
  settlementLabel,
  STATEMENT_STATUS_META,
} from "@/lib/settlements"
import { AdjustmentBreakdownCell } from "../../adjustment-breakdown-cell"
import {
  useAddStatementSettlements,
  useCloseStatement,
  useRemoveStatementSettlement,
  useReopenStatement,
  useStatement,
  useStatementCandidates,
} from "@/lib/settlements-api"

/** Consolidado mensual por propietario (Micaela #7): cierre manual. */
export function StatementDetailScreen({ id }: { id: string }) {
  const query = useStatement(id)
  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el consolidado"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button variant="outline" asChild>
            <Link href="/liquidaciones?tab=statements">Volver</Link>
          </Button>
        }
      />
    )
  }
  return <Detail statement={query.data} />
}

function Detail({ statement }: { statement: OwnerStatementDetail }) {
  const { user } = useSession()
  const isAdmin = user?.role === "ADMIN"
  const open = statement.status === "OPEN"
  const [adding, setAdding] = React.useState(false)
  const [closing, setClosing] = React.useState(false)
  const [removing, setRemoving] = React.useState<SettlementSummary | null>(null)
  const [reopening, setReopening] = React.useState(false)
  const remove = useRemoveStatementSettlement()
  const reopen = useReopenStatement()
  const meta = STATEMENT_STATUS_META[statement.status]

  async function removeSettlement(settlement: SettlementSummary) {
    try {
      await remove.mutateAsync({
        id: statement.id,
        settlementId: settlement.id,
      })
      toast.success("Liquidación quitada del consolidado.")
    } catch (cause) {
      toast.error(
        apiErrorMessage(
          cause,
          "No se pudo quitar la liquidación del consolidado."
        )
      )
    }
    setRemoving(null)
  }

  async function reopenStatement() {
    try {
      await reopen.mutateAsync(statement.id)
      toast.success("Consolidado reabierto.")
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo reabrir el consolidado."))
    }
    setReopening(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/liquidaciones?tab=statements"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Consolidados
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-title-lg font-semibold md:text-display-md">
              Consolidado de {periodLabel(statement.period)}
            </h1>
            <p className="text-sm text-muted-foreground">
              {statement.owner ? (
                <Link
                  href={`/propietarios/${statement.owner.id}`}
                  className="hover:underline"
                >
                  {statement.owner.fullName}
                </Link>
              ) : (
                "Sin propietario"
              )}
              {" · "}
              {SEND_MODE_LABELS[statement.sendMode]}
              {statement.closedAt &&
                ` · cerrado el ${formatDate(statement.closedAt.slice(0, 10))}${
                  statement.closedBy
                    ? ` por ${statement.closedBy.fullName}`
                    : ""
                }`}
            </p>
            <div className="mt-2">
              <Badge variant={meta.badge}>{meta.label}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {open ? (
              <>
                <Button variant="outline" onClick={() => setAdding(true)}>
                  <Plus aria-hidden />
                  Agregar liquidaciones
                </Button>
                <Button
                  onClick={() => setClosing(true)}
                  disabled={statement.settlements.length === 0}
                >
                  <Lock aria-hidden />
                  Cerrar
                </Button>
              </>
            ) : (
              <>
                <DownloadPdfButton
                  kind="OWNER_STATEMENT"
                  entityId={statement.id}
                  canRegenerate={user?.role === "ADMIN"}
                />
                {isAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => setReopening(true)}
                    disabled={reopen.isPending}
                  >
                    <LockOpen aria-hidden />
                    Reabrir
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {statement.totals.map((total) => (
        <section
          key={total.currency}
          aria-label={`Totales en ${total.currency}`}
          className="flex flex-col gap-3"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={`Alquileres · ${total.currency}`}
              value={formatMoney(total.rentTotal, total.currency)}
            />
            <Stat
              label="Honorarios"
              value={formatMoney(total.feeTotal, total.currency)}
            />
            <Stat
              label="Gastos adelantados"
              value={formatMoney(total.expensesTotal, total.currency)}
            />
            <Stat
              label="Neto"
              value={formatMoney(total.netTotal, total.currency)}
              hint={`transferido ${formatMoney(total.transferredTotal, total.currency)}`}
            />
          </div>
          <AdjustmentTotals total={total} />
        </section>
      ))}

      <section
        className="rounded-xl border bg-card p-4 shadow-raised"
        aria-labelledby="statement-settlements"
      >
        <h2
          id="statement-settlements"
          className="mb-3 font-display text-title-md font-semibold"
        >
          Liquidaciones incluidas
        </h2>
        {statement.settlements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no hay liquidaciones. Agregá las confirmadas del propietario
            que quieras incluir en este resumen.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propiedad</TableHead>
                <TableHead>Liquidación</TableHead>
                <TableHead className="text-right">Alquiler</TableHead>
                <TableHead className="text-right">Honorarios</TableHead>
                <TableHead className="text-right">Gastos</TableHead>
                <TableHead className="text-right">Ajustes</TableHead>
                <TableHead className="text-right">Neto</TableHead>
                <TableHead>Estado</TableHead>
                {open && (
                  <TableHead className="w-0">
                    <span className="sr-only">Quitar</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.settlements.map((settlement) => {
                const money = (amount: string) =>
                  formatMoney(amount, settlement.currency)
                const status = SETTLEMENT_STATUS_META[settlement.status]
                return (
                  <TableRow key={settlement.id}>
                    <TableCell className="max-w-56 whitespace-normal">
                      {settlement.property?.address ?? "Propiedad eliminada"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/liquidaciones/${settlement.id}`}
                        className="hover:underline"
                      >
                        {settlementLabel(settlement)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-display num">
                      {money(settlement.rentTotal)}
                    </TableCell>
                    <TableCell className="text-right font-display num">
                      {money(settlement.feeTotal)}
                    </TableCell>
                    <TableCell className="text-right font-display num">
                      {money(settlement.expensesTotal)}
                    </TableCell>
                    <TableCell className="text-right">
                      <AdjustmentBreakdownCell settlement={settlement} />
                    </TableCell>
                    <TableCell className="text-right font-display num font-medium">
                      {money(settlement.netAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.badge}>{status.label}</Badge>
                    </TableCell>
                    {open && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Quitar ${settlementLabel(settlement)}`}
                          onClick={() => setRemoving(settlement)}
                          disabled={remove.isPending}
                        >
                          <X aria-hidden />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </section>

      {adding && (
        <AddSettlementsDialog
          statement={statement}
          open
          onOpenChange={(isOpen) => !isOpen && setAdding(false)}
        />
      )}
      {closing && (
        <CloseDialog
          statement={statement}
          open
          onOpenChange={(isOpen) => !isOpen && setClosing(false)}
        />
      )}
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="¿Quitar la liquidación del consolidado?"
        description="Vuelve a quedar suelta y se puede agregar a otro consolidado. No se borra."
        confirmLabel="Quitar"
        pending={remove.isPending}
        onConfirm={() => (removing ? removeSettlement(removing) : undefined)}
      />
      <ConfirmDialog
        open={reopening}
        onOpenChange={setReopening}
        title="¿Reabrir el consolidado?"
        description="Vuelve a quedar abierto y se le pueden agregar o quitar liquidaciones. Hay que cerrarlo de nuevo para que el propietario lo vea como definitivo."
        confirmLabel="Reabrir"
        destructive={false}
        pending={reopen.isPending}
        onConfirm={reopenStatement}
      />
    </div>
  )
}

type StatementTotal = OwnerStatementDetail["totals"][number]

/**
 * Retenciones, adelantos y otros ajustes en renglones separados, con signo
 * (negativo = se descuenta al propietario). `adjustmentsTotal` sigue siendo el
 * total de los tres.
 */
function AdjustmentTotals({ total }: { total: StatementTotal }) {
  return (
    <div role="group" aria-label={`Ajustes en ${total.currency}`}>
      <dl className="grid gap-x-6 gap-y-2 rounded-xl border bg-card p-4 text-sm shadow-raised sm:grid-cols-4">
        {adjustmentBreakdown(total).map((item) => (
          <div key={item.key}>
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-display num font-medium">
              {signedMoney(item.amount, total.currency, formatMoney)}
            </dd>
          </div>
        ))}
        <div>
          <dt className="text-muted-foreground">Ajustes (total)</dt>
          <dd className="font-display num font-semibold">
            {signedMoney(total.adjustmentsTotal, total.currency, formatMoney)}
          </dd>
        </div>
      </dl>
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return <StatCard label={label} value={value} hint={hint} />
}

/** Las confirmadas del propietario que todavía no están en ningún consolidado. */
function AddSettlementsDialog({
  statement,
  open,
  onOpenChange,
}: {
  statement: OwnerStatementDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const candidates = useStatementCandidates(statement.id)
  const add = useAddStatementSettlements()
  const [selected, setSelected] = React.useState<string[]>([])

  async function confirm() {
    try {
      await add.mutateAsync({ id: statement.id, settlementIds: selected })
      toast.success(
        `${selected.length} ${selected.length === 1 ? "liquidación agregada" : "liquidaciones agregadas"}.`
      )
      onOpenChange(false)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudieron agregar."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Agregar liquidaciones</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Liquidaciones confirmadas del propietario que no están en otro
            consolidado.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-4 sm:px-0">
          {candidates.isPending ? (
            <p className="text-sm text-muted-foreground">Cargando…</p>
          ) : candidates.isError ? (
            <p className="text-sm text-destructive">
              {apiErrorMessage(
                candidates.error,
                "No se pudieron cargar las candidatas."
              )}
            </p>
          ) : candidates.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay liquidaciones para agregar.
            </p>
          ) : (
            <ul className="flex flex-col divide-y text-sm">
              {candidates.data.map((settlement) => {
                const checked = selected.includes(settlement.id)
                return (
                  <li
                    key={settlement.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Checkbox
                      id={`candidate-${settlement.id}`}
                      checked={checked}
                      onCheckedChange={(value) =>
                        setSelected((current) =>
                          value
                            ? [...current, settlement.id]
                            : current.filter((id) => id !== settlement.id)
                        )
                      }
                    />
                    <Label
                      htmlFor={`candidate-${settlement.id}`}
                      className="flex flex-1 flex-wrap justify-between gap-2"
                    >
                      <span>
                        {settlement.property?.address ?? "Propiedad eliminada"}{" "}
                        · {settlementLabel(settlement)}
                      </span>
                      <span className="font-display num">
                        {formatMoney(settlement.netAmount, settlement.currency)}
                      </span>
                    </Label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={add.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void confirm()}
            disabled={add.isPending || selected.length === 0}
          >
            Agregar
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}

function CloseDialog({
  statement,
  open,
  onOpenChange,
}: {
  statement: OwnerStatementDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const close = useCloseStatement()
  const [sendMode, setSendMode] = React.useState<StatementSendMode>(
    statement.sendMode
  )

  async function confirm() {
    try {
      await close.mutateAsync({ id: statement.id, sendMode })
      toast.success("Consolidado cerrado.")
      onOpenChange(false)
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo cerrar."))
    }
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Cerrar el consolidado</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Los totales quedan congelados y se avisa al propietario según lo que
            elijas acá.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="flex flex-col gap-4 px-4 sm:px-0">
          {statement.totals.map((total) => (
            <div key={total.currency} className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                Lo que se congela · {total.currency}
              </p>
              <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 rounded-lg bg-muted p-3 text-sm">
                {adjustmentBreakdown(total).map((item) => (
                  <React.Fragment key={item.key}>
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="text-right num">
                      {signedMoney(item.amount, total.currency, formatMoney)}
                    </dd>
                  </React.Fragment>
                ))}
                <dt className="border-t pt-1 font-medium">Neto</dt>
                <dd className="border-t pt-1 text-right font-display num font-semibold">
                  {formatMoney(total.netTotal, total.currency)}
                </dd>
              </dl>
            </div>
          ))}
          <SendModeSelect
            id="statement-send-mode"
            label="Qué se envía"
            context="close"
            value={sendMode}
            onChange={setSendMode}
          />
        </div>
        <ResponsiveDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={close.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={() => void confirm()} disabled={close.isPending}>
            Cerrar consolidado
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
