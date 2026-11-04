"use client"

import * as React from "react"
import Link from "next/link"
import { Download } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage } from "@adminprop/session/client"
import type { ReportFormat } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { ErrorState } from "@adminprop/ui/components/error-state"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
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

import {
  currentPeriod,
  daysLabel,
  formatMoneyList,
  periodLabel,
  shiftPeriod,
} from "@/lib/billing"
import { PeriodInput } from "@/components/period-input"
import { formatMoney } from "@/lib/contracts"
import { formatDate } from "@/lib/dates"
import {
  downloadExport,
  useArrearsReport,
  useExpiringContractsReport,
  useIncomeReport,
  usePaymentsReport,
  usePropertiesReport,
  useServicesReport,
  type RangeFilters,
} from "@/lib/reports-api"

type ReportKey =
  | "income"
  | "payments"
  | "arrears"
  | "rented"
  | "available"
  | "expiring"
  | "services"

const REPORTS: { key: ReportKey; label: string; group: string }[] = [
  { key: "income", label: "Ingresos y honorarios", group: "Financieros" },
  { key: "payments", label: "Alquileres pagados", group: "Financieros" },
  { key: "arrears", label: "Alquileres vencidos", group: "Financieros" },
  { key: "rented", label: "Propiedades alquiladas", group: "Operativos" },
  { key: "available", label: "Propiedades disponibles", group: "Operativos" },
  { key: "expiring", label: "Contratos por vencer", group: "Operativos" },
  { key: "services", label: "Servicios vencidos", group: "Operativos" },
]

const USES_RANGE: ReportKey[] = ["income", "payments"]

