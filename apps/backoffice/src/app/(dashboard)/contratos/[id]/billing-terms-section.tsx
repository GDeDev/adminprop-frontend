"use client"

import * as React from "react"
import { Settings2 } from "lucide-react"

import { useSession } from "@adminprop/session/client"
import type {
  ContractBillingTerms,
  ContractCurrentBillingTerms,
  ContractStatus,
  Currency,
  DepositReturnMode,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"

import {
  COLLECTION_MODE_LABELS,
  DEPOSIT_RETURN_MODE_LABELS,
  FEE_MODE_LABELS,
} from "@/lib/billing"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"

import { ChangeBillingTermsDialog } from "./change-billing-terms-dialog"

export interface BillingTermsSectionProps {
  contract: {
    id: string
    status: ContractStatus
    currency: Currency
    startDate: string
    endDate: string
    deposit: string
    depositCurrency: Currency
    depositReturnMode: DepositReturnMode
  }
  terms: ContractCurrentBillingTerms
  history: ContractBillingTerms[]
}

/**
 * "Términos de cobro" de la ficha del contrato (rediseño Fase 11, 2.2):
 * quién cobra, cómo se cobran los honorarios, el punitorio y el depósito,
 * con el historial de vigencias. Cambiarlos es sólo para admin.
 */
export function BillingTermsSection({
  contract,
  terms,
  history,
}: BillingTermsSectionProps) {
  const { user } = useSession()
  const [changing, setChanging] = React.useState(false)
  const [showHistory, setShowHistory] = React.useState(false)
  const canChange = user?.role === "ADMIN" && contract.status === "ACTIVE"
  const money = (amount: string) => formatMoney(amount, contract.currency)

  return (
    <section
      className="rounded-xl border bg-card p-4"
      aria-labelledby="billing-terms-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="billing-terms-title"
          className="font-display text-lg font-semibold"
        >
          Términos de cobro
        </h2>
        {canChange && (
          <Button variant="outline" size="sm" onClick={() => setChanging(true)}>
            <Settings2 aria-hidden />
            Cambiar
          </Button>
        )}
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Quién cobra</dt>
        <dd>{COLLECTION_MODE_LABELS[terms.collectionMode]}</dd>
        <dt className="text-muted-foreground">Honorarios</dt>
        <dd>
          {terms.feeAmount
            ? `${money(terms.feeAmount)} fijos por mes`
            : `${terms.feePercentage} % del alquiler`}
          <p className="text-xs text-muted-foreground">
            {FEE_MODE_LABELS[terms.feeMode]}
          </p>
        </dd>
        <dt className="text-muted-foreground">Punitorio</dt>
        <dd>
          {terms.lateFeePercentage === null && terms.lateFeeGraceDays === null
            ? "El de la inmobiliaria"
            : [
                terms.lateFeePercentage === null
                  ? "% de la inmobiliaria"
                  : terms.lateFeePercentage + " % diario",
                terms.lateFeeGraceDays === null
                  ? "gracia de la inmobiliaria"
                  : "tras " + terms.lateFeeGraceDays + " días de gracia",
              ].join(", ")}
          {(terms.inheritedLateFeePercentage ||
            terms.inheritedLateFeeGraceDays) &&
            !(
              terms.lateFeePercentage === null &&
              terms.lateFeeGraceDays === null
            ) && (
              <Badge variant="outline" className="ml-2">
                Parte de la inmobiliaria
              </Badge>
            )}
        </dd>
        <dt className="text-muted-foreground">Depósito</dt>
        <dd>
          {formatMoney(contract.deposit, contract.depositCurrency)}
          <p className="text-xs text-muted-foreground">
            {DEPOSIT_RETURN_MODE_LABELS[contract.depositReturnMode]}
          </p>
        </dd>
        <dt className="text-muted-foreground">Vigentes desde</dt>
        <dd className="tabular-nums">{formatDate(terms.effectiveFrom)}</dd>
      </dl>
      {history.length > 1 && (
        <div className="mt-3 text-sm">
          <button
            type="button"
            className="font-medium underline-offset-2 hover:underline"
            onClick={() => setShowHistory((value) => !value)}
          >
            {showHistory
              ? "Ocultar historial"
              : `Ver historial (${history.length})`}
          </button>
          {showHistory && (
            <ul className="mt-2 flex flex-col divide-y">
              {history.map((row) => (
                <li key={row.id} className="py-2">
                  <p className="font-medium tabular-nums">
                    Desde {formatDate(row.effectiveFrom)}
                    {row.changedBy && (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · {row.changedBy.fullName}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {COLLECTION_MODE_LABELS[row.collectionMode]} ·{" "}
                    {row.feeAmount
                      ? `${money(row.feeAmount)} fijos`
                      : `${row.feePercentage} %`}{" "}
                    · {FEE_MODE_LABELS[row.feeMode]} · punitorio{" "}
                    {row.lateFeePercentage ?? "inmob."} % / gracia{" "}
                    {row.lateFeeGraceDays ?? "inmob."}
                    {row.notes && ` · ${row.notes}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {changing && (
        <ChangeBillingTermsDialog
          contract={contract}
          terms={terms}
          open
          onOpenChange={(open) => !open && setChanging(false)}
        />
      )}
    </section>
  )
}
