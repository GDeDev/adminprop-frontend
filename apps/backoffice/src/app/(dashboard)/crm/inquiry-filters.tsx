"use client"

import { Search } from "lucide-react"

import type { InquirySource } from "@adminprop/shared-types"
import { Input } from "@adminprop/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@adminprop/ui/components/select"

import { PropertySelect } from "@/components/property-select"
import { SOURCE_LABELS } from "@/lib/crm"
import { useAssignees } from "@/lib/crm-api"
import type { InquiryFilters } from "@/lib/crm-api"

export const ALL = "all"
export const UNASSIGNED = "unassigned"

export interface FilterState {
  /** `all`, `unassigned` o el id de un usuario. */
  assignee: string
  source: InquirySource | typeof ALL
  propertyId: string | null
  search: string
}

export const EMPTY_FILTERS: FilterState = {
  assignee: ALL,
  source: ALL,
  propertyId: null,
  search: "",
}

/** Filtros de pantalla -> parámetros de `/crm/pipeline` (sin claves vacías). */
export function toApiFilters(state: FilterState, q: string): InquiryFilters {
  return {
    ...(state.assignee === UNASSIGNED ? { unassigned: true } : {}),
    ...(state.assignee !== ALL && state.assignee !== UNASSIGNED
      ? { assignedToId: state.assignee }
      : {}),
    ...(state.source !== ALL ? { source: state.source } : {}),
    ...(state.propertyId ? { propertyId: state.propertyId } : {}),
    ...(q ? { q } : {}),
  }
}

/** Barra de filtros del tablero: búsqueda, asignado, canal y propiedad. */
export function InquiryFiltersBar({
  value,
  onChange,
}: {
  value: FilterState
  onChange: (next: FilterState) => void
}) {
  const assignees = useAssignees()
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch })

  return (
    <div
      role="search"
      aria-label="Filtros de consultas"
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
    >
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label="Buscar consultas"
          placeholder="Buscar por nombre, email o teléfono"
          className="pl-9"
          value={value.search}
          onChange={(event) => set({ search: event.target.value })}
        />
      </div>
      <Select
        value={value.assignee}
        onValueChange={(assignee) => set({ assignee })}
      >
        <SelectTrigger aria-label="Asignado a" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los asignados</SelectItem>
          <SelectItem value={UNASSIGNED}>Sin asignar</SelectItem>
          {assignees.data?.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.fullName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={value.source}
        onValueChange={(source) =>
          set({ source: source as FilterState["source"] })
        }
      >
        <SelectTrigger aria-label="Canal" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos los canales</SelectItem>
          {(Object.keys(SOURCE_LABELS) as InquirySource[]).map((item) => (
            <SelectItem key={item} value={item}>
              {SOURCE_LABELS[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <PropertySelect
        value={value.propertyId}
        onChange={(propertyId) => set({ propertyId })}
        aria-label="Propiedad"
      />
    </div>
  )
}
