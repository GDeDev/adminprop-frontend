import type { SiteTemplateKey } from "@adminprop/shared-types"

import { classicKit } from "./classic"
import { luxuryKit } from "./luxury"
import { modernKit } from "./modern"
import type { TemplateKit } from "./types"

/** El único mapa `template → componentes`: lo demás se resuelve por acá. */
const KITS: Record<SiteTemplateKey, TemplateKit> = {
  CLASSIC: classicKit,
  MODERN: modernKit,
  LUXURY: luxuryKit,
}

export function templateKit(key: string): TemplateKit {
  // Mayúsculas por si el backend manda la clave en minúscula ("luxury").
  return KITS[key.toUpperCase() as SiteTemplateKey] ?? classicKit
}
