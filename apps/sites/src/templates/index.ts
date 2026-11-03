import type { SiteTemplateKey } from "@adminprop/shared-types"

import { classicKit } from "./classic"
import { modernKit } from "./modern"
import type { TemplateKit } from "./types"

/** El único mapa `template → componentes`: lo demás se resuelve por acá. */
const KITS: Record<SiteTemplateKey, TemplateKit> = {
  CLASSIC: classicKit,
  MODERN: modernKit,
}

export function templateKit(key: string): TemplateKit {
  return KITS[key as SiteTemplateKey] ?? classicKit
}
