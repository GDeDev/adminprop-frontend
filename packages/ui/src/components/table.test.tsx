import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"

describe("TableRow", () => {
  it("marca la fila cuando el link que la cubre recibe foco de teclado", () => {
    // Los listados quitan el outline del link (cubre toda la fila con
    // after:absolute); sin esto el foco por teclado no se veía en ningún lado.
    const { container } = render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>
              <a href="/x">Fila</a>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    const row = container.querySelector("tr")!
    expect(row.className).toContain("has-[a:focus-visible]:outline-2")
    expect(row.className).toContain("has-[a:focus-visible]:bg-muted")
  })
})

describe("Table accesibilidad", () => {
  it("el contenedor es una región enfocable con nombre y los th llevan scope=col", () => {
    const { container } = render(
      <Table label="Cuenta corriente">
        <TableHeader>
          <TableRow>
            <TableHead>Debe</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    )
    const region = container.querySelector("[data-slot=table-container]")!
    expect(region.getAttribute("role")).toBe("region")
    expect(region.getAttribute("tabindex")).toBe("0")
    expect(region.getAttribute("aria-label")).toBe("Cuenta corriente")
    expect(container.querySelector("th")!.getAttribute("scope")).toBe("col")
  })
})
