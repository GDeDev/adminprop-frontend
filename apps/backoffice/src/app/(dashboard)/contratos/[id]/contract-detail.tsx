"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2,
  CalendarClock,
  ChevronLeft,
  FileX2,
  Pencil,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { ContractDetail } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import { Progress } from "@adminprop/ui/components/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import {
  CURRENCY_LABELS,
  formatMoney,
  nextStepLabel,
  policyExpiryMeta,
  RENT_UPDATE_FREQUENCY_LABELS,
  RENT_UPDATE_SOURCE_LABELS,
  RENT_UPDATE_TYPE_LABELS,
  timelineLabel,
} from "@/lib/contracts"
import { DownloadPdfButton } from "@/components/download-pdf-button"
import { useContract } from "@/lib/contracts-api"
import { formatDate, formatPeriod, todayIso } from "@/lib/dates"
import { useContractServices } from "@/lib/services-api"

import { ContractBadges } from "../contract-list"
import { ServicesSection } from "../../propiedades/[id]/services-section"
import { AccountSection } from "./account-section"
import { AdvanceExpensesSection } from "./advance-expenses-section"
import { BillingTermsSection } from "./billing-terms-section"
import { ContractSettlementsSection } from "./contract-settlements-section"
import { DocumentActions } from "./document-upload"
import { EditContractDialog } from "./edit-contract-dialog"
import { InstallmentsSection } from "./installments-section"
import { RentUpdateDialog } from "./rent-update-dialog"
import { TerminateDialog } from "./terminate-dialog"

/** Ficha de contrato (spec Fase 9, 5.2). */
export function ContractDetailScreen({ id }: { id: string }) {
  const query = useContract(id)

  if (query.isPending) return <PageSkeleton cards={3} />
  if (query.isError) {
    return (
      <EmptyState
        title="No se pudo cargar el contrato"
        description={apiErrorMessage(query.error, "Probá de nuevo en un rato.")}
        action={
          <Button asChild variant="outline">
            <Link href="/contratos">Volver al listado</Link>
          </Button>
        }
      />
    )
  }
  return <Detail contract={query.data} />
}

type DialogKind = "edit" | "rent-update" | "terminate" | null

