import { AxiosError, AxiosHeaders } from "axios"
import { describe, expect, it } from "vitest"

import { apiErrorCode, apiErrorMessage, apiFieldErrors } from "./api-error"

function apiError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError("error", String(status), config, null, {
    data,
    status,
    statusText: "",
    headers: {},
    config,
  })
}

describe("apiErrorMessage", () => {
  it("usa el mensaje de la API, que ya está pensado para el usuario", () => {
    const error = apiError(401, {
      code: "INVALID_CREDENTIALS",
      message: "Email o contraseña incorrectos",
    })

    expect(apiErrorMessage(error, "Algo falló")).toBe(
      "Email o contraseña incorrectos"
    )
    expect(apiErrorCode(error)).toBe("INVALID_CREDENTIALS")
  })

  it("sin respuesta (red caída) explica que no hay conexión", () => {
    const error = new AxiosError("Network Error", "ERR_NETWORK")

    expect(apiErrorMessage(error, "Algo falló")).toMatch(/conectar/)
  })

  it("nunca muestra errores crudos del servidor", () => {
    expect(
      apiErrorMessage(
        apiError(404, {
          message: "Cannot GET /api/v1/valuation/market-status",
        }),
        "No se pudo cargar."
      )
    ).toBe("No se pudo cargar.")
    expect(
      apiErrorMessage(
        apiError(500, { message: "Internal server error" }),
        "No se pudo cargar."
      )
    ).toBe("No se pudo cargar.")
    expect(
      apiErrorMessage(apiError(502, { message: "Algo raro" }), "Falló")
    ).toBe("Falló")
  })

  it("con cualquier otra cosa usa el mensaje por defecto", () => {
    expect(apiErrorMessage(new Error("x"), "Algo falló")).toBe("Algo falló")
    expect(apiErrorCode(new Error("x"))).toBeNull()
  })
})

describe("apiFieldErrors", () => {
  it("arma los errores por campo de un 400", () => {
    const error = apiError(400, {
      errors: [
        { field: "email", message: "El email no tiene un formato válido" },
        { field: "password", message: "Muy corta" },
        { field: "password", message: "Sin mayúscula" },
      ],
    })

    expect(apiFieldErrors(error)).toEqual({
      email: "El email no tiene un formato válido",
      password: "Muy corta",
    })
  })
})
