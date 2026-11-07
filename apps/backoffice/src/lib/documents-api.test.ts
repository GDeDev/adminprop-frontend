import { beforeEach, describe, expect, it, vi } from "vitest"

import { fetchDocument } from "./documents-api"

const get = vi.hoisted(() => vi.fn())
vi.mock("./api-client", () => ({ apiClient: { get } }))

const doc = (status: string, url: string | null = null) => ({
  data: { data: { status, url, error: status === "FAILED" ? "boom" : null } },
})

describe("fetchDocument", () => {
  beforeEach(() => get.mockReset())

  it("devuelve la URL cuando el documento está listo", async () => {
    get.mockResolvedValueOnce(doc("READY", "https://x/doc.pdf"))
    expect(await fetchDocument("SETTLEMENT", "s1")).toEqual({
      state: "ready",
      url: "https://x/doc.pdf",
    })
    expect(get).toHaveBeenCalledWith("/documents/SETTLEMENT/s1")
  })

  it("reintenta mientras está pendiente", async () => {
    get
      .mockResolvedValueOnce(doc("PENDING"))
      .mockResolvedValueOnce(doc("READY", "https://x/r.pdf"))
    const outcome = await fetchDocument("PAYMENT_RECEIPT", "p1", {
      pollEveryMs: 1,
    })
    expect(outcome).toEqual({ state: "ready", url: "https://x/r.pdf" })
    expect(get).toHaveBeenCalledTimes(2)
  })

  it("informa el fallo de la generación", async () => {
    get.mockResolvedValueOnce(doc("FAILED"))
    expect(await fetchDocument("OWNER_STATEMENT", "o1")).toEqual({
      state: "failed",
      error: "boom",
    })
  })

  it("se rinde al pasar el tiempo máximo", async () => {
    get.mockResolvedValue(doc("PENDING"))
    expect(
      await fetchDocument("TERMINATION_NOTICE", "c1", {
        pollEveryMs: 5,
        maxMs: 12,
      })
    ).toEqual({ state: "timeout" })
  })
})
