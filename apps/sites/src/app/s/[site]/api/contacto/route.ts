import { NextResponse, type NextRequest } from "next/server"

import { apiUrl } from "@/lib/api"
import { clientIp } from "@/lib/client-ip"
import { isSameOrigin } from "@/lib/origin"
import { requestHost } from "@/lib/request-host"
import { decodeSiteRoute } from "@/lib/site-route"

const MAX_BODY = 8_000

const fail = (status: number, message: string) =>
  NextResponse.json({ message }, { status })

/**
 * Recibe la consulta del formulario del sitio y la reenvía a la API
 * (`POST /public/:slug/contact`). Corre del lado del servidor: el navegador no
 * llama a la API desde el dominio de la inmobiliaria, así que no hay CORS que
 * habilitar para cada dominio propio.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ site: string }> }
) {
  const route = decodeSiteRoute((await params).site)
  if (!route) return fail(404, "No encontramos este sitio.")
  // La vista previa no envía nada.
  if (route.previewToken) {
    return fail(
      403,
      "Estás en la vista previa: el formulario no envía consultas."
    )
  }

  // Solo se acepta desde el propio sitio (frena el envío desde otras páginas).
  const origin = request.headers.get("origin")
  const host = requestHost(request.headers)
  if (!isSameOrigin(origin, host)) {
    return fail(403, "Pedido no permitido.")
  }

  const base = apiUrl()
  if (!base) return fail(503, "El envío no está disponible por ahora.")

  const raw = await request.text()
  if (raw.length > MAX_BODY) return fail(413, "La consulta es demasiado larga.")
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return fail(400, "No pudimos leer tu consulta.")
  }

  const text = (value: unknown, max: number) =>
    typeof value === "string" ? value.trim().slice(0, max) : ""
  const propertyId =
    typeof body.propertyId === "string" ? body.propertyId : null

  const ip = clientIp(request.headers)
  try {
    const response = await fetch(
      `${base}/public/${encodeURIComponent(route.slug)}/contact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(ip ? { "X-Forwarded-For": ip } : {}),
        },
        body: JSON.stringify({
          name: text(body.name, 120),
          email: text(body.email, 200),
          phone: text(body.phone, 40),
          message: text(body.message, 2000),
          propertyId,
          website: text(body.website, 200),
        }),
        cache: "no-store",
      }
    )
    if (response.ok) return NextResponse.json({ ok: true }, { status: 201 })
    if (response.status === 429) {
      return fail(
        429,
        "Enviaste varias consultas en poco tiempo. Probá de nuevo en un rato o escribinos por WhatsApp."
      )
    }
    if (response.status === 409) {
      return fail(409, "Esa propiedad ya no está disponible.")
    }
    if (response.status === 400) {
      return fail(400, "Revisá los datos: algún campo no es válido.")
    }
    return fail(
      502,
      "No pudimos enviar tu consulta. Probá de nuevo en un momento."
    )
  } catch {
    return fail(
      502,
      "No pudimos enviar tu consulta. Probá de nuevo en un momento."
    )
  }
}
