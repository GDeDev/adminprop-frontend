import "@testing-library/jest-dom/vitest"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

afterEach(() => {
  cleanup()
})

// jsdom tampoco implementa la captura de puntero, que el Drawer (vaul) usa
// al tocar sus controles. Sin esto, cualquier test que haga click dentro de
// un ResponsiveDialog en mobile termina con un error no manejado.
if (typeof Element !== "undefined") {
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.hasPointerCapture ??= () => false
}

// jsdom no implementa matchMedia (lo usan ResponsiveDialog y useMediaQuery de
// @adminprop/ui). Ninguna media query matchea: viewport mobile.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}
