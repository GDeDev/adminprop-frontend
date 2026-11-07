import { describe, expect, it } from "vitest"

import { shouldRetryQuery } from "./query-retry"

const httpError = (status: number) => ({ response: { status } })

describe("shouldRetryQuery", () => {
  it("no reintenta un 4xx", () => {
    expect(shouldRetryQuery(0, httpError(404))).toBe(false)
    expect(shouldRetryQuery(0, httpError(403))).toBe(false)
  })

  it("reintenta una vez un 5xx o un corte de red", () => {
    expect(shouldRetryQuery(0, httpError(503))).toBe(true)
    expect(shouldRetryQuery(0, new Error("Network Error"))).toBe(true)
    expect(shouldRetryQuery(1, httpError(503))).toBe(false)
  })
})
