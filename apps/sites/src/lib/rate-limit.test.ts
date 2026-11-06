import { beforeEach, describe, expect, it } from "vitest"

import {
  clearRateLimit,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  takeToken,
} from "./rate-limit"

describe("takeToken", () => {
  beforeEach(() => clearRateLimit())

  it("corta al pasar el tope por IP y se renueva con la ventana", () => {
    const now = 1_000_000
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(takeToken("203.0.113.9", now)).toBe(true)
    }
    expect(takeToken("203.0.113.9", now)).toBe(false)
    // Otra IP no se entera.
    expect(takeToken("198.51.100.7", now)).toBe(true)
    expect(takeToken("203.0.113.9", now + RATE_LIMIT_WINDOW_MS)).toBe(true)
  })

  it("sin IP confiable no limita", () => {
    for (let i = 0; i < RATE_LIMIT_MAX + 5; i++) {
      expect(takeToken(null)).toBe(true)
    }
  })
})
