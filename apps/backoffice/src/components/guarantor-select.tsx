"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, X } from "lucide-react"

import type { GuarantorDetail } from "@adminprop/shared-types"
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

import { GuarantorFormDialog } from "@/app/(dashboard)/garantes/guarantor-form-dialog"
import { formatNationalId } from "@/lib/owners"
import { useInfiniteGuarantors } from "@/lib/renters-api"
import { useDebouncedValue } from "@/lib/use-debounced-value"

/**
 * Selector de garante con búsqueda contra la API y "crear nuevo" inline
 * (spec Fase 8, 5.3 y casos borde): si no aparece, se lo da de alta desde el
 * mismo formulario y queda elegido.
 */
export function GuarantorSelect({
  id,
  value,
  selectedLabel,
  onChange,
  "aria-invalid": ariaInvalid,
}: {
  id?: string
  value: string | null
  /** Nombre del garante ya elegido (ficha en edición). */
  selectedLabel?: string | null
  onChange: (guarantorId: string | null, fullName: string | null) => void
  "aria-invalid"?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [creating, setCreating] = React.useState(false)
  const [createKey, setCreateKey] = React.useState(0)
  const [search, setSearch] = React.useState("")
  const [picked, setPicked] = React.useState<{
    id: string
    fullName: string
  } | null>(null)
  const debouncedSearch = useDebouncedValue(search.trim())
  const query = useInfiniteGuarantors({ search: debouncedSearch })
  const guarantors = query.data?.pages.flatMap((page) => page.data) ?? []
  const label =
    picked && picked.id === value ? picked.fullName : (selectedLabel ?? null)

  function select(guarantorId: string, fullName: string) {
    setPicked({ id: guarantorId, fullName })
    onChange(guarantorId, fullName)
    setOpen(false)
  }

  function startCreate() {
    setOpen(false)
    setCreateKey((k) => k + 1)
    setCreating(true)
  }

  function created(guarantor: GuarantorDetail) {
    select(guarantor.id, guarantor.fullName)
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
              {value ? (label ?? "Garante elegido") : "Sin garante"}
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
                    : "No hay garantes con esa búsqueda."}
              </CommandEmpty>
              <CommandGroup>
                {guarantors.map((guarantor) => (
                  <CommandItem
                    key={guarantor.id}
                    value={guarantor.id}
                    onSelect={() => select(guarantor.id, guarantor.fullName)}
                  >
                    <Check
                      aria-hidden
                      className={
                        guarantor.id === value ? "opacity-100" : "opacity-0"
                      }
                    />
                    <span className="flex-1 truncate">
                      {guarantor.fullName}
                    </span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatNationalId(guarantor.nationalId)}
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
                <CommandItem
                  value="__new"
                  onSelect={startCreate}
                  className="text-primary"
                >
                  <Plus aria-hidden />
                  Crear un garante nuevo
                </CommandItem>
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
          aria-label="Quitar garante"
          onClick={() => {
            setPicked(null)
            onChange(null, null)
          }}
        >
          <X aria-hidden />
        </Button>
      )}
      <GuarantorFormDialog
        key={createKey}
        open={creating}
        onOpenChange={setCreating}
        guarantor={null}
        onSaved={created}
      />
    </div>
  )
}
