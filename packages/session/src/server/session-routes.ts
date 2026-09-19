import { NextResponse, type NextRequest } from "next/server"

import type { AuthTokens, TenantBranding } from "@adminprop/shared-types"

import {
  brandingCookieName,
  encodeBranding,
  refreshCookieName,
} from "./cookies"

/**
 * Route handlers de la sesión (BFF), montados por cada app en
 * `app/api/session/route.ts` y `app/api/session/refresh/route.ts`.
 *
 * Qué hacen y qué no:
 *
 * - **Guardan el refresh token en una cookie httpOnly** del dominio de la app
 *   (spec Fase 4, 6). El JavaScript de la página nunca lo vuelve a ver después
 *   del login, y no vive en localStorage.
 * - **Refrescan** contra la API con esa cookie y devuelven sólo el access token,
 *   que el cliente guarda en memoria.
 * - **No hacen el login.** El login va del navegador directo a la API: el rate
 *   limit de la API es por IP, y si pasara por acá todos los usuarios saldrían
 *   con la IP de este servidor y compartirían los 5 intentos por minuto.
 */
export interface SessionRouteOptions {
  /** Prefijo de las cookies. Cada app el suyo: localhost comparte cookies entre puertos. */
  cookiePrefix: string
  /** URL de la API con el prefijo de versión (`NEXT_PUBLIC_API_URL`). */
  apiUrl: string | undefined
  /**
   * Guardar la marca de la inmobiliaria del usuario en otra cookie, para que el
   * layout (server) pinte su color sin esperar al cliente. El backoffice sí; el
   * portal la toma de su slug.
   */
  storeBranding?: boolean
}

/** Lo que recibe `POST /api/session` justo después de un login exitoso. */
interface StartSessionBody {
  accessToken: string
  refreshToken: string
}

/** Lo que devuelve `POST /api/session/refresh`. */
export interface RefreshedSession {
  accessToken: string
  expiresIn: number
}

const API_TIMEOUT_MS = 10_000

