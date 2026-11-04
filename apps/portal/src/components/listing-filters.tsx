import Link from "next/link"

import type { PublicFilters, PublicListingQuery } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"

const FIELD =
  "h-11 w-full rounded-md border border-control bg-card px-3 text-sm shadow-xs transition-[border-color,box-shadow] outline-none hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"

/**
 * Filtros del listado: un formulario GET, así funcionan sin JavaScript y
 * quedan en la URL (se pueden compartir). El servidor vuelve a renderizar.
 */
export function ListingFilters({
  filters,
  query,
}: {
  filters: PublicFilters | null
  query: PublicListingQuery
}) {
  return (
    <form
      action="/"
      method="get"
      className="grid gap-3 rounded-xl border bg-card p-4 shadow-raised sm:grid-cols-2 lg:grid-cols-6"
    >
      <label className="flex flex-col gap-1 text-xs text-muted-foreground lg:col-span-2">
        Ubicación
        <select
          name="locationId"
          defaultValue={query.locationId ?? ""}
          className={FIELD}
        >
          <option value="">Todas</option>
          {filters?.locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Tipo
        <select
          name="propertyTypeId"
          defaultValue={query.propertyTypeId ?? ""}
          className={FIELD}
        >
          <option value="">Todos</option>
          {filters?.propertyTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Moneda
        <select
          name="currency"
          defaultValue={query.currency ?? ""}
          className={FIELD}
        >
          <option value="">Cualquiera</option>
          <option value="ARS">Pesos</option>
          <option value="USD">Dólares</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Precio desde
        <input
          name="priceFrom"
          inputMode="numeric"
          defaultValue={query.priceFrom ?? ""}
          className={FIELD}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        Precio hasta
        <input
          name="priceTo"
          inputMode="numeric"
          defaultValue={query.priceTo ?? ""}
          className={FIELD}
        />
      </label>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="submit">Buscar</Button>
        <Button type="button" variant="ghost" asChild>
          <Link href="/">Limpiar</Link>
        </Button>
      </div>
    </form>
  )
}
