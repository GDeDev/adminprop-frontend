/**
 * Formato de montos para mostrar. Única implementación del monorepo (antes
 * había una copia en el backoffice y otra en el portal).
 *
 * Sólo formatea: el monto llega de la API como string decimal y no se suma,
 * resta ni redondea acá (DT-11). `Number()` se usa únicamente para que `Intl`
 * ponga los separadores (DT-51).
 */

/**
 * "480000.00" + "ARS" → "$ 480.000,00"; "700.5" + "USD" → "US$ 700,50".
 * Si el texto no parece un número (vacío, "n/d"), se devuelve tal cual para no
 * mostrar "NaN" en pantalla.
 */
export function formatMoney(amount: string, currency: string): string {
  const value = Number(amount)
  if (amount.trim() === "" || Number.isNaN(value)) return amount
  return (
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
      minimumFractionDigits: 2,
    })
      .format(value)
      // Intl separa símbolo y número con un espacio duro; uno común se lee
      // igual y los textos se buscan sin sorpresas.
      .replace(/\s/g, " ")
  )
}
