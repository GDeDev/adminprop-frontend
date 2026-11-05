"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronDown, ChevronLeft, ChevronRight, Download } from "lucide-react"
import { toast } from "sonner"

import { apiErrorMessage, useSession } from "@adminprop/session/client"
import type {
  AuditAction,
  AuditActorKind,
  AuditEntry,
} from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
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
import { Skeleton } from "@adminprop/ui/components/skeleton"

import { LoadMore } from "@/components/load-more"
import {
  AUDIT_ACTION_LABELS,
  AUDIT_ACTOR_LABELS,
  auditActor,
  auditEntityHref,
  auditEntityLabel,
  auditFieldLabel,
  auditValue,
} from "@/lib/audit"
import {
  auditParams,
  useAuditCatalog,
  useAuditEntry,
  useInfiniteAudit,
  type AuditFilters,
} from "@/lib/audit-api"
import { downloadExport } from "@/lib/reports-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

const ALL = "ALL"

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(new Date(iso))
}

/** Configuración → Auditoría (rediseño Fase 20, sección 6). Solo administradores. */
export function AuditScreen() {
  const { user } = useSession()
  // "Ver todo" del historial de una ficha llega con ?entity=…&entityId=…
  const searchParams = useSearchParams()
  const [filters, setFilters] = React.useState<AuditFilters>(() => ({
    entity: searchParams.get("entity") ?? undefined,
    entityId: searchParams.get("entityId") ?? undefined,
  }))
  const [searchText, setSearchText] = React.useState("")
  const search = useDebouncedValue(searchText, 300)
  const effective = React.useMemo(
    () => ({ ...filters, search: search || undefined }),
    [filters, search]
  )
  const catalog = useAuditCatalog()
  const query = useInfiniteAudit(effective)
  const [openId, setOpenId] = React.useState<string | null>(null)

  if (user?.role !== "ADMIN") {
    return (
      <EmptyState
        title="Solo para administradores"
        description="La auditoría la consultan los administradores."
      />
    )
  }

  function set<K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value || undefined }))
  }

  async function exportXlsx() {
    try {
      await downloadExport(
        "/audit/export",
        auditParams(effective),
        "xlsx",
        "auditoria"
      )
    } catch (cause) {
      toast.error(apiErrorMessage(cause, "No se pudo exportar la auditoría."))
    }
  }

  const entries = query.data?.pages.flatMap((page) => page.data) ?? []

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/configuracion">
            <ChevronLeft aria-hidden />
            Configuración
          </Link>
        </Button>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-title-lg font-semibold md:text-display-md">
            Auditoría
          </h1>
          <Button variant="outline" onClick={() => void exportXlsx()}>
            <Download aria-hidden />
            Excel
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Quién hizo qué y cuándo. El registro no se puede editar ni borrar.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          aria-label="Buscar"
          placeholder="Buscar en el detalle"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <Select
          value={filters.entity ?? ALL}
          onValueChange={(value) =>
            set("entity", value === ALL ? undefined : value)
          }
        >
          <SelectTrigger aria-label="Entidad">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las entidades</SelectItem>
            {catalog.data?.entities.map((entity) => (
              <SelectItem key={entity} value={entity}>
                {auditEntityLabel(entity)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.action ?? ALL}
          onValueChange={(value) =>
            set("action", value === ALL ? undefined : (value as AuditAction))
          }
        >
          <SelectTrigger aria-label="Acción">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas las acciones</SelectItem>
            {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map(
              (action) => (
                <SelectItem key={action} value={action}>
                  {AUDIT_ACTION_LABELS[action]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select
          value={filters.actorKind ?? ALL}
          onValueChange={(value) =>
            set(
              "actorKind",
              value === ALL ? undefined : (value as AuditActorKind)
            )
          }
        >
          <SelectTrigger aria-label="Actor">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos los actores</SelectItem>
            {(Object.keys(AUDIT_ACTOR_LABELS) as AuditActorKind[]).map(
              (kind) => (
                <SelectItem key={kind} value={kind}>
                  {AUDIT_ACTOR_LABELS[kind]}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Input
          type="date"
          aria-label="Desde"
          value={filters.from ?? ""}
          onChange={(event) => set("from", event.target.value)}
        />
        <Input
          type="date"
          aria-label="Hasta"
          value={filters.to ?? ""}
          onChange={(event) => set("to", event.target.value)}
        />
      </div>

      {query.isPending ? (
        <PageSkeleton />
      ) : query.isError ? (
        <ErrorState
          title="No se pudo cargar la auditoría"
          description="Probá de nuevo en un rato."
          onRetry={() => void query.refetch()}
        />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          description="No hay registros con esos filtros."
        />
      ) : (
        <>
          <ul className="divide-y rounded-xl border bg-card shadow-raised">
            {entries.map((entry) => (
              <AuditRow
                key={entry.id}
                entry={entry}
                open={openId === entry.id}
                onToggle={() =>
                  setOpenId(openId === entry.id ? null : entry.id)
                }
              />
            ))}
          </ul>
          <LoadMore
            hasMore={query.hasNextPage}
            loading={query.isFetchingNextPage}
            onLoadMore={() => void query.fetchNextPage()}
          />
        </>
      )}
    </div>
  )
}

export function AuditRow({
  entry,
  open,
  onToggle,
}: {
  entry: AuditEntry
  open: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-3 text-left hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        {open ? (
          <ChevronDown aria-hidden className="mt-1 size-4 shrink-0" />
        ) : (
          <ChevronRight aria-hidden className="mt-1 size-4 shrink-0" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm">
            {entry.summary || auditEntityLabel(entry.entity)}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDateTime(entry.createdAt)} · {auditActor(entry)} ·{" "}
            {auditEntityLabel(entry.entity)}
          </p>
        </div>
        <Badge variant="outline">{AUDIT_ACTION_LABELS[entry.action]}</Badge>
      </button>
      {open && <AuditDetail id={entry.id} />}
    </li>
  )
}

function AuditDetail({ id }: { id: string }) {
  const detail = useAuditEntry(id)
  if (detail.isPending) return <Skeleton className="m-3 h-16" />
  if (detail.isError) {
    return (
      <p className="p-3 text-sm text-destructive" role="alert">
        No se pudo cargar el detalle.{" "}
        <button
          type="button"
          className="underline"
          onClick={() => void detail.refetch()}
        >
          Reintentar
        </button>
      </p>
    )
  }
  const { changes } = detail.data
  const href = auditEntityHref(detail.data.entity, detail.data.entityId)
  const link = href && (
    <p className="px-3 pb-2 text-sm md:ml-7">
      <Link href={href} className="underline">
        Ver {auditEntityLabel(detail.data.entity).toLowerCase()}
      </Link>
    </p>
  )
  if (changes.length === 0) {
    return (
      <>
        <p className="px-10 pb-3 text-sm text-muted-foreground">
          Sin cambios de campos para mostrar.
        </p>
        {link}
      </>
    )
  }
  return (
    <>
      {link}
      <dl className="mx-3 mb-3 grid grid-cols-[auto_1fr_1fr] gap-x-4 gap-y-1 rounded-lg bg-muted/50 p-3 text-sm md:ml-10">
        <dt className="text-xs font-medium text-muted-foreground">Campo</dt>
        <dd className="text-xs font-medium text-muted-foreground">Antes</dd>
        <dd className="text-xs font-medium text-muted-foreground">Después</dd>
        {changes.map((change) => (
          <React.Fragment key={change.field}>
            <dt className="font-medium">{auditFieldLabel(change.field)}</dt>
            <dd className="break-words text-muted-foreground">
              {auditValue(change.before, change.beforeLabel)}
            </dd>
            <dd className="break-words">
              {auditValue(change.after, change.afterLabel)}
            </dd>
          </React.Fragment>
        ))}
      </dl>
    </>
  )
}
