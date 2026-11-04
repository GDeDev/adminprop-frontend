"use client"

// Atrapa lo que `s/[site]/error.tsx` no puede: un error en el layout del sitio
// (por ejemplo, la API caída al pedir el sitio). Sin sitio no hay tema, así que
// se ve con los colores por defecto de `globals.css`.
export { default } from "./s/[site]/error"
