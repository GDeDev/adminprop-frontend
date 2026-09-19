import "server-only"

import { cookies } from "next/headers"

import {
  brandingCookieName,
  decodeBranding,
  type StoredBranding,
} from "@adminprop/session/server"

import { SESSION_COOKIE_PREFIX } from "./session"

/** Lo que cada inmobiliaria personaliza (slots de marca). */
export type TenantBranding = StoredBranding

/**
 * Marca de la inmobiliaria del usuario logueado, para el `<html>` y el
 * sidebar. Sale de la cookie que se guarda al iniciar sesión (con
 * `GET /tenants/current`), así el color está desde el primer render. Sin
 * sesión devuelve null y se usa el tema por defecto.
 */
export async function getTenantBranding(): Promise<TenantBranding | null> {
  const store = await cookies()
  return decodeBranding(
    store.get(brandingCookieName(SESSION_COOKIE_PREFIX))?.value
  )
}
