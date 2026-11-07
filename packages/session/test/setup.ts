import "@testing-library/jest-dom/vitest"

import { cleanup, configure } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => {
  cleanup()
})

// `waitFor` y `findBy*` esperan 1 s por defecto. Con toda la suite en
// paralelo (seis paquetes, ver vitest.shared.ts) un debounce de búsqueda o un
// render pesado lo superan y el test cae al azar. 5 s no cambia lo que se
// asserta: un test que falla sigue fallando, sólo tarda más en avisar.
configure({ asyncUtilTimeout: 5000 })
