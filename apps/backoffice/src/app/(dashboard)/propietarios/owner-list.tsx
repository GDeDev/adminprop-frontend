"use client"

import * as React from "react"
import Link from "next/link"
import { KeyRound, Percent, Plus, Search, UserRound } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { OwnerSummary } from "@adminprop/shared-types"
import { Badge } from "@adminprop/ui/components/badge"
import { Button } from "@adminprop/ui/components/button"
import { EmptyState } from "@adminprop/ui/components/empty-state"
import { Input } from "@adminprop/ui/components/input"
import { PageSkeleton } from "@adminprop/ui/components/page-skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@adminprop/ui/components/table"

import { LoadMore } from "@/components/load-more"
import { formatNationalId, portfolioLabel } from "@/lib/owners"
import { useInfiniteOwners } from "@/lib/owners-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

/** Listado de propietarios (spec Fase 7, 5.1). */
export function OwnerList() {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search.trim())

  const query = useInfiniteOwners({ search: debouncedSearch })
  const owners = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.pagination.total ?? 0
  const filtered = debouncedSearch !== ""

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Propietarios
          </h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${total} en total` : " "}
          </p>
        </div>
        <Button asChild>
          <Link href="/propietarios/nuevo">
            <Plus aria-hidden />
            Nuevo propietario
          </Link>
        </Button>
      </div>

      <div className="relative sm:max-w-md">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, apellido o DNI"
          aria-label="Buscar por nombre, apellido o DNI"
          className="pl-9"
        />
      </div>

      {query.isPending ? (
        <PageSkeleton cards={3} />
      ) : query.isError ? (
        <EmptyState
          title="No se pudieron cargar los propietarios"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : owners.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title={
            filtered
              ? "No hay propietarios con esa búsqueda"
              : "Todavía no cargaste propietarios"
          }
          description={
            filtered ? "Probá con otro nombre o DNI." : "Empezá por el primero."
          }
          action={
            !filtered && (
              <Button asChild>
                <Link href="/propietarios/nuevo">Nuevo propietario</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {owners.map((owner) => (
              <li key={owner.id}>
                <OwnerCard owner={owner} />
              </li>
            ))}
          </ul>
          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI / CUIT</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Propiedades</TableHead>
                  <TableHead>Honorario</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Portal</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {owners.map((owner) => (
                  <TableRow key={owner.id} className="relative">
                    <TableCell className="font-medium">
                      {/* El link cubre toda la fila (after:absolute). */}
                      <Link
                        href={`/propietarios/${owner.id}`}
                        className="after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {owner.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatNationalId(owner.nationalId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {owner.email ?? owner.phone ?? "—"}
                    </TableCell>
                    <TableCell>{portfolioLabel(owner)}</TableCell>
                    <TableCell>
                      <ReducedFeeBadge owner={owner} />
                    </TableCell>
                    <TableCell>
                      {owner.hasPortalAccess && (
                        <KeyRound
                          aria-label="Con acceso al portal"
                          className="size-4 text-muted-foreground"
                        />
                      )}
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

/** Badge "Honorario reducido" cuando aplica (RN-07); si no, nada. */
export function ReducedFeeBadge({
  owner,
}: {
  owner: Pick<OwnerSummary, "reducedFee">
}) {
  if (!owner.reducedFee) return null
  return (
    <Badge variant="secondary" className="gap-1">
      <Percent aria-hidden className="size-3" />
      Honorario reducido
    </Badge>
  )
}

function OwnerCard({ owner }: { owner: OwnerSummary }) {
  return (
    <Link
      href={`/propietarios/${owner.id}`}
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{owner.fullName}</p>
        {owner.hasPortalAccess && (
          <KeyRound
            aria-label="Con acceso al portal"
            className="size-4 shrink-0 text-muted-foreground"
          />
        )}
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {formatNationalId(owner.nationalId)}
        {owner.email && ` · ${owner.email}`}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
        <span>{portfolioLabel(owner)}</span>
        <ReducedFeeBadge owner={owner} />
      </div>
    </Link>
  )
}
