"use client"

import * as React from "react"
import Link from "next/link"
import { Plus } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { ContractDetail } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { isZero } from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"
import { SETTLEMENT_STATUS_META, settlementLabel } from "@/lib/settlements"
import { useInfiniteSettlements } from "@/lib/settlements-api"

import { NewSettlementDialog } from "../../liquidaciones/new-settlement-dialog"

/** Liquidaciones del contrato (rediseño Fase 12, sección 7). */
export function ContractSettlementsSection({
  contract,
}: {
  contract: Pick<ContractDetail, "id" | "currency" | "billingTerms">
}) {
  const query = useInfiniteSettlements({ contractId: contract.id })
  const settlements = query.data?.pages.flatMap((page) => page.data) ?? []
  const [creating, setCreating] = React.useState(false)
  const money = (amount: string) => formatMoney(amount, contract.currency)

  return (
    <section
      className="rounded-xl border bg-card p-4"
      aria-labelledby="contract-settlements-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="contract-settlements-title"
          className="font-display text-lg font-semibold"
        >
          Liquidaciones
        </h2>
        {contract.billingTerms.collectionMode === "AGENCY" && (
          <Button variant="outline" size="sm" onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Nueva liquidación
          </Button>
        )}
      </div>
      {query.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10" />
        </div>
      ) : query.isError ? (
        <p className="text-sm text-destructive">
          {apiErrorMessage(
            query.error,
            "No se pudieron cargar las liquidaciones."
          )}
        </p>
      ) : settlements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {contract.billingTerms.collectionMode === "AGENCY"
            ? "Todavía no hay liquidaciones. Se crean solas cuando una cuota se termina de pagar."
            : "El propietario cobra directo: no hay liquidaciones; los honorarios van a su cuenta."}
        </p>
      ) : (
        <ul className="flex flex-col divide-y text-sm">
          {settlements.map((settlement) => {
            const meta = SETTLEMENT_STATUS_META[settlement.status]
            return (
              <li
                key={settlement.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <Link
                  href={`/liquidaciones/${settlement.id}`}
                  className="font-medium hover:underline"
                >
                  {settlementLabel(settlement)}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums">
                    {money(settlement.netAmount)}
                    {!isZero(settlement.transferredTotal) && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        · transferido {money(settlement.transferredTotal)}
                      </span>
                    )}
                  </span>
                  <Badge variant={meta.badge}>{meta.label}</Badge>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {creating && (
        <NewSettlementDialog
          contractId={contract.id}
          open
          onOpenChange={(open) => !open && setCreating(false)}
        />
      )}
    </section>
  )
}
