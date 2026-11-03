import { describe, expect, it } from "vitest"

import {
  MAX_PHOTO_BYTES,
  OVERSIZED_PHOTO_MESSAGE,
  splitOversizedPhotos,
} from "./photos"

function file(size: number) {
  const f = new File(["x"], "a.jpg", { type: "image/jpeg" })
  Object.defineProperty(f, "size", { value: size })
  return f
}

describe("splitOversizedPhotos", () => {
  it("deja pasar hasta 10 MB y separa lo que lo supera", () => {
    const ok = file(MAX_PHOTO_BYTES)
    const big = file(MAX_PHOTO_BYTES + 1)
    expect(splitOversizedPhotos([ok, big])).toEqual({
      accepted: [ok],
      oversized: [big],
    })
  })

  it("el mensaje respeta singular y plural", () => {
    expect(OVERSIZED_PHOTO_MESSAGE(1)).toMatch(/^Una foto/)
    expect(OVERSIZED_PHOTO_MESSAGE(3)).toMatch(/^3 fotos/)
  })
})
