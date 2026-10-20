/**
 * Forma de los inquilinos y garantes de prueba. Es local: los tipos reales
 * de la API viven en @adminprop/shared-types y este mock sólo alimenta el
 * chequeo de datos del dashboard hasta que esa pantalla use la API.
 */
interface MockPerson {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  nationalId: string
  phone: string
  email: string | null
  address: string
  createdAt: string
  updatedAt: string
}

export interface MockRenter extends MockPerson {
  startDate: string
  guarantorId: string | null
  portalUsername: string | null
}

export interface MockGuarantor extends MockPerson {
  guaranteeType: "property" | "payslips"
  guaranteeDetails: string
}
