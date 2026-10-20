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

import { formatNationalId } from "@/lib/owners"
import { useInfiniteOwners } from "@/lib/owners-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

/**
 * Selector de propietario con búsqueda contra la API (nombre, apellido o
 * DNI): una inmobiliaria puede tener cientos, así que no se cargan todos.
 * `selectedLabel` muestra al elegido aunque no esté en la página buscada.
 */
export function OwnerSelect({
  id,
  value,
  selectedLabel,
  onChange,
  "aria-invalid": ariaInvalid,
}: {
  id?: string
  value: string | null
  /** Nombre del propietario ya elegido (ficha en edición). */
  selectedLabel?: string | null
  onChange: (ownerId: string | null, fullName: string | null) => void
  "aria-invalid"?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  // Lo último elegido acá; si el valor viene de afuera, se usa selectedLabel.
  const [picked, setPicked] = React.useState<{
    id: string
    fullName: string
  } | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteOwners({ search: debouncedSearch })
  const owners = query.data?.pages.flatMap((page) => page.data) ?? []
  const label =
    picked && picked.id === value ? picked.fullName : (selectedLabel ?? null)

  function select(ownerId: string, fullName: string) {
    setPicked({ id: ownerId, fullName })
    onChange(ownerId, fullName)
    setOpen(false)
  }

  function clear() {
    setPicked(null)
    onChange(null, null)
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
            className="w-full justify-between font-normal"
          >
            <span className={value ? "" : "text-muted-foreground"}>
              {value ? (label ?? "Propietario elegido") : "Sin propietario"}
            </span>
            <ChevronsUpDown aria-hidden className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
          {/* El filtrado lo hace la API; cmdk no vuelve a filtrar. */}
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nombre o DNI"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {query.isPending
                  ? "Buscando…"
                  : query.isError
                    ? "No se pudo buscar."
                    : "No hay propietarios con esa búsqueda."}
              </CommandEmpty>
              <CommandGroup>
                {owners.map((owner) => (
                  <CommandItem
                    key={owner.id}
                    value={owner.id}
                    onSelect={() => select(owner.id, owner.fullName)}
                  >
                    <Check
                      aria-hidden
                      className={
                        owner.id === value ? "opacity-100" : "opacity-0"
                      }
                    />
                    <span className="flex-1 truncate">{owner.fullName}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatNationalId(owner.nationalId)}
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
          aria-label="Quitar propietario"
          onClick={clear}
        >
          <X aria-hidden />
        </Button>
      )}
    </div>
  )
}
