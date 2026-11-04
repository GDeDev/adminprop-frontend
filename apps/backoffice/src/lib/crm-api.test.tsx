import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { InquiryCard, PipelineDto } from "@adminprop/shared-types"

import { crmKey, useMoveInquiry } from "./crm-api"

const patch = vi.fn()
// La respuesta se arma afuera del espía: vitest engancha un `.then` sin
// `.catch` a lo que devuelve un `vi.fn`, y una promesa rechazada ahí cuenta
// como rechazo no manejado y hace fallar el test aunque el código lo atienda.
let outcome: () => Promise<unknown> = () => Promise.resolve(undefined)

vi.mock("./api-client", () => ({
  apiClient: {
    patch: (...args: unknown[]) => {
      patch(...args)
      return outcome()
    },
  },
}))

function card(id: string, stage: InquiryCard["stage"]): InquiryCard {
  return {
    id,
    name: id,
    email: null,
    phone: "1",
    message: "",
    stage,
    boardPosition: 1,
    source: "PORTAL",
    property: null,
    assignedTo: null,
    nextActionAt: null,
    lastContactAt: null,
    createdAt: "2026-11-01T10:00:00Z",
    ageHours: 1,
    hasWhatsApp: true,
  }
}

const pipeline = (): PipelineDto => ({
  columns: [
    { stage: "NEW", total: 2, cards: [card("a", "NEW"), card("b", "NEW")] },
    { stage: "CONTACTED", total: 0, cards: [] },
    { stage: "VISIT_SCHEDULED", total: 0, cards: [] },
    { stage: "PROPOSAL_SENT", total: 0, cards: [] },
    { stage: "CLOSED_WON", total: 0, cards: [] },
    { stage: "CLOSED_LOST", total: 0, cards: [] },
  ],
})

const key = [...crmKey, "pipeline", {}]

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  client.setQueryData(key, pipeline())
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, ...renderHook(() => useMoveInquiry(), { wrapper }) }
}

function stages(client: QueryClient) {
  const data = client.getQueryData<PipelineDto>(key)!
  return Object.fromEntries(
    data.columns.map((column) => [
      column.stage,
      { total: column.total, ids: column.cards.map((item) => item.id) },
    ])
  )
}

beforeEach(() => {
  patch.mockReset()
  outcome = () => Promise.resolve(undefined)
})

describe("useMoveInquiry", () => {
  it("mueve la tarjeta al instante, antes de que responda la API", async () => {
    let resolve!: (value: unknown) => void
    outcome = () => new Promise((r) => (resolve = r))
    const { client, result } = setup()

    act(() => {
      result.current.mutate({ id: "a", stage: "CONTACTED", index: 0 })
    })
    await waitFor(() =>
      expect(stages(client).CONTACTED).toEqual({ total: 1, ids: ["a"] })
    )
    expect(stages(client).NEW).toEqual({ total: 1, ids: ["b"] })

    await act(async () => {
      resolve({ data: { data: card("a", "CONTACTED") } })
    })
    expect(patch).toHaveBeenCalledWith("/crm/inquiries/a/stage", {
      stage: "CONTACTED",
    })
  })

  it("si la API falla, vuelve al estado anterior (rollback)", async () => {
    outcome = () => Promise.reject(new Error("boom"))
    const { client, result } = setup()

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: "a",
          stage: "CLOSED_LOST",
          index: 0,
          lostReason: "x",
        })
      ).rejects.toThrow("boom")
    })

    expect(stages(client).NEW).toEqual({ total: 2, ids: ["a", "b"] })
    expect(stages(client).CLOSED_LOST).toEqual({ total: 0, ids: [] })
    expect(patch).toHaveBeenCalledWith("/crm/inquiries/a/stage", {
      stage: "CLOSED_LOST",
      lostReason: "x",
    })
  })

  it("manda los vecinos y no manda campos vacíos", async () => {
    outcome = () => Promise.resolve({ data: { data: card("a", "NEW") } })
    const { result } = setup()
    await act(async () => {
      await result.current.mutateAsync({
        id: "a",
        stage: "NEW",
        index: 1,
        beforeId: "b",
      })
    })
    expect(patch).toHaveBeenCalledWith("/crm/inquiries/a/stage", {
      stage: "NEW",
      beforeId: "b",
    })
  })
})