/** Reportes (rediseño Fase 19, sección 2): un selector de reporte, filtros y tabla con totales por moneda. */
export function ReportsScreen() {
  const [report, setReport] = React.useState<ReportKey>("income")
  const [range, setRange] = React.useState<RangeFilters>(() => ({
    from: shiftPeriod(currentPeriod(), -5),
    to: currentPeriod(),
  }))
  const [minDays, setMinDays] = React.useState(1)
  const [withinDays, setWithinDays] = React.useState(60)

  const exportParams = exportConfig(report, { range, minDays, withinDays })

  async function exportAs(format: ReportFormat) {
    try {
      await downloadExport(
        exportParams.url,
        exportParams.params,
        format,
        `reporte-${report}`
      )
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo exportar el reporte."))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-title-lg font-semibold md:text-display-md">
          Reportes
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void exportAs("xlsx")}>
            <Download aria-hidden />
            Excel
          </Button>
          <Button variant="outline" onClick={() => void exportAs("pdf")}>
            <Download aria-hidden />
            PDF
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select
          value={report}
          onValueChange={(value) => setReport(value as ReportKey)}
        >
          <SelectTrigger aria-label="Reporte" className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {["Financieros", "Operativos"].map((group) =>
              REPORTS.filter((item) => item.group === group).map((item) => (
                <SelectItem key={item.key} value={item.key}>
                  {group}: {item.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {USES_RANGE.includes(report) && (
          <>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Desde</span>
              <PeriodInput
                label="Desde"
                value={range.from}
                onChange={(from) =>
                  setRange((current) => ({ ...current, from }))
                }
              />
            </div>
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-medium">Hasta</span>
              <PeriodInput
                label="Hasta"
                value={range.to}
                onChange={(to) => setRange((current) => ({ ...current, to }))}
              />
            </div>
          </>
        )}
        {report === "arrears" && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            Días de atraso mínimos
            <Input
              type="number"
              min={0}
              value={minDays}
              onChange={(event) => setMinDays(Number(event.target.value) || 0)}
            />
          </label>
        )}
        {report === "expiring" && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            Vencen dentro de (días)
            <Input
              type="number"
              min={1}
              value={withinDays}
              onChange={(event) =>
                setWithinDays(Number(event.target.value) || 1)
              }
            />
          </label>
        )}
      </div>

      {report === "income" && <IncomeTable range={range} />}
      {report === "payments" && <PaymentsTable range={range} />}
      {report === "arrears" && <ArrearsTable minDays={minDays} />}
      {report === "rented" && <PropertiesTable status="RENTED" />}
      {report === "available" && <PropertiesTable status="AVAILABLE" />}
      {report === "expiring" && <ExpiringTable withinDays={withinDays} />}
      {report === "services" && <ServicesTable />}
    </div>
  )
}

/** URL y query de exportación de cada reporte, con los filtros que se están viendo. */
export function exportConfig(
  report: ReportKey,
  filters: { range: RangeFilters; minDays: number; withinDays: number }
): { url: string; params: Record<string, string | number> } {
  switch (report) {
    case "income":
      return { url: "/reports/financial/income", params: { ...filters.range } }
    case "payments":
      return {
        url: "/reports/financial/payments",
        params: { ...filters.range },
      }
    case "arrears":
      return {
        url: "/reports/financial/arrears",
        params: { minDays: filters.minDays },
      }
    case "rented":
      return {
        url: "/reports/operations/properties",
        params: { status: "RENTED" },
      }
    case "available":
      return {
        url: "/reports/operations/properties",
        params: { status: "AVAILABLE" },
      }
    case "expiring":
      return {
        url: "/reports/operations/expiring-contracts",
        params: { withinDays: filters.withinDays },
      }
    case "services":
      return {
        url: "/reports/operations/services",
        params: { status: "overdue" },
      }
  }
}

type QueryState = {
  isPending: boolean
  isError: boolean
  refetch?: () => unknown
}

function State({
  query,
  empty,
  children,
}: {
  query: QueryState
  empty: boolean
  children: React.ReactNode
}) {
  if (query.isPending) return <PageSkeleton />
  if (query.isError) {
    return (
      <ErrorState
        title="No se pudo cargar el reporte"
        description="Probá de nuevo en un rato."
        onRetry={query.refetch ? () => void query.refetch?.() : undefined}
      />
    )
  }
  if (empty) {
    return (
      <EmptyState
        title="Sin resultados"
        description="No hay datos para esos filtros."
      />
    )
  }
  return (
    <div className="rounded-xl border bg-card shadow-raised">
      <p className="px-3 pt-2 text-xs text-muted-foreground lg:hidden">
        Deslizá hacia el costado para ver todas las columnas.
      </p>
      <div className="overflow-x-auto">{children}</div>
    </div>
  )
}

function Head({
  columns,
  right = [],
}: {
  columns: string[]
  /** Columnas de montos o cantidades: alineadas a la derecha. */
  right?: string[]
}) {
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column) => (
          <TableHead
            key={column}
            className={right.includes(column) ? "text-right" : undefined}
          >
            {column}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  )
}

function IncomeTable({ range }: { range: RangeFilters }) {
  const query = useIncomeReport(range)
  const rows = query.data?.rows ?? []
  return (
    <State query={query} empty={rows.length === 0}>
      <Table>
        <Head
          columns={[
            "Mes",
            "Moneda",
            "Alquiler",
            "Punitorios",
            "Cargos",
            "Honorarios devengados",
            "Honorarios cobrados",
            "Neto liquidado",
            "Transferido",
          ]}
          right={[
            "Alquiler",
            "Punitorios",
            "Cargos",
            "Honorarios devengados",
            "Honorarios cobrados",
            "Neto liquidado",
            "Transferido",
          ]}
        />
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${row.period}-${row.currency}`}>
              <TableCell>{periodLabel(row.period)}</TableCell>
              <TableCell>{row.currency}</TableCell>
              {[
                row.rentCollected,
                row.lateFeesCollected,
                row.chargesCollected,
                row.feesAccrued,
                row.feesCollected,
                row.netSettled,
                row.netTransferred,
              ].map((amount, index) => (
                <TableCell key={index} className="text-right font-display num">
                  {formatMoney(amount, row.currency)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="p-3 text-xs text-muted-foreground">
        Los ingresos se cuentan por fecha de pago, no por el período de la cuota
        (A-38).
      </p>
    </State>
  )
}

function PaymentsTable({ range }: { range: RangeFilters }) {
  const query = usePaymentsReport(range)
  const rows = query.data?.data ?? []
  return (
    <State query={query} empty={rows.length === 0}>
      <Table>
        <Head
          columns={[
            "Fecha",
            "Cuota",
            "Inquilino",
            "Propiedad",
            "Propietario",
            "Importe",
          ]}
          right={["Importe"]}
        />
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.paymentId}>
              <TableCell>{formatDate(row.paidAt)}</TableCell>
              <TableCell>{periodLabel(row.period)}</TableCell>
              <TableCell>{row.renterName}</TableCell>
              <TableCell>{row.propertyAddress}</TableCell>
              <TableCell>{row.ownerName}</TableCell>
              <TableCell className="text-right font-display num">
                {formatMoney(row.amount, row.currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </State>
  )
}

function ArrearsTable({ minDays }: { minDays: number }) {
  const query = useArrearsReport(minDays)
  const rows = query.data?.rows ?? []
  return (
    <State query={query} empty={rows.length === 0}>
      <Table>
        <Head
          columns={[
            "Inquilino",
            "Propiedad",
            "Propietario",
            "Cuotas",
            "Atraso máximo",
            "Saldo",
            "Punitorio",
          ]}
          right={["Cuotas", "Saldo", "Punitorio"]}
        />
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.renterId}>
              <TableCell>
                <Link
                  href={`/inquilinos/${row.renterId}`}
                  className="underline"
                >
                  {row.renterName}
                </Link>
              </TableCell>
              <TableCell>{row.propertyAddress}</TableCell>
              <TableCell>{row.ownerName}</TableCell>
              <TableCell className="text-right num">
                {row.overdueInstallments}
              </TableCell>
              <TableCell>{daysLabel(row.maxDaysOverdue)}</TableCell>
              <TableCell className="text-right font-display num">
                {formatMoneyList(row.balance)}
              </TableCell>
              <TableCell className="text-right font-display num">
                {formatMoneyList(row.lateFee)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="p-3 num text-sm font-medium">
        Total adeudado: {formatMoneyList(query.data?.totals ?? [])}
      </p>
    </State>
  )
}

function PropertiesTable({ status }: { status: "RENTED" | "AVAILABLE" }) {
  const query = usePropertiesReport(status)
  const rows = query.data?.rows ?? []
  return (
    <State query={query} empty={rows.length === 0}>
      <Table>
        <Head
          columns={
            status === "RENTED"
              ? ["Propiedad", "Inquilino", "Alquiler", "Fin del contrato"]
              : ["Propiedad", "Días sin alquilar"]
          }
          right={["Alquiler", "Días sin alquilar"]}
        />
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.propertyId}>
              <TableCell>
                <Link
                  href={`/propiedades/${row.propertyId}`}
                  className="underline"
                >
                  {row.address}
                </Link>
              </TableCell>
              {status === "RENTED" ? (
                <>
                  <TableCell>{row.renterName ?? "—"}</TableCell>
                  <TableCell className="text-right num">
                    {row.rent
                      ? formatMoney(row.rent.amount, row.rent.currency)
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {row.contractEndDate
                      ? formatDate(row.contractEndDate)
                      : "—"}
                  </TableCell>
                </>
              ) : (
                <TableCell className="text-right num">
                  {row.daysVacant ?? "—"}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </State>
  )
}

function ExpiringTable({ withinDays }: { withinDays: number }) {
  const query = useExpiringContractsReport(withinDays)
  const rows = query.data?.rows ?? []
  return (
    <State query={query} empty={rows.length === 0}>
      <Table>
        <Head
          columns={["Propiedad", "Inquilino", "Vence", "Faltan", "Renovación"]}
          right={["Faltan"]}
        />
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.contractId}>
              <TableCell>
                <Link
                  href={`/contratos/${row.contractId}`}
                  className="underline"
                >
                  {row.propertyAddress}
                </Link>
              </TableCell>
              <TableCell>{row.renterName}</TableCell>
              <TableCell>{formatDate(row.endDate)}</TableCell>
              <TableCell className="text-right num">{row.daysLeft} d</TableCell>
              <TableCell>{row.renewalInProgress ? "En curso" : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </State>
  )
}

function ServicesTable() {
  const query = useServicesReport("overdue")
  const rows = query.data?.rows ?? []
  return (
    <State query={query} empty={rows.length === 0}>
      <Table>
        <Head columns={["Propiedad", "Servicio", "Atraso"]} />
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.serviceId}>
              <TableCell>
                <Link
                  href={`/propiedades/${row.propertyId}`}
                  className="underline"
                >
                  {row.propertyAddress}
                </Link>
              </TableCell>
              <TableCell>{row.serviceName}</TableCell>
              <TableCell>{daysLabel(row.daysOverdue)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </State>
  )
}
