import { describe, expect, it } from "vitest"

import { friendlyRemoteError, GENERIC_REMOTE_ERROR } from "./listings"

describe("friendlyRemoteError", () => {
  it("deja pasar un mensaje corto pensado para personas", () => {
    expect(friendlyRemoteError(" El token venció. ")).toBe("El token venció.")
  })

  it("oculta texto técnico, vacío o demasiado largo", () => {
    for (const raw of [
      "",
      "Request failed with status code 401",
      "TypeError: x is undefined\n    at fn (file.js:1:2)",
      '{"error":"invalid_grant"}',
      "Error: ECONNRESET",
      "Respuesta 503 del portal",
      "a".repeat(201),
    ]) {
      expect(friendlyRemoteError(raw)).toBe(GENERIC_REMOTE_ERROR)
    }
  })
})
