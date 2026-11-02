import { describe, expect, it } from "vitest"

import type { InventoryDetail } from "@adminprop/shared-types"

import {
  groupByCategory,
  inventoryCardState,
  poorWithoutPhotos,
} from "./inventory"

describe("groupByCategory", () => {
  it("agrupa respetando el orden de aparición", () => {
    const groups = groupByCategory([
      { category: "Cocina", n: 1 },
      { category: "Baños", n: 2 },
      { category: "Cocina", n: 3 },
    ])
    expect(groups.map(([category]) => category)).toEqual(["Cocina", "Baños"])
    expect(groups[0]?.[1]).toHaveLength(2)
  })
})

describe("poorWithoutPhotos", () => {
  it("lista sólo los ítems malos sin foto", () => {
    const detail = {
      items: [
        {
          category: "Cocina",
          description: "Heladera",
          condition: "POOR",
          photos: [],
        },
        {
          category: "Baños",
          description: "Grifería",
          condition: "POOR",
          photos: [{ id: "1", url: "x" }],
        },
        {
          category: "Pisos",
          description: "Parquet",
          condition: "GOOD",
          photos: [],
        },
      ],
    } as unknown as InventoryDetail
    expect(poorWithoutPhotos(detail)).toEqual(["Cocina: Heladera"])
  })
})

describe("inventoryCardState", () => {
  it("distingue sin realizar, borrador y confirmado", () => {
    expect(inventoryCardState(undefined)).toBe("Sin realizar")
    expect(inventoryCardState({ status: "DRAFT" })).toBe("Borrador")
    expect(inventoryCardState({ status: "CONFIRMED" })).toBe("Confirmado")
  })
})
