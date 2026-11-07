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

// jsdom tampoco implementa la captura de puntero, que el Drawer (vaul) usa
// al tocar sus controles. Sin esto, cualquier test que haga click dentro de
// un ResponsiveDialog en mobile termina con un error no manejado.
if (typeof Element !== "undefined") {
  Element.prototype.setPointerCapture ??= () => {}
  Element.prototype.releasePointerCapture ??= () => {}
  Element.prototype.hasPointerCapture ??= () => false
}

// jsdom tampoco tiene ResizeObserver, que el Switch de Radix usa para medir
// su pulgar. Un stub inerte alcanza: en los tests no se mide nada.
if (typeof window !== "undefined" && !window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
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

// jsdom no implementa scrollIntoView, que el Select de Radix llama al abrir
// para enfocar la opción elegida. Un stub inerte alcanza.
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView ??= () => {}
}
