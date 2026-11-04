/**
 * Datos estructurados. El JSON va como texto del `<script>` (no como HTML) y
 * con `<` escapado: una descripción con `</script>` no puede cerrar la
 * etiqueta ni inyectar nada.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c")
  return <script type="application/ld+json">{json}</script>
}
