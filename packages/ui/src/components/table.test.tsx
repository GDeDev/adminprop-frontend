import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Table, TableBody, TableCell, TableRow } from "./table"

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
