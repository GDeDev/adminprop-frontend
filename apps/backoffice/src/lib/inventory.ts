import type {
  InventoryChange,
  InventoryDetail,
  InventoryStatus,
  InventoryType,
  ItemCondition,
} from "@adminprop/shared-types"

export const INVENTORY_TYPE_LABELS: Record<InventoryType, string> = {
  DELIVERY: "Inventario de entrega",
  RETURN: "Inventario de devolución",
}

export const INVENTORY_STATUS_META: Record<
  InventoryStatus,
  { label: string; variant: "outline" | "default" }
> = {
  DRAFT: { label: "Borrador", variant: "outline" },
  CONFIRMED: { label: "Confirmado", variant: "default" },
}

export const CONDITION_LABELS: Record<ItemCondition, string> = {
  GOOD: "Bueno",
  FAIR: "Regular",
  POOR: "Malo",
  NOT_APPLICABLE: "No aplica",
}

export const CONDITIONS: ItemCondition[] = [
  "GOOD",
  "FAIR",
  "POOR",
  "NOT_APPLICABLE",
]

export const CHANGE_LABELS: Record<InventoryChange, string> = {
  WORSE: "Empeoró",
  BETTER: "Mejoró",
  SAME: "Sin cambios",
  ONLY_DELIVERY: "Sólo en la entrega",
  ONLY_RETURN: "Sólo en la devolución",
}

/** Ítems agrupados por categoría, en el orden en que aparecen. */
export function groupByCategory<T extends { category: string }>(
  items: T[]
): [string, T[]][] {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    groups.set(item.category, [...(groups.get(item.category) ?? []), item])
  }
  return [...groups.entries()]
}

/** Ítems en estado malo sin ninguna foto: la advertencia fuerte de la spec (caso borde 7). */
export function poorWithoutPhotos(detail: InventoryDetail): string[] {
  return detail.items
    .filter((item) => item.condition === "POOR" && item.photos.length === 0)
    .map((item) => `${item.category}: ${item.description}`)
}

/** Texto de la tarjeta de un tipo de inventario, según lo que ya exista. */
export function inventoryCardState(
  summary: { status: InventoryStatus } | undefined
): string {
  if (!summary) return "Sin realizar"
  return INVENTORY_STATUS_META[summary.status].label
}
