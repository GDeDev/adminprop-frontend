import { beforeEach, describe, expect, it, vi } from "vitest"

import type { HostResult } from "./api"
import {
  cachedHostLookup,
  clearHostCache,
  HostLookupError,
  HostLookupLimitedError,
} from "./host-cache"

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

  it("una ráfaga de hosts inexistentes no desaloja a los sitios reales", async () => {
    const lookup = vi.fn(async (host: string): Promise<HostResult> =>
      host === "real.sites.com" ? found("real") : missing
    )
    await cachedHostLookup("real.sites.com", lookup)
    for (let i = 0; i < 6_000; i++) {
      await cachedHostLookup(`bot-${i}.com`, lookup)
    }
    lookup.mockClear()
    expect(await cachedHostLookup("real.sites.com", lookup)).toBe("real")
    expect(lookup).not.toHaveBeenCalled()
    // Los inexistentes más viejos sí salieron (LRU), no se vació todo.
    await cachedHostLookup("bot-0.com", lookup)
    await cachedHostLookup("bot-5999.com", lookup)
    expect(lookup.mock.calls.map(([h]) => h)).toEqual(["bot-0.com"])
  })

  it("sin cupo no llama a la API: sirve el valor viejo o lanza HostLookupLimitedError", async () => {
    vi.useFakeTimers()
    const lookup = vi.fn().mockResolvedValue(found("a"))
    await cachedHostLookup("a.sites.com", lookup)
    vi.advanceTimersByTime(60_000)
    expect(await cachedHostLookup("a.sites.com", lookup, () => false)).toBe("a")
    await expect(
      cachedHostLookup("b.sites.com", lookup, () => false)
    ).rejects.toBeInstanceOf(HostLookupLimitedError)
    expect(lookup).toHaveBeenCalledTimes(1)
  })
})
