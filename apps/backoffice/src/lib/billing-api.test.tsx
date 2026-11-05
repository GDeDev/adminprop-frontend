import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useRegisterPayment } from "./billing-api"

const post = vi.hoisted(() => vi.fn())
vi.mock("./api-client", () => ({ apiClient: { post } }))

function wrapper({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

const variables = {
  installmentId: "i1",
  paidAt: "2026-11-05",
  paidCurrency: "ARS" as const,
  amount: "1000.00",
  method: "TRANSFER" as const,
  receivedBy: "AGENCY" as const,
}

describe("useRegisterPayment", () => {
  beforeEach(() => {
    post.mockReset()
    post.mockResolvedValue({ data: { data: {} } })
  })

  it("manda la Idempotency-Key como header y no como campo del formulario", async () => {
    const { result } = renderHook(() => useRegisterPayment(), { wrapper })
    result.current.mutate({ ...variables, idempotencyKey: "key-123" })
    await waitFor(() => expect(post).toHaveBeenCalled())

    const [url, body, config] = post.mock.calls[0]!
    expect(url).toBe("/billing/installments/i1/payments")
    expect(config).toEqual({ headers: { "Idempotency-Key": "key-123" } })
    expect((body as FormData).has("idempotencyKey")).toBe(false)
    expect((body as FormData).get("amount")).toBe("1000.00")
  })

  it("sin clave no agrega ningún header", async () => {
    const { result } = renderHook(() => useRegisterPayment(), { wrapper })
    result.current.mutate(variables)
    await waitFor(() => expect(post).toHaveBeenCalled())
    expect(post.mock.calls[0]![2]).toBeUndefined()
  })
})
