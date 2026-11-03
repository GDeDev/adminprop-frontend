import { beforeEach, describe, expect, it, vi } from "vitest"

import { cachedHostLookup, clearHostCache } from "./host-cache"

describe("cachedHostLookup", () => {
  beforeEach(() => {
    clearHostCache()
    vi.useRealTimers()
  })

  it("consulta una sola vez por host (sin puerto, sin distinguir mayúsculas)", async () => {
    const lookup = vi.fn().mockResolvedValue("mi-inmo")
    expect(await cachedHostLookup("Mi-Inmo.sites.com:3003", lookup)).toBe(
      "mi-inmo"
    )
    expect(await cachedHostLookup("mi-inmo.sites.com", lookup)).toBe("mi-inmo")
    expect(lookup).toHaveBeenCalledTimes(1)
    expect(lookup).toHaveBeenCalledWith("mi-inmo.sites.com")
  })

  it("cachea también los hosts desconocidos, por menos tiempo", async () => {
    vi.useFakeTimers()
    const lookup = vi.fn().mockResolvedValue(null)
    await cachedHostLookup("nadie.com", lookup)
    await cachedHostLookup("nadie.com", lookup)
    expect(lookup).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(11_000)
    await cachedHostLookup("nadie.com", lookup)
    expect(lookup).toHaveBeenCalledTimes(2)
  })
})
