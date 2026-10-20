"use client"

import * as React from "react"
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type { AdvanceExpense, ContractDetail } from "@adminprop/shared-types"
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
import { Tabs, TabsList, TabsTrigger } from "@adminprop/ui/components/tabs"

import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"
import { expenseStatusMeta } from "@/lib/services"
import { useAdvanceExpenses, useDeleteAdvanceExpense } from "@/lib/services-api"

import { AdvanceExpenseDialog } from "./advance-expense-dialog"

type Filter = "all" | "pending" | "settled"

const FILTER_LABELS: Record<Filter, string> = {
  all: "Todos",
  pending: "Pendientes",
  settled: "Descontados",
}

const FILTER_SETTLED: Record<Filter, boolean | undefined> = {
  all: undefined,
  pending: false,
  settled: true,
}

type DialogState =
  | { kind: "create" }
  | { kind: "edit"; expense: AdvanceExpense }
  | { kind: "delete"; expense: AdvanceExpense }
  | null

/**
 * "Gastos adelantados" de la ficha del contrato (spec 5.2): lo que pagó el
 * inquilino, con comprobante, y si ya se descontó en una liquidación. Los
 * totales son del contrato entero, sin importar el filtro.
 */
export function AdvanceExpensesSection({
  contract,
}: {
  contract: Pick<ContractDetail, "id" | "currency">
}) {
  const { user } = useSession()
  const [filter, setFilter] = React.useState<Filter>("all")
  const query = useAdvanceExpenses(contract.id, FILTER_SETTLED[filter])
  const [dialog, setDialog] = React.useState<DialogState>(null)
  // Cambia en cada apertura: el diálogo se monta de nuevo y arranca limpio.
  const [dialogKey, setDialogKey] = React.useState(0)
  const canDelete = user?.role === "ADMIN"

  function open(state: DialogState) {
    setDialogKey((k) => k + 1)
    setDialog(state)
  }

  return (
    <section className="rounded-xl border bg-card p-4 md:col-span-2">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">
          Gastos adelantados
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => open({ kind: "create" })}
        >
          <Plus aria-hidden />
          Registrar gasto
        </Button>
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as Filter)}
      >
        <TabsList aria-label="Filtrar gastos">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((option) => (
            <TabsTrigger key={option} value={option}>
              {FILTER_LABELS[option]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-4">
        {query.isPending ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : query.isError ? (
          <p className="text-sm text-destructive">
            {apiErrorMessage(query.error, "No se pudieron cargar los gastos.")}
          </p>
        ) : (
          <>
            {query.data.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {filter === "all"
                  ? "Sin gastos adelantados. Lo que pague el inquilino por cuenta del propietario se registra acá, con el comprobante."
                  : `Sin gastos ${FILTER_LABELS[filter].toLowerCase()}.`}
              </p>
            ) : (
              <ExpenseRows
                expenses={query.data.items}
                canDelete={canDelete}
                onEdit={(expense) => open({ kind: "edit", expense })}
                onDelete={(expense) => open({ kind: "delete", expense })}
              />
            )}
            <dl
              className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm"
              aria-label="Totales del contrato"
            >
              <div>
                <dt className="text-xs text-muted-foreground">
                  Pendiente de descuento
                </dt>
                <dd className="font-display text-lg font-semibold tabular-nums">
                  {formatMoney(query.data.pendingTotal, contract.currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Ya descontado</dt>
                <dd className="font-display text-lg font-semibold tabular-nums">
                  {formatMoney(query.data.settledTotal, contract.currency)}
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>

      {dialog?.kind === "create" && (
        <AdvanceExpenseDialog
          key={dialogKey}
          contract={contract}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "edit" && (
        <AdvanceExpenseDialog
          key={dialogKey}
          contract={contract}
          expense={dialog.expense}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
      {dialog?.kind === "delete" && (
        <DeleteExpenseDialog
          key={dialogKey}
          contractId={contract.id}
          expense={dialog.expense}
          open
          onOpenChange={(isOpen) => !isOpen && setDialog(null)}
        />
      )}
    </section>
  )
}

function ExpenseRows({
  expenses,
  canDelete,
  onEdit,
  onDelete,
}: {
  expenses: AdvanceExpense[]
  canDelete: boolean
  onEdit: (expense: AdvanceExpense) => void
  onDelete: (expense: AdvanceExpense) => void
}) {
  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {expenses.map((expense) => (
          <li key={expense.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium">{expense.description}</p>
                <p className="text-muted-foreground tabular-nums">
                  {formatDate(expense.expenseDate)}
                  {expense.registeredBy &&
                    ` · ${expense.registeredBy.fullName}`}
                </p>
              </div>
              <span className="font-display font-medium tabular-nums">
                {formatMoney(expense.amount, expense.currency)}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <ExpenseStatus expense={expense} />
              <div className="flex items-center gap-1">
                <ReceiptLink expense={expense} />
                <ExpenseActions
                  expense={expense}
                  canDelete={canDelete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-0">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="tabular-nums">
                  {formatDate(expense.expenseDate)}
                </TableCell>
                <TableCell>
                  <p>{expense.description}</p>
                  {expense.registeredBy && (
                    <p className="text-xs text-muted-foreground">
                      Cargó {expense.registeredBy.fullName}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-right font-display font-medium tabular-nums">
                  {formatMoney(expense.amount, expense.currency)}
                </TableCell>
                <TableCell>
                  <ExpenseStatus expense={expense} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <ReceiptLink expense={expense} />
                    <ExpenseActions
                      expense={expense}
                      canDelete={canDelete}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

/**
 * Pendiente o descontado. La liquidación se muestra por id, sin link: la
 * pantalla llega en la Fase 12 (DT-56).
 */
function ExpenseStatus({ expense }: { expense: AdvanceExpense }) {
  const status = expenseStatusMeta(expense)
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge variant={status.badge}>{status.label}</Badge>
      {expense.settled && expense.settlementId && (
        <span className="text-xs text-muted-foreground">
          Liquidación {expense.settlementId}
        </span>
      )}
    </div>
  )
}

function ReceiptLink({ expense }: { expense: AdvanceExpense }) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLink aria-hidden />
        Ver comprobante
      </a>
    </Button>
  )
}

/** Editar y eliminar sólo mientras está pendiente; eliminar, sólo admin. */
function ExpenseActions({
  expense,
  canDelete,
  onEdit,
  onDelete,
}: {
  expense: AdvanceExpense
  canDelete: boolean
  onEdit: (expense: AdvanceExpense) => void
  onDelete: (expense: AdvanceExpense) => void
}) {
  if (expense.settled) return null
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Editar gasto ${expense.description}`}
        onClick={() => onEdit(expense)}
      >
        <Pencil aria-hidden />
      </Button>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Eliminar gasto ${expense.description}`}
          onClick={() => onDelete(expense)}
        >
          <Trash2 aria-hidden />
        </Button>
      )}
    </>
  )
}

function DeleteExpenseDialog({
  contractId,
  expense,
  open,
  onOpenChange,
}: {
  contractId: string
  expense: AdvanceExpense
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const remove = useDeleteAdvanceExpense()

  async function confirm() {
    try {
      await remove.mutateAsync({ id: expense.id, contractId })
      toast.success("Gasto eliminado.")
    } catch (cause) {
      // Un 409 (EXPENSE_ALREADY_SETTLED) llega con el mensaje de la API.
      toast.error(apiErrorMessage(cause, "No se pudo eliminar el gasto."))
    }
    onOpenChange(false)
  }

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>¿Eliminar el gasto?</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {expense.description} (
            {formatMoney(expense.amount, expense.currency)}) deja de aparecer y
            su comprobante se borra. Un gasto ya descontado no se puede
            eliminar.
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
