/**
 * Forma de los propietarios de prueba. Es local: los tipos reales de la API
 * viven en @adminprop/shared-types y este mock sólo alimenta el chequeo de
 * datos del dashboard hasta que esa pantalla use la API.
 */
export interface MockOwner {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  nationalId: string
  phone: string
  email: string | null
  address: string
  bankDetails: {
    cbu: string
    alias: string
    bankName: string
    accountHolder: string
  } | null
  notes: string | null
  portalUsername: string | null
  createdAt: string
  updatedAt: string
}
