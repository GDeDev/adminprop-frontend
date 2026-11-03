import { beforeEach, describe, expect, it, vi } from "vitest"

import type { HostResult } from "./api"
import { cachedHostLookup, clearHostCache, HostLookupError } from "./host-cache"

const found = (slug: string): HostResult => ({ status: "found", slug })
const missing: HostResult = { status: "missing" }
const failed: HostResult = { status: "error" }

describe("cachedHostLookup", () => {
  beforeEach(() => {
    clearHostCache()
    vi.useRealTimers()
  })

  it("consulta una sola vez por host (sin puerto, sin distinguir mayúsculas)", async () => {
    const lookup = vi.fn().mockResolvedValue(found("mi-inmo"))
    expect(await cachedHostLookup("Mi-Inmo.sites.com:3003", lookup)).toBe(
      "mi-inmo"
    )
    expect(await cachedHostLookup("mi-inmo.sites.com", lookup)).toBe("mi-inmo")
    expect(lookup).toHaveBeenCalledTimes(1)
    expect(lookup).toHaveBeenCalledWith("mi-inmo.sites.com")
  })

  it("cachea también los hosts inexistentes, por menos tiempo", async () => {
    vi.useFakeTimers()
    const lookup = vi.fn().mockResolvedValue(missing)
    await cachedHostLookup("nadie.com", lookup)
    await cachedHostLookup("nadie.com", lookup)
    expect(lookup).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(11_000)
    await cachedHostLookup("nadie.com", lookup)
    expect(lookup).toHaveBeenCalledTimes(2)
  })

  it("si la API falla NO cachea un 'no existe': lanza y reintenta en el próximo pedido", async () => {
    const lookup = vi
      .fn()
      .mockResolvedValueOnce(failed)
      .mockResolvedValueOnce(found("a"))
    await expect(
      cachedHostLookup("a.sites.com", lookup)
    ).rejects.toBeInstanceOf(HostLookupError)
    expect(await cachedHostLookup("a.sites.com", lookup)).toBe("a")
  })

  it("si la API falla y hay un valor viejo, sigue sirviéndolo (hasta 10 minutos)", async () => {
    vi.useFakeTimers()
    const lookup = vi
      .fn()
      .mockResolvedValueOnce(found("a"))
      .mockResolvedValue(failed)
    expect(await cachedHostLookup("a.sites.com", lookup)).toBe("a")

    vi.advanceTimersByTime(60_000) // venció el TTL, la API está caída
    expect(await cachedHostLookup("a.sites.com", lookup)).toBe("a")

    vi.advanceTimersByTime(11 * 60_000) // ya es demasiado viejo
    await expect(
      cachedHostLookup("a.sites.com", lookup)
    ).rejects.toBeInstanceOf(HostLookupError)
  })
})