function Detail({ contract }: { contract: ContractDetail }) {
  const [dialog, setDialog] = React.useState<DialogKind>(null)
  // Cambia en cada apertura: el diálogo se monta de nuevo y arranca limpio.
  const [dialogKey, setDialogKey] = React.useState(0)
  const services = useContractServices(contract.id)
  const today = todayIso()
  const active = contract.status === "ACTIVE"
  const money = (amount: string) => formatMoney(amount, contract.currency)

  function openDialog(kind: DialogKind) {
    setDialogKey((k) => k + 1)
    setDialog(kind)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/contratos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Contratos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {contract.property?.address ?? "Propiedad eliminada"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {contract.renter?.fullName ?? "Sin inquilino"} ·{" "}
              {formatDate(contract.startDate)} → {formatDate(contract.endDate)}
            </p>
            <div className="mt-2">
              <ContractBadges contract={contract} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => openDialog("edit")}>
              <Pencil aria-hidden />
              Editar
            </Button>
            {active && (
              <>
                <Button
                  variant="outline"
                  onClick={() => openDialog("rent-update")}
                >
                  <TrendingUp aria-hidden />
                  Aplicar aumento
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/contratos/${contract.id}/renovar`}>
                    <RefreshCw aria-hidden />
                    Renovar
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openDialog("terminate")}
                >
                  <FileX2 aria-hidden />
                  Rescindir
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <Timeline contract={contract} today={today} />

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Partes">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Propiedad</dt>
            <dd>
              {contract.property ? (
                <PartyLink
                  href={`/propiedades/${contract.property.id}`}
                  icon={Building2}
                  label={contract.property.address}
                />
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-muted-foreground">Propietario</dt>
            <dd>
              {contract.owner ? (
                <PartyLink
                  href={`/propietarios/${contract.owner.id}`}
                  icon={UserRound}
                  label={contract.owner.fullName}
                />
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-muted-foreground">Inquilino</dt>
            <dd>
              {contract.renter ? (
                <PartyLink
                  href={`/inquilinos/${contract.renter.id}`}
                  icon={UserRound}
                  label={contract.renter.fullName}
                />
              ) : (
                "—"
              )}
            </dd>
            <dt className="text-muted-foreground">Garante</dt>
            <dd>
              {contract.guarantor ? (
                <PartyLink
                  href={`/garantes/${contract.guarantor.id}`}
                  icon={ShieldCheck}
                  label={contract.guarantor.fullName}
                />
              ) : (
                <span className="text-muted-foreground">Sin garante</span>
              )}
            </dd>
          </dl>
          {contract.renewedFromId && (
            <p className="mt-3 text-sm text-muted-foreground">
              Renovación del{" "}
              <Link
                href={`/contratos/${contract.renewedFromId}`}
                className="underline"
              >
                contrato anterior
              </Link>
              .
            </p>
          )}
          {contract.notes && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-sm whitespace-pre-line">
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Observaciones internas
              </p>
              {contract.notes}
            </div>
          )}
        </Section>

        <Section title="Condiciones">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Alquiler vigente</dt>
            <dd className="font-display text-lg font-semibold tabular-nums">
              {money(contract.currentRent)}
            </dd>
            <dt className="text-muted-foreground">Alquiler inicial</dt>
            <dd className="tabular-nums">{money(contract.initialRent)}</dd>
            <dt className="text-muted-foreground">Moneda</dt>
            <dd>{CURRENCY_LABELS[contract.currency]}</dd>
            <dt className="text-muted-foreground">Depósito</dt>
            <dd className="tabular-nums">{money(contract.deposit)}</dd>
            <dt className="text-muted-foreground">Actualización</dt>
            <dd>
              {RENT_UPDATE_TYPE_LABELS[contract.rentUpdateType]} ·{" "}
              {RENT_UPDATE_FREQUENCY_LABELS[contract.rentUpdateFrequency]}
            </dd>
            <dt className="text-muted-foreground">Próximo aumento</dt>
            <dd>
              {contract.nextRentUpdateOn
                ? formatDate(contract.nextRentUpdateOn)
                : "—"}
            </dd>
            <dt className="text-muted-foreground">Honorarios</dt>
            <dd className="tabular-nums">{contract.feePercentage} %</dd>
          </dl>
          <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
            <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0" />
            {nextStepLabel(contract, today)}
          </p>
        </Section>

        <SuretySection contract={contract} today={today} />

        <BillingTermsSection
          contract={contract}
          terms={contract.billingTerms}
          history={contract.billingTermsHistory}
        />

        <Section
          title="Documento del contrato"
          action={
            <DocumentActions
              contractId={contract.id}
              kind="contract"
              url={contract.contractPdfUrl}
              label="contrato"
            />
          }
        >
          <p className="text-sm text-muted-foreground">
            {contract.contractPdfUrl
              ? "El contrato firmado está cargado."
              : "Todavía no se subió el contrato firmado. Suele llegar después de la firma."}
          </p>
        </Section>

        {contract.termination && (
          <Section title="Rescisión">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Notificada el</dt>
              <dd>{formatDate(contract.termination.notifiedAt)}</dd>
              <dt className="text-muted-foreground">Rescindido el</dt>
              <dd>{formatDate(contract.termination.terminatedAt)}</dd>
              <dt className="text-muted-foreground">Alquiler futuro</dt>
              <dd className="tabular-nums">
                {money(contract.termination.futureRent)}
              </dd>
              <dt className="text-muted-foreground">Multa</dt>
              <dd className="font-display text-lg font-semibold tabular-nums">
                {money(contract.termination.penalty)}
              </dd>
            </dl>
            <p className="mt-3 text-sm text-muted-foreground">
              El cobro de la multa se registra desde los cobros.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <DownloadPdfButton
                kind="TERMINATION_NOTICE"
                entityId={contract.id}
                label="Cálculo de la rescisión"
              />
            </div>
          </Section>
        )}

        <Section title="Historial de aumentos" className="md:col-span-2">
          <RentHistory contract={contract} />
        </Section>

        <ServicesSection
          propertyId={contract.property?.id ?? null}
          contractId={contract.id}
          defaultCurrency={contract.currency}
          query={services}
        />
        <AdvanceExpensesSection contract={contract} />

        <InstallmentsSection contract={contract} />
        <ContractSettlementsSection contract={contract} />
        <AccountSection contract={contract} />
      </div>

      {dialog === "edit" && (
        <EditContractDialog
          key={dialogKey}
          contract={contract}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
      {dialog === "rent-update" && (
        <RentUpdateDialog
          key={dialogKey}
          contract={contract}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
      {dialog === "terminate" && (
        <TerminateDialog
          key={dialogKey}
          contract={contract}
          open
          onOpenChange={(open) => !open && setDialog(null)}
        />
      )}
    </div>
  )
}

/** Barra inicio → hoy → fin (spec 5.2), con el avance calculado por la API. */
function Timeline({
  contract,
  today,
}: {
  contract: ContractDetail
  today: string
}) {
  const percent = Math.min(100, Math.max(0, contract.timeline.progressPercent))
  return (
    <section
      className="rounded-xl border bg-card p-4"
      aria-label="Línea de tiempo del contrato"
    >
      <div className="mb-2 flex items-baseline justify-between gap-2 text-sm">
        <span className="tabular-nums">
          <span className="text-muted-foreground">Inicio </span>
          {formatDate(contract.startDate)}
        </span>
        <span className="font-medium">{timelineLabel(contract.timeline)}</span>
        <span className="tabular-nums">
          <span className="text-muted-foreground">Fin </span>
          {formatDate(contract.endDate)}
        </span>
      </div>
      <Progress
        value={percent}
        aria-label={`${percent} % del contrato transcurrido`}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Hoy {formatDate(today)} · {percent} % transcurrido
      </p>
    </section>
  )
}

function SuretySection({
  contract,
  today,
}: {
  contract: ContractDetail
  today: string
}) {
  const surety = contract.surety
  const expiry = policyExpiryMeta(surety?.policyExpiresAt ?? null, today)

  return (
    <Section
      title="Caución"
      action={
        contract.hasSurety && (
          <DocumentActions
            contractId={contract.id}
            kind="policy"
            url={surety?.policyPdfUrl ?? null}
            label="póliza"
          />
        )
      }
    >
      {!contract.hasSurety ? (
        <p className="text-sm text-muted-foreground">
          Sin seguro de caución. Se puede agregar desde Editar.
        </p>
      ) : (
        <>
          {expiry && (
            <div className="mb-3">
              <Badge variant={expiry.badge}>{expiry.label}</Badge>
            </div>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Aseguradora</dt>
            <dd>{surety?.insurerName ?? "—"}</dd>
            <dt className="text-muted-foreground">Email de alerta</dt>
            <dd className="break-all">{surety?.insurerAlertEmail ?? "—"}</dd>
            <dt className="text-muted-foreground">Póliza</dt>
            <dd>{surety?.policyNumber ?? "—"}</dd>
            <dt className="text-muted-foreground">Vence</dt>
            <dd>{formatDate(surety?.policyExpiresAt)}</dd>
          </dl>
        </>
      )}
    </Section>
  )
}

/** Historial del alquiler, del más reciente al más viejo (D-53). */
function RentHistory({ contract }: { contract: ContractDetail }) {
  const money = (amount: string) => formatMoney(amount, contract.currency)
  if (contract.rentUpdates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Sin aumentos todavía.</p>
    )
  }
  return (
    <>
      <ul className="flex flex-col gap-2 md:hidden">
        {contract.rentUpdates.map((update) => (
          <li key={update.id} className="rounded-lg border p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium tabular-nums">
                {formatDate(update.effectiveFrom)}
              </span>
              <Badge variant="outline">
                {RENT_UPDATE_SOURCE_LABELS[update.source]}
              </Badge>
            </div>
            <p className="mt-1 tabular-nums">
              {update.previousRent ? `${money(update.previousRent)} → ` : ""}
              <span className="font-display font-medium">
                {money(update.newRent)}
              </span>
            </p>
            {update.indexType && (
              <p className="mt-1 text-xs text-muted-foreground">
                {indexLabel(update)}
              </p>
            )}
          </li>
        ))}
      </ul>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Desde</TableHead>
              <TableHead className="text-right">Anterior</TableHead>
              <TableHead className="text-right">Nuevo</TableHead>
              <TableHead>Origen</TableHead>
              <TableHead>Índice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contract.rentUpdates.map((update) => (
              <TableRow key={update.id}>
                <TableCell className="tabular-nums">
                  {formatDate(update.effectiveFrom)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground tabular-nums">
                  {update.previousRent ? money(update.previousRent) : "—"}
                </TableCell>
                <TableCell className="text-right font-display font-medium tabular-nums">
                  {money(update.newRent)}
                </TableCell>
                <TableCell>
                  {RENT_UPDATE_SOURCE_LABELS[update.source]}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {update.indexType ? indexLabel(update) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}

function indexLabel(update: ContractDetail["rentUpdates"][number]): string {
  return `${update.indexType} ${formatPeriod(update.indexFromPeriod)} (${update.indexFromValue ?? "?"}) → ${formatPeriod(update.indexToPeriod)} (${update.indexToValue ?? "?"})`
}

function PartyLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof UserRound
  label: string
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-medium hover:underline"
    >
      <Icon aria-hidden className="size-4 text-muted-foreground" />
      {label}
    </Link>
  )
}

function Section({
  title,
  action,
  className,
  children,
}: {
  title: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`rounded-xl border bg-card p-4 ${className ?? ""}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
