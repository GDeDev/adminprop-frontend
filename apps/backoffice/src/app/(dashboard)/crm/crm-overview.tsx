"use client"

import Link from "next/link"

import { Skeleton } from "@adminprop/ui/components/skeleton"

import { CountBars } from "@/components/charts/count-bars"
import { SOURCE_LABELS, STAGES, STAGE_LABELS, conversionLabel } from "@/lib/crm"
import { useCrmOverview } from "@/lib/crm-api"

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/** Resumen del embudo y propiedades más consultadas (`/crm/analytics/overview`). */
export function CrmOverview() {
  const overview = useCrmOverview()

  if (overview.isPending) return <Skeleton className="h-20" />
  if (overview.isError) return null
  const data = overview.data

  return (
    <section aria-label="Resumen de consultas" className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label="Abiertas" value={String(data.openCount)} />
        <Figure label="Sin asignar" value={String(data.unassignedCount)} />
        <Figure
          label="Primer contacto (promedio)"
          value={
            data.averageFirstContactHours === null
              ? "—"
              : `${String(data.averageFirstContactHours).replace(".", ",")} h`
          }
        />
        <Figure
          label="Conversión"
          value={conversionLabel(data.conversionRate)}
        />
      </div>
      <details className="rounded-xl border bg-card p-3 text-sm">
        <summary className="min-h-11 cursor-pointer py-2 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none md:min-h-0 md:py-0">
          Embudo y orígenes
        </summary>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <CountBars
            title="Consultas por etapa"
            items={STAGES.map((stage) => ({
              key: stage,
              label: STAGE_LABELS[stage],
              value: data.byStage[stage] ?? 0,
            }))}
          />
          <CountBars
            title="Consultas por origen"
            items={(
              Object.keys(SOURCE_LABELS) as (keyof typeof SOURCE_LABELS)[]
            )
              .map((source) => ({
                key: source,
                label: SOURCE_LABELS[source],
                value: data.bySource[source] ?? 0,
              }))
              .filter((item) => item.value > 0)}
          />
        </div>
      </details>
      {data.topProperties.length > 0 && (
        <details className="rounded-xl border bg-card p-3 text-sm">
          <summary className="cursor-pointer font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            Propiedades más consultadas
          </summary>
          <ul className="mt-2 divide-y">
            {data.topProperties.map((property) => (
              <li key={property.propertyId}>
                <Link
                  href={`/propiedades/${property.propertyId}`}
                  className="flex items-center justify-between gap-3 py-2 hover:underline"
                >
                  <span className="min-w-0 truncate">{property.address}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {property.inquiries} consultas · {property.views} vistas
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