export function createSessionRoutes(options: SessionRouteOptions) {
  const refreshName = refreshCookieName(options.cookiePrefix)
  const brandingName = brandingCookieName(options.cookiePrefix)

  function cookieOptions(maxAgeSeconds: number) {
    return {
      httpOnly: true,
      // Lax: viaja en la navegación normal (lo necesita el proxy para saber si
      // hay sesión) pero no en un POST desde otro sitio.
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: maxAgeSeconds,
    }
  }

  function clearCookies(response: NextResponse): NextResponse {
    response.cookies.delete(refreshName)
    response.cookies.delete(brandingName)
    return response
  }

  /** `POST /api/session`: guarda el refresh token del login recién hecho. */
  async function start(request: NextRequest): Promise<NextResponse> {
    const rejected = rejectCrossSite(request)
    if (rejected) return rejected

    const body = (await request.json().catch(() => null)) as unknown
    if (!isStartSessionBody(body)) {
      return error(400, "VALIDATION_ERROR", "Faltan los tokens de la sesión")
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(
      refreshName,
      body.refreshToken,
      cookieOptions(secondsUntilExpiry(body.refreshToken))
    )

    if (options.storeBranding) {
      // Con el access token recién emitido: si fuera inválido, la API lo
      // rechaza y no se guarda nada que no sea de una sesión real.
      const branding = await callApi<TenantBranding>(
        options.apiUrl,
        "/tenants/current",
        { method: "GET", accessToken: body.accessToken }
      )
      if (branding.ok) {
        response.cookies.set(
          brandingName,
          encodeBranding(branding.data),
          cookieOptions(secondsUntilExpiry(body.refreshToken))
        )
      }
    }

    return response
  }

  /** `POST /api/session/refresh`: rota el refresh token y devuelve un access token. */
  async function refresh(request: NextRequest): Promise<NextResponse> {
    const rejected = rejectCrossSite(request)
    if (rejected) return rejected

    const refreshToken = request.cookies.get(refreshName)?.value
    if (!refreshToken) return error(401, "NO_SESSION", "No hay sesión")

    const result = await callApi<AuthTokens>(options.apiUrl, "/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    })

    if (!result.ok) {
      // Cualquier rechazo de la API (vencido, revocado, reusado, usuario
      // desactivado) termina la sesión: la cookie ya no sirve. Un error de
      // red o de la API caída no: la sesión puede seguir siendo válida.
      const response = NextResponse.json(result.body, { status: result.status })
      return result.status === 401 || result.status === 403
        ? clearCookies(response)
        : response
    }

    const session: RefreshedSession = {
      accessToken: result.data.accessToken,
      expiresIn: result.data.expiresIn,
    }
    const response = NextResponse.json(session)
    // El refresh token rota en cada uso: guardar SIEMPRE el nuevo. Con el
    // viejo, el próximo refresh sería un reuso y la API cerraría la sesión.
    response.cookies.set(
      refreshName,
      result.data.refreshToken,
      cookieOptions(secondsUntilExpiry(result.data.refreshToken))
    )
    // La marca vive lo mismo que la sesión.
    const branding = request.cookies.get(brandingName)?.value
    if (branding) {
      response.cookies.set(
        brandingName,
        branding,
        cookieOptions(secondsUntilExpiry(result.data.refreshToken))
      )
    }
    return response
  }

  /** `DELETE /api/session`: revoca el refresh token en la API y borra las cookies. */
  async function end(request: NextRequest): Promise<NextResponse> {
    const rejected = rejectCrossSite(request)
    if (rejected) return rejected

    const refreshToken = request.cookies.get(refreshName)?.value
    if (refreshToken) {
      // Si la API no responde, igual se cierra la sesión acá: el usuario pidió
      // salir, y el refresh token vence solo.
      await callApi(options.apiUrl, "/auth/logout", {
        method: "POST",
        body: { refreshToken },
      })
    }

    return clearCookies(new NextResponse(null, { status: 204 }))
  }

  return { start, refresh, end }
}

/**
 * Las mutaciones de sesión sólo se aceptan desde la propia app. Un sitio ajeno
 * podría, con un formulario, guardar su propia sesión en el navegador de la
 * víctima (login CSRF). Los navegadores mandan `Origin` en todo POST y DELETE.
 */
function rejectCrossSite(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin")
  if (origin && origin === request.nextUrl.origin) return null
  return error(403, "FORBIDDEN_ORIGIN", "Origen no permitido")
}

function isStartSessionBody(body: unknown): body is StartSessionBody {
  if (typeof body !== "object" || body === null) return false
  const { accessToken, refreshToken } = body as Record<string, unknown>
  return (
    typeof accessToken === "string" &&
    accessToken.length > 0 &&
    typeof refreshToken === "string" &&
    refreshToken.length > 0
  )
}

function error(status: number, code: string, message: string) {
  return NextResponse.json(
    { success: false, statusCode: status, code, message },
    { status }
  )
}

/**
 * Segundos hasta el `exp` del JWT, para que la cookie dure lo mismo que el
 * token. No se verifica la firma: eso lo hace la API; acá sólo se lee la fecha.
 */
export function secondsUntilExpiry(jwt: string, now = Date.now()): number {
  const DEFAULT_SECONDS = 7 * 24 * 60 * 60
  try {
    const payload = JSON.parse(
      Buffer.from(jwt.split(".")[1] ?? "", "base64url").toString("utf8")
    ) as { exp?: unknown }
    if (typeof payload.exp !== "number") return DEFAULT_SECONDS
    return Math.max(0, Math.floor(payload.exp - now / 1000))
  } catch {
    return DEFAULT_SECONDS
  }
}

type ApiResult<T> =
  { ok: true; data: T } | { ok: false; status: number; body: unknown }

/** Llamada server-to-server a la API. Desenvuelve el sobre `{ success, data }`. */
async function callApi<T>(
  apiUrl: string | undefined,
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; accessToken?: string }
): Promise<ApiResult<T>> {
  if (!apiUrl) {
    return {
      ok: false,
      status: 500,
      body: { code: "API_URL_MISSING", message: "Falta NEXT_PUBLIC_API_URL" },
    }
  }

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: init.method,
      headers: {
        "Content-Type": "application/json",
        ...(init.accessToken
          ? { Authorization: `Bearer ${init.accessToken}` }
          : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    })

    const json = (await response.json().catch(() => null)) as {
      data?: T
    } | null

    if (!response.ok) return { ok: false, status: response.status, body: json }
    return { ok: true, data: json?.data as T }
  } catch {
    return {
      ok: false,
      status: 502,
      body: {
        code: "API_UNREACHABLE",
        message: "No se pudo contactar a la API",
      },
    }
  }
}
