import { describe, expect, it } from "vitest"

import { baseDomain, isPlausibleSiteHost, normalizeHost } from "./host-policy"

const BASE = "sitios.test"

describe("normalizeHost", () => {
  it("minúsculas, sin puerto ni punto final", () => {
    expect(normalizeHost(" Mi-Inmo.Sitios.TEST.:443 ")).toBe(
      "mi-inmo.sitios.test"
    )
    expect(normalizeHost("Mi-Inmo.Sitios.TEST:443")).toBe("mi-inmo.sitios.test")
    expect(normalizeHost("a.com.")).toBe("a.com")
  })
})

describe("baseDomain", () => {
  it("sale de SITES_BASE_DOMAIN, normalizado, o null", () => {
    expect(baseDomain({ SITES_BASE_DOMAIN: " Sitios.Test " })).toBe(
      "sitios.test"
    )
    expect(baseDomain({})).toBeNull()
    expect(baseDomain({ SITES_BASE_DOMAIN: "" })).toBeNull()
  })
})

describe("isPlausibleSiteHost", () => {
  it("acepta un subdominio válido de un solo nivel bajo el dominio base", () => {
    expect(isPlausibleSiteHost("mi-inmo.sitios.test", BASE)).toBe(true)
    expect(isPlausibleSiteHost("MI-INMO.sitios.test:3003", BASE)).toBe(true)
  })

  it.each([
    "sitios.test", // el apex
    "a.b.sitios.test", // dos niveles
    "ab.sitios.test", // muy corto
    "-malo.sitios.test",
    "malo-.sitios.test",
    "con_guion.sitios.test",
    "con espacio.sitios.test",
    ".sitios.test",
  ])("descarta %j (bajo el dominio base pero imposible)", (host) => {
    expect(isPlausibleSiteHost(host, BASE)).toBe(false)
  })

  it("acepta un dominio propio con forma de dominio", () => {
    expect(isPlausibleSiteHost("www.mi-inmo.com.ar", BASE)).toBe(true)
    expect(isPlausibleSiteHost("mi-inmo.com", BASE)).toBe(true)
  })

  it.each([
    "",
    "localhost",
    "foo.localhost",
    "192.168.0.1",
    "10.0.0.1:8080",
    "[::1]",
    "sin-punto",
    "a..com",
    "a_b.com",
    "https://a.com",
    "a.com/ruta",
    "x".repeat(64) + ".com",
    "a.123", // TLD numérico
  ])("descarta %j (no puede ser un sitio)", (host) => {
    expect(isPlausibleSiteHost(host, BASE)).toBe(false)
  })

  it("sin dominio base solo valen los dominios propios", () => {
    expect(isPlausibleSiteHost("www.mi-inmo.com.ar", null)).toBe(true)
    expect(isPlausibleSiteHost("localhost:3003", null)).toBe(false)
  })
})
