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
import { useInfiniteRenters } from "@/lib/renters-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

/**
 * Selector de inquilino con búsqueda por nombre o DNI contra la API, mismo
 * patrón que `OwnerSelect` (DT-41). Con `withoutActiveContract` se dejan
 * afuera los que ya son titulares de un contrato activo (RN-05).
 */
export function RenterSelect({
  id,
  value,
  selectedLabel,
  onChange,
  withoutActiveContract = false,
  placeholder = "Todos los inquilinos",
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
}: {
  id?: string
  value: string | null
  /** Nombre del inquilino ya elegido (viene de afuera). */
  selectedLabel?: string | null
  onChange: (renterId: string | null, fullName: string | null) => void
  withoutActiveContract?: boolean
  placeholder?: string
  "aria-invalid"?: boolean
  "aria-label"?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [picked, setPicked] = React.useState<{
    id: string
    fullName: string
  } | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteRenters({ search: debouncedSearch })
  const renters = (query.data?.pages.flatMap((page) => page.data) ?? []).filter(
    (renter) => !withoutActiveContract || renter.activeContractId === null
  )
  const label =
    picked && picked.id === value ? picked.fullName : (selectedLabel ?? null)

  function select(renterId: string, fullName: string) {
    setPicked({ id: renterId, fullName })
    onChange(renterId, fullName)
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
              {value ? (label ?? "Inquilino elegido") : placeholder}
            </span>
            <ChevronsUpDown aria-hidden className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
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
                    : withoutActiveContract
                      ? "No hay inquilinos sin contrato con esa búsqueda."
                      : "No hay inquilinos con esa búsqueda."}
              </CommandEmpty>
              <CommandGroup>
                {renters.map((renter) => (
                  <CommandItem
                    key={renter.id}
                    value={renter.id}
                    onSelect={() => select(renter.id, renter.fullName)}
                  >
                    <Check
                      aria-hidden
                      className={
                        renter.id === value ? "opacity-100" : "opacity-0"
                      }
                    />
                    <span className="flex-1 truncate">{renter.fullName}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatNationalId(renter.nationalId)}
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
          aria-label="Quitar inquilino"
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
