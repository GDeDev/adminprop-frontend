import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { InternalAlert } from "@adminprop/shared-types"

import { InternalAlerts } from "./internal-alerts"

let alerts: InternalAlert[] = []
const markRead = vi.fn()
const markAll = vi.fn()

vi.mock("@/lib/automations-api", () => ({
  useInfiniteAlerts: () => ({
    isPending: false,
    isError: false,
    isSuccess: true,
    data: {
      pages: [
        {
          data: alerts,
          pagination: {
            page: 1,
            limit: 20,
            total: alerts.length,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      ],
    },
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
  }),
  useMarkAlertRead: () => ({ mutateAsync: markRead, isPending: false }),
  useMarkAllAlertsRead: () => ({ mutateAsync: markAll, isPending: false }),
}))

afterEach(() => {
  vi.clearAllMocks()
  alerts = []
})

describe("InternalAlerts", () => {
  it("muestra los avisos con link y los marca leídos", async () => {
    alerts = [
      {
        id: "a1",
        type: "RENT_UPDATE_PENDING",
        title: "Aumento pendiente en Calle 1 100",
        body: "Falta el índice ICL de 2026-10.",
        entityType: "Contract",
        entityId: "c1",
        link: "/contratos/c1",
        createdAt: new Date().toISOString(),
        readAt: null,
      },
    ]
    markRead.mockResolvedValue({})
    const user = userEvent.setup()
    render(<InternalAlerts />)

    expect(
      screen.getByRole("link", { name: "Aumento pendiente en Calle 1 100" })
    ).toHaveAttribute("href", "/contratos/c1")
    expect(
      screen.getByText(/Aumento pendiente de aplicar · recién/)
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Marcar leído/ }))
    expect(markRead).toHaveBeenCalledWith("a1")
  })

  it("sin avisos lo dice", () => {
    render(<InternalAlerts />)
    expect(screen.getByText("Sin avisos pendientes.")).toBeInTheDocument()
  })
})
