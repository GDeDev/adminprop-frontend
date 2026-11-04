import { describe, expect, it } from "vitest"

import { FILE_URL_TTL_MS, isFileUrlFresh } from "./private-files"

describe("isFileUrlFresh", () => {
  it("acepta una URL recién recibida", () => {
    expect(isFileUrlFresh(1_000, 1_000 + 5_000)).toBe(true)
  })

  it("rechaza una URL cerca del vencimiento o vencida", () => {
    expect(isFileUrlFresh(1_000, 1_000 + FILE_URL_TTL_MS - 30_000)).toBe(false)
    expect(isFileUrlFresh(1_000, 1_000 + FILE_URL_TTL_MS + 1)).toBe(false)
  })

  it("rechaza si no se sabe cuándo llegó", () => {
    expect(isFileUrlFresh(0)).toBe(false)
  })
})
