"use client"

import Link from "next/link"

import { Skeleton } from "@adminprop/ui/components/skeleton"
import { StatCard } from "@adminprop/ui/components/stat-card"

import { conversionLabel } from "@/lib/crm"
import { useCrmOverview } from "@/lib/crm-api"

function Figure({ label, value }: { label: string; value: string }) {
  return <StatCard label={label} value={value} className="p-4" />
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
      {data.topProperties.length > 0 && (
        <details className="rounded-xl border bg-card p-3 text-sm shadow-raised">
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
                  <span className="shrink-0 num text-xs text-muted-foreground">
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
