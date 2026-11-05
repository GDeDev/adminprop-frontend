import { Search } from "lucide-react"
import { useId } from "react"

import type { PublicFilters } from "@adminprop/shared-types"

import { cn } from "@/lib/cn"

const SELECT =
  "min-h-11 w-full rounded-site border border-site-border bg-site-bg px-3 text-site-text"

/**
 * Buscador de la portada y del listado. Es un `<form method="get">` común: sin
 * JavaScript también funciona, y el resultado es una URL compartible.
 */
export function SearchBar({
  action,
  filters,
  defaults,
  preview = null,
  layout = "card",
  className,
}: {
  /** Link al listado (con el prefijo del sitio). */
  action: string
  filters: PublicFilters | null
  defaults?: {
    operation?: string
    propertyTypeId?: string
    locationId?: string
  }
  /** Token de vista previa: viaja como campo oculto para no perderlo. */
  preview?: string | null
  /** `card`: campos apilados en mobile; `bar`: una barra horizontal desde md. */
  layout?: "card" | "bar"
  className?: string
}) {
  const id = useId()
  const cell = layout === "bar" ? "md:flex-1" : "lg:flex-1"

  return (
    <form
      action={action}
      method="get"
      role="search"
      aria-label="Buscar propiedades"
      className={cn(
        "flex flex-col gap-3",
        layout === "bar"
          ? "md:flex-row md:items-end"
          : "lg:flex-row lg:items-end",
        className
      )}
    >
      {preview && <input type="hidden" name="preview" value={preview} />}
      <div className={cn("flex flex-col gap-1", cell)}>
        <label htmlFor={`${id}-operation`} className="text-sm font-medium">
          Operación
        </label>
        <select
          id={`${id}-operation`}
          name="operation"
          defaultValue={defaults?.operation ?? ""}
          className={SELECT}
        >
          <option value="">Comprar o alquilar</option>
          <option value="SALE">Comprar</option>
          <option value="RENT">Alquilar</option>
        </select>
      </div>
      <div className={cn("flex flex-col gap-1", cell)}>
        <label htmlFor={`${id}-type`} className="text-sm font-medium">
          Tipo de propiedad
        </label>
        <select
          id={`${id}-type`}
          name="propertyTypeId"
          defaultValue={defaults?.propertyTypeId ?? ""}
          className={SELECT}
        >
          <option value="">Todos los tipos</option>
          {filters?.propertyTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>
      <div className={cn("flex flex-col gap-1", cell)}>
        <label htmlFor={`${id}-location`} className="text-sm font-medium">
          Ubicación
        </label>
        <select
          id={`${id}-location`}
          name="locationId"
          defaultValue={defaults?.locationId ?? ""}
          className={SELECT}
        >
          <option value="">Todas las zonas</option>
          {filters?.locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-site bg-site-primary text-site-on-primary inline-flex min-h-11 items-center justify-center gap-2 px-6 font-semibold"
      >
        <Search aria-hidden className="size-5" />
        Buscar
      </button>
    </form>
  )
}
