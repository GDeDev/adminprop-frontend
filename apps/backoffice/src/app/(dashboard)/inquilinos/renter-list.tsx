"use client"

import * as React from "react"
import Link from "next/link"
import { KeyRound, Plus, Search, Users } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { RenterArrears, RenterSummary } from "@adminprop/shared-types"
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

import { ArrearsBadge } from "@/components/arrears-badge"
import { LoadMore } from "@/components/load-more"
import { useArrears } from "@/lib/billing-api"
import { formatNationalId } from "@/lib/owners"
import { useInfiniteRenters } from "@/lib/renters-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

/** Listado de inquilinos (spec Fase 8, 5.1). */
export function RenterList() {
  const [search, setSearch] = React.useState("")
  const debouncedSearch = useDebouncedValue(search.trim())

  const query = useInfiniteRenters({ search: debouncedSearch })
  const renters = query.data?.pages.flatMap((page) => page.data) ?? []
  const arrears = useArrears(renters.map((renter) => renter.id))
  const total = query.data?.pages[0]?.pagination.total ?? 0
  const filtered = debouncedSearch !== ""

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Inquilinos
          </h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${total} en total` : " "}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/garantes">Garantes</Link>
          </Button>
          <Button asChild>
            <Link href="/inquilinos/nuevo">
              <Plus aria-hidden />
              Nuevo inquilino
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="relative">
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
        {/* El filtro por estado de pago sigue sin efecto en la API (D-46):
            el badge ya es real (/billing/arrears), el filtro llega con el
            listado de inquilinos con deuda de la Fase 19. */}
        <Select value="ALL" disabled>
          <SelectTrigger
            className="w-full sm:w-52"
            aria-label="Filtrar por estado de pago (pronto)"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Estado de pago: todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isPending ? (
        <PageSkeleton cards={3} />
      ) : query.isError ? (
        <EmptyState
          title="No se pudieron cargar los inquilinos"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : renters.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            filtered
              ? "No hay inquilinos con esa búsqueda"
              : "Todavía no cargaste inquilinos"
          }
          description={
            filtered ? "Probá con otro nombre o DNI." : "Empezá por el primero."
          }
          action={
            !filtered && (
              <Button asChild>
                <Link href="/inquilinos/nuevo">Nuevo inquilino</Link>
              </Button>
            )
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {renters.map((renter) => (
              <li key={renter.id}>
                <RenterCard
                  renter={renter}
                  arrears={arrears.data?.get(renter.id)}
                />
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
                  <TableHead>Garante</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Portal</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {renters.map((renter) => (
                  <TableRow key={renter.id} className="relative">
                    <TableCell className="font-medium">
                      <Link
                        href={`/inquilinos/${renter.id}`}
                        className="after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {renter.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatNationalId(renter.nationalId)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {renter.phone ?? renter.email ?? "—"}
                    </TableCell>
                    <TableCell>{renter.guarantor?.fullName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">—</TableCell>
                    <TableCell>
                      <ArrearsBadge arrears={arrears.data?.get(renter.id)} />
                    </TableCell>
                    <TableCell>
                      {renter.hasPortalAccess && (
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

function RenterCard({
  renter,
  arrears,
}: {
  renter: RenterSummary
  arrears: RenterArrears | undefined
}) {
  return (
    <Link
      href={`/inquilinos/${renter.id}`}
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{renter.fullName}</p>
        <ArrearsBadge arrears={arrears} />
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {formatNationalId(renter.nationalId)}
        {renter.phone && ` · ${renter.phone}`}
      </p>
      <p className="text-sm text-muted-foreground">
        {renter.guarantor
          ? `Garante: ${renter.guarantor.fullName}`
          : "Sin garante"}
        {renter.hasPortalAccess && " · Con acceso al portal"}
      </p>
    </Link>
  )
}
