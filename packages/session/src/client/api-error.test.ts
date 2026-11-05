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

  it("muestra el motivo de un logo rechazado (TENANT_INVALID_LOGO)", () => {
    const error = apiError(422, {
      code: "TENANT_INVALID_LOGO",
      message: "El SVG no puede contener scripts ni referencias externas.",
    })

    expect(apiErrorMessage(error, "No se pudo subir el logo.")).toBe(
      "El SVG no puede contener scripts ni referencias externas."
    )
    expect(apiErrorCode(error)).toBe("TENANT_INVALID_LOGO")
  })

  it("traduce los códigos de únicos y CHECK, que traen texto técnico", () => {
    const unique = apiError(409, {
      code: "UNIQUE_CONSTRAINT_VIOLATION",
      message:
        "Ya existe un registro con ese valor en: contractId, effectiveFrom",
    })
    expect(apiErrorMessage(unique, "Algo falló")).toMatch(
      /Ya existe un registro igual.*misma fecha/
    )
    expect(apiErrorMessage(unique, "Algo falló")).not.toMatch(/contractId/)

    const check = apiError(422, {
      code: "CHECK_CONSTRAINT_VIOLATION",
      message: 'new row violates check constraint "rent_amount_positive"',
    })
    expect(apiErrorMessage(check, "Algo falló")).toBe(
      "Algún dato no cumple las reglas del sistema (un monto, porcentaje o fecha fuera de rango). Revisalo y volvé a intentar."
    )
    expect(apiErrorMessage(check, "Algo falló")).not.toMatch(/rent_amount/)

    const db = apiError(500, {
      code: "DATABASE_ERROR",
      message: "P1001: can't reach database",
    })
    expect(apiErrorMessage(db, "Algo falló")).toMatch(/problema del sistema/)
    expect(apiErrorMessage(db, "Algo falló")).not.toMatch(/P1001/)

    expect(
      apiErrorMessage(
        apiError(409, { code: "IDEMPOTENCY_KEY_REUSED", message: "x" }),
        "Algo falló"
      )
    ).toMatch(/otros datos/)
    expect(
      apiErrorMessage(
        apiError(403, {
          code: "CONTRACT_MANUAL_RENT_ADJUSTMENT_ADMIN_ONLY",
          message: "x",
        }),
        "Algo falló"
      )
    ).toMatch(/administrador/)
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
