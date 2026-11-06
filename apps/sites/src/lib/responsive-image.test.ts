import { describe, expect, it } from "vitest"

import { cloudinarySrcSet, SRCSET_WIDTHS } from "./responsive-image"

describe("cloudinarySrcSet", () => {
  it("arma un ancho por candidato sobre la URL original de Cloudinary", () => {
    const set = cloudinarySrcSet(
      "https://res.cloudinary.com/demo/image/upload/v1712/props/abc.jpg"
    )
    const parts = set?.split(", ") ?? []
    expect(parts).toHaveLength(SRCSET_WIDTHS.length)
    expect(parts[0]).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_320,c_limit,f_auto,q_auto/v1712/props/abc.jpg 320w"
    )
  })

  it("no toca URLs con transformaciones, con query o de otro host", () => {
    for (const url of [
      "https://res.cloudinary.com/demo/image/upload/c_fill,w_200/v1/a.jpg",
      "https://res.cloudinary.com/demo/image/upload/v1/a.jpg?firma=1",
      "http://localhost:3000/uploads/a.jpg",
      "https://cdn.otro.com/image/upload/v1/a.jpg",
    ]) {
      expect(cloudinarySrcSet(url)).toBeUndefined()
    }
  })
})
