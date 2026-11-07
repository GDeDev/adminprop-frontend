import { beforeEach, describe, expect, it } from "vitest"

import {
  BROWSE_LIMIT_MAX,
  clearRateLimit,
  isVisitorBuiltRead,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  takeBrowseToken,
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

  it("el balde de navegación es aparte y más holgado", () => {
    const now = 1_000_000
    for (let i = 0; i < RATE_LIMIT_MAX; i++) takeToken("203.0.113.9", now)
    expect(takeToken("203.0.113.9", now)).toBe(false)
    for (let i = 0; i < BROWSE_LIMIT_MAX; i++) {
      expect(takeBrowseToken("203.0.113.9", now)).toBe(true)
    }
    expect(takeBrowseToken("203.0.113.9", now)).toBe(false)
  })

  it("solo cuentan las lecturas que arma el visitante", () => {
    expect(isVisitorBuiltRead("/propiedades/abc", false)).toBe(true)
    expect(isVisitorBuiltRead("/api/favoritos", true)).toBe(true)
    expect(isVisitorBuiltRead("/propiedades", true)).toBe(true)
    expect(isVisitorBuiltRead("/propiedades", false)).toBe(false)
    expect(isVisitorBuiltRead("", false)).toBe(false)
    expect(isVisitorBuiltRead("/contacto", false)).toBe(false)
  })
})
