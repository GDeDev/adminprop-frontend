"use client"

import * as React from "react"
import Link from "next/link"
import { Building2, ImageOff, Plus, Search } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { PropertyStatus, PropertySummary } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
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

import { MasterDataSelect } from "@/components/master-data-select"
import { STATUS_META } from "@/lib/properties"
import { useInfiniteProperties } from "@/lib/properties-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

type StatusFilter = PropertyStatus | "ALL"

/** Listado de propiedades (spec Fase 6, 5.1). */
export function PropertyList() {
  const [status, setStatus] = React.useState<StatusFilter>("ALL")
  const [typeId, setTypeId] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search.trim())

  const query = useInfiniteProperties({
    status: status === "ALL" ? undefined : status,
    propertyTypeId: typeId ?? undefined,
    search: debouncedSearch,
  })
  const properties = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.pagination.total ?? 0
  const filtered = status !== "ALL" || typeId !== null || debouncedSearch !== ""

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Propiedades
          </h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${total} en total` : " "}
          </p>
        </div>
        <Button asChild>
          <Link href="/propiedades/nueva">
            <Plus aria-hidden />
            Nueva propiedad
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por dirección"
            aria-label="Buscar por dirección"
            className="pl-9"
          />
        </div>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger
            className="w-full sm:w-48"
            aria-label="Filtrar por estado"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            {(Object.keys(STATUS_META) as PropertyStatus[]).map((key) => (
              <SelectItem key={key} value={key}>
                {STATUS_META[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-2 sm:w-56">
          <MasterDataSelect
            source="property-types"
            value={typeId}
            onChange={setTypeId}
            placeholder="Todos los tipos"
            aria-label="Filtrar por tipo"
          />
          {typeId && (
            <Button variant="ghost" onClick={() => setTypeId(null)}>
              Quitar
            </Button>
          )}
        </div>
      </div>

      {query.isPending ? (
        <PageSkeleton cards={3} />
      ) : query.isError ? (
        <EmptyState
          title="No se pudieron cargar las propiedades"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={
            filtered
              ? "No hay propiedades con esos filtros"
              : "Todavía no cargaste propiedades"
          }
          description={
            filtered ? "Probá con otros filtros." : "Empezá por la primera."
          }
          action={
            !filtered && (
              <Button asChild>
                <Link href="/propiedades/nueva">Nueva propiedad</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
            {properties.map((property) => (
              <li key={property.id}>
                <PropertyCard property={property} />
              </li>
            ))}
          </ul>
          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">
                    <span className="sr-only">Foto</span>
                  </TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Ubicación</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => (
                  <TableRow key={property.id} className="relative">
                    <TableCell>
                      <Thumbnail property={property} className="size-12" />
                    </TableCell>
                    <TableCell className="font-medium">
                      {/* El link cubre toda la fila (after:absolute). */}
                      <Link
                        href={`/propiedades/${property.id}`}
                        className="after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {property.address}
                      </Link>
                    </TableCell>
                    <TableCell>{property.propertyType?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {property.location?.path ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={property.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

export function StatusBadge({ status }: { status: PropertyStatus }) {
  const meta = STATUS_META[status]
  return <Badge variant={meta.badge}>{meta.label}</Badge>
}

function Thumbnail({
  property,
  className,
}: {
  property: PropertySummary
  className: string
}) {
  if (!property.mainPhotoUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-md bg-muted text-muted-foreground ${className}`}
      >
        <ImageOff aria-hidden className="size-5" />
      </div>
    )
  }
  return (
    // Fotos de Cloudinary o del storage local: sin next/image, que exige
    // declarar cada dominio remoto.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={property.mainPhotoUrl}
      alt=""
      loading="lazy"
      className={`rounded-md object-cover ${className}`}
    />
  )
}

function PropertyCard({ property }: { property: PropertySummary }) {
  return (
    <Link
      href={`/propiedades/${property.id}`}
      className="flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <Thumbnail
        property={property}
        className="aspect-[16/9] w-full rounded-none"
      />
      <div className="flex flex-col gap-1 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium">{property.address}</p>
          <StatusBadge status={property.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {[property.propertyType?.name, property.location?.path]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
    </Link>
  )
}

/**
 * Scroll infinito: al asomarse el final, pide la página siguiente. El botón
 * queda igual, para teclado y lectores de pantalla.
 */
function LoadMore({
  hasMore,
  loading,
  onLoadMore,
}: {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
}) {
  const sentinel = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const node = sentinel.current
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !loading) onLoadMore()
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loading, onLoadMore])

  if (!hasMore) return null
  return (
    <div ref={sentinel} className="flex justify-center">
      <Button variant="outline" onClick={onLoadMore} disabled={loading}>
        {loading ? "Cargando…" : "Cargar más"}
      </Button>
    </div>
  )
}
