import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AxiosError } from "axios"
import { afterEach, describe, expect, it, vi } from "vitest"

import { InventoryEditor } from "./inventory-editor"

const refetch = vi.fn()
let queryState: Record<string, unknown>
let updatePending = false

function axiosError(status: number, code: string) {
  return new AxiosError("x", String(status), undefined, undefined, {
    status,
    statusText: "Error",
    headers: {},
    config: {} as never,
    data: { success: false, code, message: "Falló" },
  })
}

const detail = {
  id: "inv1",
  type: "DELIVERY",
  status: "DRAFT",
  date: "2026-11-01",
  generalNotes: null,
  tenantAcknowledged: false,
  correctionReason: null,
  confirmedAt: null,
  performedBy: null,
  items: [
    {
      id: "i1",
      category: "Cocina",
      description: "Heladera",
      condition: "GOOD",
      notes: null,
      photos: [],
    },
  ],
}

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}))
vi.mock("@/lib/inventory-api", () => {
  const idle = () => ({ mutateAsync: vi.fn(), isPending: false })
  return {
    useInventory: () => queryState,
    useUpdateInventory: () => ({
      mutateAsync: vi.fn(),
      isPending: updatePending,
    }),
    useConfirmInventory: idle,
    useCorrectInventory: idle,
    useDeleteInventoryPhoto: idle,
    useUploadItemPhotos: idle,
  }
})

afterEach(() => {
  vi.clearAllMocks()
  updatePending = false
})

function renderEditor() {
  render(<InventoryEditor contractId="c1" inventoryId="inv1" />)
}

describe("InventoryEditor", () => {
  it("muestra el estado vacío si el inventario no existe (404)", () => {
    queryState = {
      isPending: false,
      isError: true,
      error: axiosError(404, "INVENTORY_NOT_FOUND"),
      refetch,
    }
    renderEditor()
    expect(screen.getByText("No se encontró el inventario")).toBeVisible()
    expect(screen.queryByRole("button", { name: "Reintentar" })).toBeNull()
  })

  it("ofrece reintentar ante cualquier otro error", async () => {
    queryState = {
      isPending: false,
      isError: true,
      error: axiosError(500, "DATABASE_ERROR"),
      refetch,
    }
    renderEditor()
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  describe("con el inventario cargado", () => {
    function load() {
      queryState = { isPending: false, isError: false, data: detail, refetch }
    }

    it("el estado es un radiogroup que se mueve con las flechas", async () => {
      load()
      renderEditor()
      const group = screen.getByRole("radiogroup", {
        name: "Estado de Heladera",
      })
      expect(group).toBeVisible()
      const good = screen.getByRole("radio", { name: "Bueno" })
      expect(good).toBeChecked()
      good.focus()
      await userEvent.keyboard("{ArrowRight>}")
      await waitFor(() =>
        expect(screen.getByRole("radio", { name: "Regular" })).toBeChecked()
      )
      expect(screen.getByText("Cambios sin guardar")).toBeVisible()
    })

    it("arranca como Guardado y marca el ítem vacío al guardar", async () => {
      load()
      renderEditor()
      expect(screen.getByText("Guardado")).toBeVisible()
      await userEvent.click(
        screen.getByRole("button", { name: /Agregar ítem/ })
      )
      expect(screen.getByText("Cambios sin guardar")).toBeVisible()
      await userEvent.click(
        screen.getByRole("button", { name: "Guardar borrador" })
      )
      const input = screen.getByLabelText("Descripción del ítem")
      expect(input).toHaveAttribute("aria-invalid", "true")
      expect(input).toHaveFocus()
      expect(
        screen.getByText("Poné una descripción para este ítem.")
      ).toBeVisible()
    })

    it("muestra Guardando… mientras se guarda", () => {
      load()
      updatePending = true
      renderEditor()
      expect(screen.getByRole("button", { name: "Guardando…" })).toBeDisabled()
    })
  })
})
