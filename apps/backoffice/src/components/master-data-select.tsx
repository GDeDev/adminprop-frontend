"use client"

import * as React from "react"
import { ChevronsUpDown } from "lucide-react"

import type { CatalogKey, LocationLevel } from "@adminprop/shared-types"
import { Button } from "@adminprop/ui/components/button"
import { Checkbox } from "@adminprop/ui/components/checkbox"
import { Label } from "@adminprop/ui/components/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@adminprop/ui/components/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { useCatalog, useLocations } from "@/lib/master-data-api"

interface Option {
  id: string
  name: string
  isActive: boolean
}

interface BaseProps {
  /** Qué maestro: uno plano, o ubicaciones filtradas por nivel y padre. */
  source: CatalogKey | "locations"
  /** Sólo para `source="locations"`: para los selects en cascada. */
  level?: LocationLevel
  parentId?: string
  id?: string
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  "aria-label"?: string
}

interface SingleProps extends BaseProps {
  multiple?: false
  value: string | null
  onChange: (value: string | null) => void
}

interface MultipleProps extends BaseProps {
  multiple: true
  value: string[]
  onChange: (value: string[]) => void
}

export type MasterDataSelectProps = SingleProps | MultipleProps

/**
 * Selector de maestros (spec Fase 5, 6): único (tipo de propiedad,
 * ubicación) o múltiple (amenities). Lo reusan los formularios de las fases
 * siguientes.
 *
 * Trae también los desactivados, pero sólo los muestra si ya estaban
 * elegidos (spec 4: un registro viejo sigue mostrando su valor) y no se
 * pueden volver a elegir.
 */
export function MasterDataSelect(props: MasterDataSelectProps) {
  const { options, isLoading, isError } = useOptions(props)
  const selected = new Set(props.multiple ? props.value : [props.value])
  const visible = options.filter((o) => o.isActive || selected.has(o.id))

  const placeholder = isLoading
    ? "Cargando…"
    : isError
      ? "No se pudieron cargar las opciones"
      : (props.placeholder ?? "Elegí una opción")
  const disabled = props.disabled || isLoading || isError

  if (props.multiple) {
    return (
      <MultiSelect
        {...props}
        options={visible}
        placeholder={placeholder}
        disabled={disabled}
      />
    )
  }

  return (
    <Select
      value={props.value ?? ""}
      onValueChange={(value) => props.onChange(value || null)}
      disabled={disabled}
    >
      <SelectTrigger
        id={props.id}
        className="w-full"
        aria-invalid={props["aria-invalid"]}
        aria-label={props["aria-label"]}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {visible.map((option) => (
          <SelectItem
            key={option.id}
            value={option.id}
            disabled={!option.isActive}
          >
            {optionLabel(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function MultiSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  ...aria
}: MultipleProps & { options: Option[]; placeholder: string }) {
  const chosen = options.filter((o) => value.includes(o.id))
  const summary =
    chosen.length === 0
      ? placeholder
      : chosen.length <= 2
        ? chosen.map((o) => o.name).join(", ")
        : `${chosen.length} seleccionadas`

  function toggle(optionId: string, checked: boolean) {
    onChange(
      checked ? [...value, optionId] : value.filter((v) => v !== optionId)
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={aria["aria-invalid"]}
          aria-label={aria["aria-label"]}
          className="w-full justify-between font-normal"
        >
          <span className={chosen.length === 0 ? "text-muted-foreground" : ""}>
            {summary}
          </span>
          <ChevronsUpDown aria-hidden className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-2">
        <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
          {options.map((option) => {
            const checked = value.includes(option.id)
            const optionId = `${id ?? "master"}-${option.id}`
            return (
              <li key={option.id}>
                <Label
                  htmlFor={optionId}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 font-normal hover:bg-muted md:min-h-9"
                >
                  <Checkbox
                    id={optionId}
                    checked={checked}
                    // Un desactivado se puede sacar, no volver a poner.
                    disabled={!option.isActive && !checked}
                    onCheckedChange={(state) =>
                      toggle(option.id, state === true)
                    }
                  />
                  {optionLabel(option)}
                </Label>
              </li>
            )
          })}
          {options.length === 0 && (
            <li className="px-2 py-3 text-sm text-muted-foreground">
              No hay opciones cargadas.
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

function optionLabel(option: Option) {
  return option.isActive ? option.name : `${option.name} (desactivado)`
}

function useOptions(props: MasterDataSelectProps) {
  const { source } = props
  const isLocation = source === "locations"
  // Los dos hooks se llaman siempre (reglas de hooks), pero sólo el que
  // corresponde hace el request.
  const catalog = useCatalog(
    source === "locations" ? "property-types" : source,
    "all",
    !isLocation
  )
  const locations = useLocations(
    { level: props.level, parentId: props.parentId, isActive: "all" },
    isLocation
  )
  const query = isLocation ? locations : catalog
  const options: Option[] = query.data ?? []
  return {
    options,
    isLoading: query.isPending,
    isError: query.isError,
  }
}
