"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronRight, FileDown } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  OwnerStatementSummary,
  SettlementSummary,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Tabs, TabsList, TabsTrigger } from "@adminprop/ui/components/tabs"

import {
  formatDate,
  formatMoney,
  isZero,
  periodLabel,
  SETTLEMENT_STATUS_META,
} from "@/lib/format"
import {
  ownerStatementPdfUrl,
  useOwnerSettlements,
  useOwnerStatements,
} from "@/lib/portal-api"

type Tab = "settlements" | "statements"

/** Liquidaciones y resúmenes mensuales del propietario (PRD 15.1, 12.5). */
export function OwnerSettlementsScreen() {
  const [tab, setTab] = React.useState<Tab>("settlements")
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">
          Liquidaciones
        </h1>
        <p className="text-sm text-muted-foreground">
          Lo que la inmobiliaria te liquidó por cada propiedad y los resúmenes
          de cada mes.
        </p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
        <TabsList aria-label="Qué ver">
          <TabsTrigger value="settlements">Liquidaciones</TabsTrigger>
          <TabsTrigger value="statements">Resúmenes mensuales</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "settlements" ? <SettlementList /> : <StatementList />}
    </div>
  )
}

function SettlementList() {
  const query = useOwnerSettlements()
  const settlements = query.data?.pages.flatMap((page) => page.data) ?? []
  if (query.isPending) return <PageSkeleton cards={3} />
  if (query.isError) {
    return (
      <EmptyState
        title="No pudimos cargar tus liquidaciones"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        }
      />
    )
  }
  if (settlements.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay liquidaciones"
        description="Aparecen cuando la inmobiliaria cobra un alquiler y te lo liquida."
      />
    )
  }
  return (
    <>
      <ul className="flex flex-col gap-2">
        {settlements.map((settlement) => (
          <li key={settlement.id}>
            <SettlementRow settlement={settlement} />
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <Button
          variant="outline"
          onClick={() => void query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          Ver más
        </Button>
      )}
    </>
  )
}

export function SettlementRow({
  settlement,
}: {
  settlement: SettlementSummary
}) {
  const meta = SETTLEMENT_STATUS_META[settlement.status]
  const money = (amount: string) => formatMoney(amount, settlement.currency)
  return (
    <Link
      href={`/propietario/liquidaciones/${settlement.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="min-w-0">
        <p className="font-medium">
          {settlement.property?.address ?? "Propiedad"} ·{" "}
          <span className="capitalize">{periodLabel(settlement.period)}</span>
          {settlement.sequence > 1 && ` (${settlement.sequence})`}
        </p>
        <p className="text-sm text-muted-foreground tabular-nums">
          Neto {money(settlement.netAmount)}
          {!isZero(settlement.transferredTotal) &&
            ` · transferido ${money(settlement.transferredTotal)}`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={meta.badge}>{meta.label}</Badge>
        <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
      </div>
    </Link>
  )
}

function StatementList() {
  const query = useOwnerStatements()
  const statements = query.data?.pages.flatMap((page) => page.data) ?? []
  if (query.isPending) return <PageSkeleton cards={2} />
  if (query.isError) {
    return (
      <EmptyState
        title="No pudimos cargar los resúmenes"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button onClick={() => void query.refetch()}>Reintentar</Button>
        }
      />
    )
  }
  if (statements.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay resúmenes mensuales"
        description="La inmobiliaria los cierra cada mes con tus liquidaciones."
      />
    )
  }
  return (
    <ul className="flex flex-col gap-2">
      {statements.map((statement) => (
        <li key={statement.id}>
          <StatementRow statement={statement} />
        </li>
      ))}
    </ul>
  )
}

function StatementRow({ statement }: { statement: OwnerStatementSummary }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
      <div>
        <p className="font-medium capitalize">
          {periodLabel(statement.period)}
        </p>
        <p className="text-sm text-muted-foreground">
          {statement.settlementsCount}{" "}
          {statement.settlementsCount === 1 ? "liquidación" : "liquidaciones"}
          {statement.closedAt &&
            ` · cerrado el ${formatDate(statement.closedAt)}`}
        </p>
        <p className="text-sm tabular-nums">
          {statement.totals
            .map((t) => `Neto ${formatMoney(t.netTotal, t.currency)}`)
            .join(" · ")}
        </p>
      </div>
      {statement.status === "CLOSED" && (
        <Button variant="outline" size="sm" asChild>
          <a
            href={ownerStatementPdfUrl(statement.id)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FileDown aria-hidden />
            PDF
          </a>
        </Button>
      )}
    </div>
  )
}
