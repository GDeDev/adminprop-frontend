"use client"

import * as React from "react"
import Link from "next/link"
import { FilePlus2, HandCoins, Receipt, Timer } from "lucide-react"

import type {
  CurrencyAmount,
  DashboardReport,
  InstallmentBucket,
} from "@adminprop/shared-types"
import { Alert, AlertDescription } from "@adminprop/ui/components/alert"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { currentPeriod, formatMoneyList, periodLabel } from "@/lib/billing"
import { formatDate } from "@/lib/dates"
import { useDashboardReport } from "@/lib/reports-api"

import { MonthlyBars } from "./monthly-bars"

/** Resumen del mes (rediseño Fase 19, sección 2). Todo sale de `GET /reports/dashboard`. */
export function DashboardOverview() {
  const period = React.useMemo(() => currentPeriod(), [])
  const report = useDashboardReport(period)

  if (report.isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
    )
  }
  if (report.isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>
          No se pudo cargar el resumen del mes.
        </AlertDescription>
      </Alert>
    )
  }
  return <Overview report={report.data} />
}

function BucketCard({
  title,
  bucket,
  href,
  tone,
}: {
  title: string
  bucket: InstallmentBucket
  href: string
  tone?: "danger"
}) {
  return (
    <Link
      href={href}
      className="flex lift flex-col gap-1 rounded-xl border bg-card p-4 shadow-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <p className="text-sm text-muted-foreground">{title}</p>
      <p
        className={`font-display text-2xl font-semibold tabular-nums ${tone === "danger" && bucket.count > 0 ? "text-destructive" : ""}`}
      >
        {bucket.count}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatMoneyList(bucket.amounts)}
      </p>
    </Link>
  )
}

const TODO_ITEMS: {
  key: keyof DashboardReport["todo"]
  label: string
  href: string
}[] = [
  { key: "paymentsToConfirm", label: "Pagos por confirmar", href: "/cobros" },
  {
    key: "settlementsToConfirm",
    label: "Liquidaciones por confirmar",
    href: "/liquidaciones",
  },
  {
    key: "settlementsToTransfer",
    label: "Liquidaciones por transferir",
    href: "/liquidaciones",
  },
  {
    key: "openStatements",
    label: "Consolidados abiertos",
    href: "/liquidaciones?tab=statements",
  },
  {
    key: "pendingIncreases",
    label: "Aumentos pendientes de aplicar",
    href: "/contratos",
  },
]

function Overview({ report }: { report: DashboardReport }) {
  const todo = TODO_ITEMS.filter((item) => report.todo[item.key] > 0)
  const { installments } = report

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="month-title" className="flex flex-col gap-3">
        <h2 id="month-title" className="font-display text-lg font-semibold">
          {periodLabel(report.period)}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BucketCard
            title="Cobradas"
            bucket={installments.paid}
            href="/cobros"
          />
          <BucketCard
            title="Parciales"
            bucket={installments.partial}
            href="/cobros"
          />
          <BucketCard
            title="Pendientes"
            bucket={installments.pending}
            href="/cobros"
          />
          <BucketCard
            title="Vencidas"
            bucket={installments.overdue}
            href="/cobros"
            tone="danger"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Figure
            label="Punitorios devengados"
            amounts={report.lateFeesAccrued}
          />
          <Figure
            label="Punitorios cobrados"
            amounts={report.lateFeesCollected}
          />
          <Figure label="Honorarios del mes" amounts={report.feesAccrued} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="min-w-0 rounded-xl border bg-card p-4 shadow-raised"
          aria-labelledby="todo-title"
        >
          <h2
            id="todo-title"
            className="mb-2 font-display text-lg font-semibold"
          >
            Para hoy
          </h2>
          {todo.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay nada pendiente. 🎉
            </p>
          ) : (
            <ul className="divide-y">
              {todo.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center justify-between py-2 text-sm hover:underline md:min-h-9"
                  >
                    {item.label}
                    <span className="font-semibold tabular-nums">
                      {report.todo[item.key]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="min-w-0 rounded-xl border bg-card p-4 shadow-raised"
          aria-labelledby="expiring-title"
        >
          <h2
            id="expiring-title"
            className="mb-2 font-display text-lg font-semibold"
          >
            Contratos por vencer
          </h2>
          {report.expiringContracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ninguno vence en los próximos días.
            </p>
          ) : (
            <ul className="divide-y">
              {report.expiringContracts.map((row) => (
                <li key={row.contractId}>
                  <Link
                    href={`/contratos/${row.contractId}`}
                    className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm hover:underline md:min-h-9"
                  >
                    <span className="min-w-0 truncate">
                      {row.propertyAddress} · {row.renterName}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(row.endDate)} ({row.daysLeft} d)
                      {row.renewalInProgress && " · renovando"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section
        className="rounded-xl border bg-card p-4 shadow-raised"
        aria-labelledby="history-title"
      >
        <h2
          id="history-title"
          className="mb-3 font-display text-lg font-semibold"
        >
          Devengado y cobrado, últimos meses
        </h2>
        <MonthlyBars history={report.history} />
      </section>

      <section aria-label="Accesos rápidos" className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href="/contratos/nuevo">
            <FilePlus2 aria-hidden />
            Nuevo contrato
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cobros">
            <HandCoins aria-hidden />
            Registrar pago
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/liquidaciones">
            <Receipt aria-hidden />
            Nueva liquidación
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/configuracion/automatizaciones">
            <Timer aria-hidden />
            Generar cuotas
          </Link>
        </Button>
      </section>
    </div>
  )
}

function Figure({
  label,
  amounts,
}: {
  label: string
  amounts: CurrencyAmount[]
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-raised">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-semibold tabular-nums">
        {formatMoneyList(amounts)}
      </p>
    </div>
  )
}
