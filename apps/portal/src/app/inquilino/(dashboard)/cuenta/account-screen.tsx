"use client"

import * as React from "react"
import Link from "next/link"
import { Copy, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type {
  PortalRenterAccount,
  PortalRenterMe,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"

import {
  daysLabel,
  formatDate,
  formatMoney,
  INSTALLMENT_STATUS_META,
  isZero,
  periodLabel,
  whatsappUrl,
} from "@/lib/format"
import { useRenterAccount, useRenterMe } from "@/lib/portal-api"

/** Estado de cuenta del inquilino (PRD 15.2, rediseño 17/18 §2.1). */
export function RenterAccountScreen() {
  const me = useRenterMe()
  const account = useRenterAccount()

  if (me.isPending || account.isPending) return <PageSkeleton cards={2} />
  if (me.isError || account.isError) {
    return (
      <EmptyState
        title="No pudimos cargar tu cuenta"
        description={apiErrorMessage(
          me.error ?? account.error,
          "Probá de nuevo en un rato."
        )}
        action={
          <Button onClick={() => void account.refetch()}>Reintentar</Button>
        }
      />
    )
  }
  return <Account me={me.data} account={account.data} />
}

function Account({
  me,
  account,
}: {
  me: PortalRenterMe
  account: PortalRenterAccount
}) {
  const installment = account.currentInstallment
  const arrears = account.arrears

  if (!account.contract || !installment) {
    return (
      <div className="flex flex-col gap-6">
        <Header me={me} />
        <EmptyState
          title={
            account.contract
              ? "Todavía no hay cuota para este mes"
              : "No tenés un contrato vigente"
          }
          description={
            account.contract
              ? "Cuando la inmobiliaria genere la cuota del mes la vas a ver acá."
              : "Si creés que es un error, escribile a la inmobiliaria."
          }
        />
      </div>
    )
  }

  const money = (amount: string) => formatMoney(amount, installment.currency)
  const meta = INSTALLMENT_STATUS_META[installment.status]
  const overdue = installment.status === "OVERDUE"

  return (
    <div className="flex flex-col gap-6">
      <Header me={me} />

      <section
        className="rounded-xl border bg-card p-5"
        aria-labelledby="current-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm text-muted-foreground capitalize">
              Cuota de {periodLabel(installment.period)}
            </p>
            <h2
              id="current-title"
              className="font-display text-3xl font-semibold tabular-nums"
            >
              {money(installment.totalDue)}
            </h2>
          </div>
          <Badge variant={meta.badge}>
            {overdue && arrears.maxDaysOverdue > 0
              ? `En mora · ${daysLabel(arrears.maxDaysOverdue)}`
              : meta.label}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {installment.status === "PAID"
            ? `Pagada${installment.paidAt ? ` el ${formatDate(installment.paidAt)}` : ""}. ¡Gracias!`
            : overdue
              ? `Venció el ${formatDate(installment.graceEndDate)}. Desde entonces corre un punitorio de ${installment.lateFeePercentage} % por día sobre lo que falta del alquiler.`
              : `Sin punitorio hasta el ${formatDate(installment.graceEndDate)}.`}
        </p>

        <dl className="mt-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Alquiler</dt>
          <dd className="text-right tabular-nums">
            {money(installment.baseAmount)}
          </dd>
          {!isZero(installment.chargesTotal) && (
            <>
              <dt className="text-muted-foreground">Otros conceptos</dt>
              <dd className="text-right tabular-nums">
                {money(installment.chargesTotal)}
              </dd>
            </>
          )}
          {!isZero(installment.lateFeeAccrued) && (
            <>
              <dt className="text-muted-foreground">
                Punitorio ({daysLabel(installment.feeDays)})
              </dt>
              <dd className="text-right tabular-nums">
                {money(installment.lateFeeAccrued)}
              </dd>
            </>
          )}
          {!isZero(installment.paidTotal) && (
            <>
              <dt className="text-muted-foreground">Ya pagaste</dt>
              <dd className="text-right tabular-nums">
                −{money(installment.paidTotal)}
              </dd>
            </>
          )}
        </dl>

        {installment.lateFeeDays.length > 0 && (
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer font-medium">
              Ver el punitorio día por día
            </summary>
            <ul className="mt-2 flex flex-col divide-y">
              {installment.lateFeeDays.map((day) => (
                <li
                  key={day.dayNumber}
                  className="flex justify-between py-1 tabular-nums"
                >
                  <span>
                    {formatDate(day.day)} · {day.dailyPercentage} % sobre{" "}
                    {money(day.outstandingBase)}
                  </span>
                  <span>{money(day.amount)}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {account.creditsAvailable.some((c) => !isZero(c.amount)) && (
          <p className="mt-3 text-sm">
            Tenés saldo a favor:{" "}
            {account.creditsAvailable
              .filter((c) => !isZero(c.amount))
              .map((c) => formatMoney(c.amount, c.currency))
              .join(" · ")}
            . La inmobiliaria lo aplica a tu próxima cuota.
          </p>
        )}
      </section>

      {installment.status !== "PAID" && (
        <PaymentInstructions
          instructions={account.paymentInstructions}
          agency={me.agency}
          renterName={me.fullName}
          period={installment.period}
          address={me.agency.name}
        />
      )}

      <p className="text-sm text-muted-foreground">
        <Link href="/inquilino/pagos" className="underline">
          Ver todas tus cuotas y pagos
        </Link>
      </p>
    </div>
  )
}

function Header({ me }: { me: PortalRenterMe }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">
        Hola, {me.fullName}
      </h1>
      <p className="text-sm text-muted-foreground">
        Tu estado de cuenta en {me.agency.name}.
      </p>
    </div>
  )
}

function PaymentInstructions({
  instructions,
  agency,
  renterName,
  period,
  address,
}: {
  instructions: PortalRenterAccount["paymentInstructions"]
  agency: PortalRenterMe["agency"]
  renterName: string
  period: string
  address: string
}) {
  const account = instructions.bankAccount
  const whatsapp = agency.whatsapp
    ? whatsappUrl(
        agency.whatsapp,
        `Hola, soy ${renterName}. Consulto por la cuota de ${periodLabel(period)} (${address}).`
      )
    : null

  return (
    <section
      className="rounded-xl border bg-card p-5"
      aria-labelledby="pay-title"
    >
      <h2 id="pay-title" className="font-display text-lg font-semibold">
        Cómo pagar
      </h2>
      {instructions.kind === "OWNER_DIRECT" ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Este contrato se paga directamente al propietario, como acordaron. La
          inmobiliaria registra el pago cuando el propietario lo informa.
        </p>
      ) : account ? (
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          {account.holder && <Row label="Titular" value={account.holder} />}
          {account.bank && <Row label="Banco" value={account.bank} />}
          {account.cbu && <Row label="CBU" value={account.cbu} copy />}
          {account.alias && <Row label="Alias" value={account.alias} copy />}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          Transferí a la cuenta de la inmobiliaria o pagá en sus oficinas. Si no
          tenés los datos, pedilos por WhatsApp.
        </p>
      )}
      {whatsapp && (
        <Button className="mt-4" asChild>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            Avisar por WhatsApp que pagué
          </a>
        </Button>
      )}
    </section>
  )
}

function Row({
  label,
  value,
  copy,
}: {
  label: string
  value: string
  copy?: boolean
}) {
  async function copyValue() {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copiado.`)
    } catch {
      toast.error("No se pudo copiar.")
    }
  }
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium tabular-nums">{value}</dd>
      </div>
      {copy && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Copiar ${label}`}
          onClick={() => void copyValue()}
        >
          <Copy aria-hidden />
        </Button>
      )}
    </div>
  )
}
