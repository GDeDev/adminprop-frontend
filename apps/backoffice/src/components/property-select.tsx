"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { Button } from "@adminprop/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@adminprop/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@adminprop/ui/components/popover"

import { useInfiniteProperties } from "@/lib/properties-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

/**
 * Selector de propiedad con búsqueda por dirección contra la API, mismo
 * patrón que `OwnerSelect` (DT-41). Con `withoutActiveContract` se dejan
 * afuera las que ya tienen contrato activo (alta de contrato, RN-04).
 */
export function PropertySelect({
  id,
  value,
  selectedLabel,
  onChange,
  withoutActiveContract = false,
  placeholder = "Todas las propiedades",
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: {
  id?: string
  value: string | null
  /** Dirección de la propiedad ya elegida (viene de afuera). */
  selectedLabel?: string | null
  onChange: (propertyId: string | null, address: string | null) => void
  withoutActiveContract?: boolean
  placeholder?: string
  "aria-invalid"?: boolean
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [picked, setPicked] = React.useState<{
    id: string
    address: string
  } | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteProperties({ search: debouncedSearch })
  const properties = (
    query.data?.pages.flatMap((page) => page.data) ?? []
  ).filter(
    (property) => !withoutActiveContract || property.activeContractId === null
  )
  const label =
    picked && picked.id === value ? picked.address : (selectedLabel ?? null)

  function select(propertyId: string, address: string) {
    setPicked({ id: propertyId, address })
    onChange(propertyId, address)
    setOpen(false)
  }

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            aria-label={ariaLabel}
            className="w-full justify-between font-normal"
          >
            <span className={value ? "truncate" : "text-muted-foreground"}>
              {value ? (label ?? "Propiedad elegida") : placeholder}
            </span>
            <ChevronsUpDown aria-hidden className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por dirección"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {query.isPending
                  ? "Buscando…"
                  : query.isError
                    ? "No se pudo buscar."
                    : withoutActiveContract
                      ? "No hay propiedades sin contrato con esa búsqueda."
                      : "No hay propiedades con esa búsqueda."}
              </CommandEmpty>
              <CommandGroup>
                {properties.map((property) => (
                  <CommandItem
                    key={property.id}
                    value={property.id}
                    onSelect={() => select(property.id, property.address)}
                  >
                    <Check
                      aria-hidden
                      className={
                        property.id === value ? "opacity-100" : "opacity-0"
                      }
                    />
                    <span className="flex-1 truncate">{property.address}</span>
                    <span className="text-xs text-muted-foreground">
                      {property.location?.path ?? ""}
                    </span>
                  </CommandItem>
                ))}
                {query.hasNextPage && (
                  <CommandItem
                    value="__more"
                    onSelect={() => void query.fetchNextPage()}
                    className="justify-center text-muted-foreground"
                  >
                    {query.isFetchingNextPage ? "Cargando…" : "Ver más"}
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Quitar propiedad"
          onClick={() => {
            setPicked(null)
            onChange(null, null)
          }}
        >
          <X aria-hidden />
        </Button>
      )}
    </div>
  )
}
