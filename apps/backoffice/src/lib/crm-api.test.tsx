import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { PipelineDto } from "@adminprop/shared-types"

import { makeCard, makePipeline } from "@/test-utils/crm-fixtures"

import { crmKey, usePipeline, useMoveInquiry } from "./crm-api"

const get = vi.fn()
const patch = vi.fn()

vi.mock("./api-client", () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    patch: (...args: unknown[]) => patch(...args),
  },
}))

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

const initial: PipelineDto = makePipeline({
  NEW: [makeCard("a", "NEW"), makeCard("b", "NEW")],
  CONTACTED: [makeCard("c", "CONTACTED")],
})

afterEach(() => vi.clearAllMocks())

describe("usePipeline", () => {
  it("manda sólo los filtros con valor", async () => {
    get.mockResolvedValue({ data: { data: initial } })
    const { wrapper } = setup()
    const { result } = renderHook(
      () =>
        usePipeline({
          unassigned: true,
          q: "",
          source: "PORTAL",
          assignedToId: undefined,
        }),
      { wrapper }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(get).toHaveBeenCalledWith("/crm/pipeline", {
      params: { unassigned: true, source: "PORTAL" },
    })
  })
})

describe("useMoveInquiry", () => {
  const pipelineKey = [...crmKey, "pipeline", {}]

  function columnIds(client: QueryClient, stage: string) {
    return client
      .getQueryData<PipelineDto>(pipelineKey)!
      .columns.find((column) => column.stage === stage)!
      .cards.map((card) => card.id)
  }

  it("mueve la tarjeta al instante y manda los vecinos a la API", async () => {
    let resolve!: (value: unknown) => void
    patch.mockReturnValue(new Promise((r) => (resolve = r)))
    const { client, wrapper } = setup()
    client.setQueryData(pipelineKey, initial)
    const { result } = renderHook(() => useMoveInquiry(), { wrapper })

    act(() => {
      result.current.mutate({
        id: "a",
        stage: "CONTACTED",
        index: 1,
        beforeId: "c",
      })
    })
    // Optimista: antes de que la API responda la tarjeta ya está en su lugar.
    await waitFor(() =>
      expect(columnIds(client, "CONTACTED")).toEqual(["c", "a"])
    )
    expect(columnIds(client, "NEW")).toEqual(["b"])
    expect(patch).toHaveBeenCalledWith("/crm/inquiries/a/stage", {
      stage: "CONTACTED",
      beforeId: "c",
    })
    await act(async () =>
      resolve({ data: { data: makeCard("a", "CONTACTED") } })
    )
  })

  it("si la API rechaza el cambio, la tarjeta vuelve a su columna", async () => {
    patch.mockRejectedValue(new Error("422"))
    // Tras el rechazo se recarga: la API devuelve lo mismo que había.
    get.mockResolvedValue({ data: { data: initial } })
    const { client, wrapper } = setup()
    client.setQueryData(pipelineKey, initial)
    const { result } = renderHook(() => useMoveInquiry(), { wrapper })

    await act(async () => {
      await result.current
        .mutateAsync({
          id: "a",
          stage: "CLOSED_LOST",
          index: 0,
          lostReason: "x",
        })
        .catch(() => undefined)
    })

    // El estado de la mutación llega en un render posterior al rechazo: bajo
    // carga, leerlo recién salido del act() lo encontraba todavía en false.
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData(pipelineKey)).toEqual(initial)
    expect(columnIds(client, "NEW")).toEqual(["a", "b"])
  })

  it("no manda a la API campos vacíos", async () => {
    patch.mockResolvedValue({ data: { data: makeCard("a", "NEW") } })
    const { client, wrapper } = setup()
    client.setQueryData(pipelineKey, initial)
    const { result } = renderHook(() => useMoveInquiry(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ id: "a", stage: "NEW", index: 1 })
    })
    expect(patch).toHaveBeenCalledWith("/crm/inquiries/a/stage", {
      stage: "NEW",
    })
  })
})
