"use client"

import * as React from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import { SectionError } from "@adminprop/ui/components/section-error"
import type { OverdueService } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { LoadMore } from "@/components/load-more"
import { formatDate } from "@/lib/dates"
import { daysOverdueLabel, SERVICE_PAYER_LABELS } from "@/lib/services"
import { useInfiniteOverdueServices } from "@/lib/services-api"

/** Cuántos se ven antes de "Ver todos". */
const PREVIEW_ROWS = 5

/**
 * "Servicios vencidos" del dashboard (spec 3.1): los más atrasados primero,
 * con link a la propiedad. Arranca resumido; "Ver todos" muestra la página
 * entera y sigue con scroll infinito (DT-57).
 */
export function OverdueServices() {
  const query = useInfiniteOverdueServices()
  const [expanded, setExpanded] = React.useState(false)
  const services = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.pagination.total ?? services.length
  const visible = expanded ? services : services.slice(0, PREVIEW_ROWS)
  const hasHidden =
    !expanded && (services.length > PREVIEW_ROWS || query.hasNextPage)

  return (
    <section
      className="rounded-xl border bg-card p-4 shadow-raised"
      aria-labelledby="overdue-services-title"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2
          id="overdue-services-title"
          className="flex items-center gap-2 font-display text-title-md font-semibold"
        >
          <AlertTriangle aria-hidden className="size-5 text-destructive" />
          Servicios vencidos
          {query.isSuccess && total > 0 && (
            <Badge variant="mora" className="num">
              {total}
            </Badge>
          )}
        </h2>
        {hasHidden && (
          <Button variant="outline" size="sm" onClick={() => setExpanded(true)}>
            Ver todos
          </Button>
        )}
      </div>

      {query.isPending ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      ) : query.isError ? (
        <SectionError
          description={apiErrorMessage(
            query.error,
            "No se pudieron cargar los servicios vencidos."
          )}
          onRetry={() => void query.refetch()}
        />
      ) : services.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ningún servicio vencido. Todo al día.
        </p>
      ) : (
        <>
          <ul className="flex flex-col divide-y">
            {visible.map((service) => (
              <OverdueRow key={service.id} service={service} />
            ))}
          </ul>
          {expanded && (
            <div className="mt-3">
              <LoadMore
                hasMore={query.hasNextPage}
                loading={query.isFetchingNextPage}
                onLoadMore={() => void query.fetchNextPage()}
              />
            </div>
          )}
        </>
      )}
    </section>
  )
}

function OverdueRow({ service }: { service: OverdueService }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 text-sm">
      <div className="min-w-0">
        <Link
          href={`/propiedades/${service.property.id}`}
          className="font-medium hover:underline"
        >
          {service.property.address}
        </Link>
        <p className="text-muted-foreground">
          {service.serviceType?.name ?? "Servicio"} · paga el{" "}
          {SERVICE_PAYER_LABELS[service.paidBy].toLowerCase()} · venció el{" "}
          <span className="num">{formatDate(service.dueDate)}</span>
        </p>
      </div>
      <Badge variant="mora">{daysOverdueLabel(service.daysOverdue)}</Badge>
    </li>
  )
}
