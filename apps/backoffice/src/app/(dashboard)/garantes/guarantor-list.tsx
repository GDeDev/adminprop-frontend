"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Search, ShieldCheck } from "lucide-react"

import { apiErrorMessage } from "@adminprop/session/client"
import type { GuarantorSummary } from "@adminprop/shared-types"
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
import { formatNationalId } from "@/lib/owners"
import { GUARANTEE_TYPE_LABELS } from "@/lib/renters"
import { useInfiniteGuarantors } from "@/lib/renters-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

import { GuarantorFormDialog } from "./guarantor-form-dialog"

/** Listado de garantes (spec Fase 8, 5.4). */
export function GuarantorList() {
  const [search, setSearch] = React.useState("")
  const [formOpen, setFormOpen] = React.useState(false)
  const [formKey, setFormKey] = React.useState(0)
  const debouncedSearch = useDebouncedValue(search.trim())

  const query = useInfiniteGuarantors({ search: debouncedSearch })
  const guarantors = query.data?.pages.flatMap((page) => page.data) ?? []
  const total = query.data?.pages[0]?.pagination.total ?? 0
  const filtered = debouncedSearch !== ""

  function openCreate() {
    setFormKey((k) => k + 1)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Garantes
          </h1>
          <p className="text-sm text-muted-foreground">
            {query.data ? `${total} en total` : " "}
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus aria-hidden />
          Nuevo garante
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
          title="No se pudieron cargar los garantes"
          description={apiErrorMessage(
            query.error,
            "Probá de nuevo en un rato."
          )}
          action={
            <Button onClick={() => void query.refetch()}>Reintentar</Button>
          }
        />
      ) : guarantors.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={
            filtered
              ? "No hay garantes con esa búsqueda"
              : "Todavía no cargaste garantes"
          }
          description={
            filtered
              ? "Probá con otro nombre o DNI."
              : "También se pueden crear desde el alta de un inquilino."
          }
          action={
            !filtered && <Button onClick={openCreate}>Nuevo garante</Button>
          }
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3 md:hidden">
            {guarantors.map((guarantor) => (
              <li key={guarantor.id}>
                <GuarantorCard guarantor={guarantor} />
              </li>
            ))}
          </ul>
          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI / CUIT</TableHead>
                  <TableHead>Garantía</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Inquilinos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guarantors.map((guarantor) => (
                  <TableRow key={guarantor.id} className="relative">
                    <TableCell className="font-medium">
                      <Link
                        href={`/garantes/${guarantor.id}`}
                        className="after:absolute after:inset-0 focus-visible:outline-none"
                      >
                        {guarantor.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatNationalId(guarantor.nationalId)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {GUARANTEE_TYPE_LABELS[guarantor.guaranteeType]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {guarantor.phone ?? guarantor.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      {renterCountLabel(guarantor.renterCount)}
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

      <GuarantorFormDialog
        key={formKey}
        open={formOpen}
        onOpenChange={setFormOpen}
        guarantor={null}
      />
    </div>
  )
}

export function renterCountLabel(count: number): string {
  if (count === 0) return "Sin inquilinos"
  return count === 1 ? "1 inquilino" : `${count} inquilinos`
}

function GuarantorCard({ guarantor }: { guarantor: GuarantorSummary }) {
  return (
    <Link
      href={`/garantes/${guarantor.id}`}
      className="flex flex-col gap-1 rounded-xl border bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{guarantor.fullName}</p>
        <Badge variant="outline">
          {GUARANTEE_TYPE_LABELS[guarantor.guaranteeType]}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground tabular-nums">
        {formatNationalId(guarantor.nationalId)}
        {guarantor.phone && ` · ${guarantor.phone}`}
      </p>
      <p className="text-sm">{renterCountLabel(guarantor.renterCount)}</p>
    </Link>
  )
}
