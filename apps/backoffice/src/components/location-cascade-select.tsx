"use client"

import * as React from "react"

import type { LocationNode } from "@adminprop/shared-types"
import { Field, FieldLabel } from "@adminprop/ui/components/field"

import { useLocationTree } from "@/lib/master-data-api"

import { MasterDataSelect } from "./master-data-select"

interface Chain {
  provinceId: string | null
  cityId: string | null
  neighborhoodId: string | null
}

const EMPTY: Chain = { provinceId: null, cityId: null, neighborhoodId: null }

/**
 * Ubicación de una propiedad en cascada (spec Fase 6, 5.3): provincia →
 * localidad → barrio (opcional). El valor es lo más específico elegido: el
 * barrio o, si no hay, la localidad.
 *
 * Cada nivel es un `<MasterDataSelect>` filtrado por el anterior. Para editar
 * una propiedad existente, los niveles de arriba se deducen del árbol.
 */
export function LocationCascadeSelect({
  value,
  onChange,
  invalid,
  idPrefix = "location",
}: {
  value: string | null
  onChange: (locationId: string | null) => void
  invalid?: boolean
  idPrefix?: string
}) {
  const tree = useLocationTree("all")
  const [chain, setChain] = React.useState<Chain | null>(null)

  // Hasta que el usuario toque algo, la cadena sale del valor recibido.
  const current =
    chain ?? (value && tree.data ? chainOf(tree.data, value) : EMPTY)

  function update(next: Chain) {
    setChain(next)
    onChange(next.neighborhoodId ?? next.cityId)
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field data-invalid={invalid && !current.provinceId}>
        <FieldLabel htmlFor={`${idPrefix}-province`}>Provincia</FieldLabel>
        <MasterDataSelect
          id={`${idPrefix}-province`}
          source="locations"
          level="PROVINCE"
          value={current.provinceId}
          onChange={(provinceId) =>
            update({ provinceId, cityId: null, neighborhoodId: null })
          }
          placeholder="Elegí la provincia"
        />
      </Field>
      <Field data-invalid={invalid && !current.cityId}>
        <FieldLabel htmlFor={`${idPrefix}-city`}>Localidad</FieldLabel>
        <MasterDataSelect
          id={`${idPrefix}-city`}
          source="locations"
          parentId={current.provinceId ?? undefined}
          value={current.cityId}
          onChange={(cityId) =>
            update({ ...current, cityId, neighborhoodId: null })
          }
          disabled={!current.provinceId}
          placeholder="Elegí la localidad"
          aria-invalid={invalid && !current.cityId}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-neighborhood`}>
          Barrio (opcional)
        </FieldLabel>
        <MasterDataSelect
          id={`${idPrefix}-neighborhood`}
          source="locations"
          parentId={current.cityId ?? undefined}
          value={current.neighborhoodId}
          onChange={(neighborhoodId) => update({ ...current, neighborhoodId })}
          disabled={!current.cityId}
          placeholder="Sin barrio"
        />
      </Field>
    </div>
  )
}

/** Busca la ubicación en el árbol y arma su cadena de padres. */
export function chainOf(tree: LocationNode[], locationId: string): Chain {
  const path = findPath(tree, locationId)
  if (!path) return EMPTY
  const byLevel = (level: LocationNode["level"]) =>
    path.find((node) => node.level === level)?.id ?? null
  return {
    provinceId: byLevel("PROVINCE"),
    cityId: byLevel("CITY"),
    neighborhoodId: byLevel("NEIGHBORHOOD"),
  }
}

function findPath(
  nodes: LocationNode[],
  id: string,
  trail: LocationNode[] = []
): LocationNode[] | null {
  for (const node of nodes) {
    const here = [...trail, node]
    if (node.id === id) return here
    const found = findPath(node.children, id, here)
    if (found) return found
  }
  return null
}
