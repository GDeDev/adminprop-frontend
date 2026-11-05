"use client"

import * as React from "react"
import Link from "next/link"

import { useSession } from "@adminprop/session/client"
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { AuditRow } from "@/app/(dashboard)/configuracion/auditoria/audit-screen"
import { useEntityHistory } from "@/lib/audit-api"

/**
 * "Historial" de una ficha: los últimos cambios de esa entidad (rediseño
 * Fase 20, sección 6). Solo lo ve el administrador; para el resto no se
 * renderiza nada.
 */
export function EntityHistory({
  entity,
  entityId,
}: {
  entity: string
  entityId: string
}) {
  const { user } = useSession()
  if (user?.role !== "ADMIN") return null
  return <HistoryList entity={entity} entityId={entityId} />
}

function HistoryList({
  entity,
  entityId,
}: {
  entity: string
  entityId: string
}) {
  const history = useEntityHistory(entity, entityId)
  const [openId, setOpenId] = React.useState<string | null>(null)

  return (
    <section
      className="rounded-xl border bg-card p-4 shadow-raised"
      aria-label="Historial"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-display text-title-md font-semibold">Historial</h2>
        <Link
          href={`/configuracion/auditoria?entity=${encodeURIComponent(entity)}&entityId=${encodeURIComponent(entityId)}`}
          className="text-sm underline"
        >
          Ver todo
        </Link>
      </div>
      {history.isPending ? (
        <Skeleton className="h-12" />
      ) : history.isError ? (
        <p className="text-sm text-muted-foreground">
          No se pudo cargar el historial.
        </p>
      ) : history.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Sin cambios registrados.
        </p>
      ) : (
        <ul className="divide-y">
          {history.data.map((entry) => (
            <AuditRow
              key={entry.id}
              entry={entry}
              open={openId === entry.id}
              onToggle={() => setOpenId(openId === entry.id ? null : entry.id)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
