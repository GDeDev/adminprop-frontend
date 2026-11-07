import "@testing-library/jest-dom/vitest"

import { cleanup, configure } from "@testing-library/react"
import { afterEach, vi } from "vitest"

afterEach(() => {
  cleanup()
})

// `waitFor` y `findBy*` esperan 1 s por defecto. Con toda la suite en
// paralelo (seis paquetes, ver vitest.shared.ts) un debounce de búsqueda o un
// render pesado lo superan y el test cae al azar. 5 s no cambia lo que se
// asserta: un test que falla sigue fallando, sólo tarda más en avisar.
configure({ asyncUtilTimeout: 5000 })

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
