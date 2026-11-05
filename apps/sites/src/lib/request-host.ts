/**
 * Host con el que el visitante pidió la página.
 *
 * `X-Forwarded-Host` lo puede mandar cualquiera si el servidor está expuesto sin
 * un proxy que lo pise; por eso solo se confía en él si el despliegue lo declara
 * (`SITES_TRUST_FORWARDED_HOST=true`, cuando hay un proxy propio que lo fija).
 * Por defecto vale `Host`. Si hay varios valores, el primero.
 */
export function requestHost(headers: Pick<Headers, "get">): string {
  const trusted = process.env.SITES_TRUST_FORWARDED_HOST === "true"
  const raw =
    (trusted ? headers.get("x-forwarded-host") : null) ??
    headers.get("host") ??
    ""
  return raw.split(",")[0]?.trim() ?? ""
}
