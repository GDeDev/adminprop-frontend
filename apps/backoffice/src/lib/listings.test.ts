import { describe, expect, it } from "vitest"

import { friendlyRemoteError } from "./listings"

describe("friendlyRemoteError", () => {
  it("deja pasar un mensaje pensado para personas", () => {
    expect(
      friendlyRemoteError("La cuenta no tiene permiso para publicar.")
    ).toBe("La cuenta no tiene permiso para publicar.")
  })

  it("oculta texto técnico, JSON y códigos HTTP", () => {
    for (const raw of [
      "Request failed with status code 401",
      '{"error":"invalid_grant"}',
      "PrismaClientKnownRequestError: P2002",
      "TypeError: x is not a function at foo (bar.ts:1)",
      "connect ECONNREFUSED 127.0.0.1:443",
      "",
      "x".repeat(300),
    ]) {
      expect(friendlyRemoteError(raw)).toMatch(/^El portal rechazó/)
    }
  })
})
