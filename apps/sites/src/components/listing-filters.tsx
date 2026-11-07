import { Search } from "lucide-react"

import type { PublicFilters } from "@adminprop/shared-types"

import type { ListingQuery } from "@/lib/api"

const FIELD =
  "min-h-11 w-full rounded-site border border-site-border bg-site-bg px-3 text-site-text"

/**
 * Filtros del listado: un `<form method="get">`, así que cada búsqueda es una
 * URL que se puede compartir y funciona sin JavaScript.
 */
export function ListingFilters({
  action,
  filters,
  query,
  preview,
}: {
  action: string
  filters: PublicFilters | null
  query: ListingQuery
  preview: string | null
}) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      aria-label="Filtrar propiedades"
      className="rounded-site border-site-border bg-site-bg text-site-text grid gap-4 border p-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {preview && <input type="hidden" name="preview" value={preview} />}
      <div>
        <label htmlFor="f-operation" className="mb-1 block text-sm font-medium">
          Operación
        </label>
        <select
          id="f-operation"
          name="operation"
          defaultValue={query.operation ?? ""}
          className={FIELD}
        >
          <option value="">Comprar o alquilar</option>
          <option value="SALE">Comprar</option>
          <option value="RENT">Alquilar</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-type" className="mb-1 block text-sm font-medium">
          Tipo de propiedad
        </label>
        <select
          id="f-type"
          name="propertyTypeId"
          defaultValue={query.propertyTypeId ?? ""}
          className={FIELD}
        >
          <option value="">Todos los tipos</option>
          {filters?.propertyTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-location" className="mb-1 block text-sm font-medium">
          Ubicación
        </label>
        <select
          id="f-location"
          name="locationId"
          defaultValue={query.locationId ?? ""}
          className={FIELD}
        >
          <option value="">Todas las zonas</option>
          {filters?.locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-bedrooms" className="mb-1 block text-sm font-medium">
          Dormitorios
        </label>
        <select
          id="f-bedrooms"
          name="bedrooms"
          defaultValue={query.bedrooms ? String(query.bedrooms) : ""}
          className={FIELD}
        >
          <option value="">Cualquiera</option>
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n === 4 ? "4 o más" : `${n} o más`}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-from" className="mb-1 block text-sm font-medium">
          Precio desde
        </label>
        <input
          id="f-from"
          name="priceFrom"
          type="number"
          inputMode="numeric"
          min={0}
          step="any"
          defaultValue={query.priceFrom ?? ""}
          placeholder="Sin mínimo"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="f-to" className="mb-1 block text-sm font-medium">
          Precio hasta
        </label>
        <input
          id="f-to"
          name="priceTo"
          type="number"
          inputMode="numeric"
          min={0}
          step="any"
          defaultValue={query.priceTo ?? ""}
          placeholder="Sin máximo"
          className={FIELD}
        />
      </div>
      <div>
        <label htmlFor="f-currency" className="mb-1 block text-sm font-medium">
          Moneda del precio
        </label>
        <select
          id="f-currency"
          name="currency"
          defaultValue={query.currency ?? ""}
          className={FIELD}
        >
          <option value="">La de la inmobiliaria</option>
          <option value="ARS">Pesos ($)</option>
          <option value="USD">Dólares (US$)</option>
        </select>
      </div>
      <div className="flex items-end gap-2">
        <button
          type="submit"
          className="rounded-site bg-site-primary text-site-on-primary inline-flex min-h-11 flex-1 items-center justify-center gap-2 px-5 font-semibold"
        >
          <Search aria-hidden className="size-5" />
          Buscar
        </button>
        <a
          href={action}
          className="inline-flex min-h-11 items-center px-3 underline underline-offset-4"
        >
          Limpiar
        </a>
      </div>
    </form>
  )
}
