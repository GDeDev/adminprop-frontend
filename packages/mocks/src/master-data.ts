import type {
  Amenity,
  Location,
  OperationType,
  PropertyType,
  ServiceType,
} from "@adminprop/shared-types"

import {
  AMENITY_IDS,
  LOCATION_IDS as L,
  PROPERTY_TYPE_IDS,
  SERVICE_TYPE_IDS,
} from "./ids"

/** Fechas fijas: los mocks no las usan, pero el contrato las trae. */
const STAMP = {
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

/** Los maestros planos sin ícono (sólo las amenities lo tienen). */
const CATALOG = { ...STAMP, icon: null }

export const locations: Location[] = [
  {
    ...STAMP,
    id: L.argentina,
    level: "COUNTRY",
    name: "Argentina",
    parentId: null,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.buenosAiresProvince,
    level: "PROVINCE",
    name: "Buenos Aires",
    parentId: L.argentina,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.caba,
    level: "PROVINCE",
    name: "Ciudad Autónoma de Buenos Aires",
    parentId: L.argentina,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.cabaCity,
    level: "CITY",
    name: "CABA",
    parentId: L.caba,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.laPlata,
    level: "CITY",
    name: "La Plata",
    parentId: L.buenosAiresProvince,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.quilmes,
    level: "CITY",
    name: "Quilmes",
    parentId: L.buenosAiresProvince,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.palermo,
    level: "NEIGHBORHOOD",
    name: "Palermo",
    parentId: L.cabaCity,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.belgrano,
    level: "NEIGHBORHOOD",
    name: "Belgrano",
    parentId: L.cabaCity,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.caballito,
    level: "NEIGHBORHOOD",
    name: "Caballito",
    parentId: L.cabaCity,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.laPlataCentro,
    level: "NEIGHBORHOOD",
    name: "Centro",
    parentId: L.laPlata,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.cityBell,
    level: "NEIGHBORHOOD",
    name: "City Bell",
    parentId: L.laPlata,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.tolosa,
    level: "NEIGHBORHOOD",
    name: "Tolosa",
    parentId: L.laPlata,
    isActive: true,
  },
  {
    ...STAMP,
    id: L.bernal,
    level: "NEIGHBORHOOD",
    name: "Bernal",
    parentId: L.quilmes,
    isActive: true,
  },
]

export const propertyTypes: PropertyType[] = [
  { ...CATALOG, id: PROPERTY_TYPE_IDS.house, name: "Casa", isActive: true },
  {
    ...CATALOG,
    id: PROPERTY_TYPE_IDS.apartment,
    name: "Departamento",
    isActive: true,
  },
  { ...CATALOG, id: PROPERTY_TYPE_IDS.ph, name: "PH", isActive: true },
  { ...CATALOG, id: PROPERTY_TYPE_IDS.retail, name: "Local", isActive: true },
  { ...CATALOG, id: PROPERTY_TYPE_IDS.office, name: "Oficina", isActive: true },
  { ...CATALOG, id: PROPERTY_TYPE_IDS.land, name: "Terreno", isActive: true },
]

export const amenities: Amenity[] = [
  {
    ...CATALOG,
    id: AMENITY_IDS.pool,
    name: "Pileta",
    icon: "waves",
    isActive: true,
  },
  {
    ...CATALOG,
    id: AMENITY_IDS.garage,
    name: "Cochera",
    icon: "car",
    isActive: true,
  },
  {
    ...CATALOG,
    id: AMENITY_IDS.grill,
    name: "Parrilla",
    icon: "flame",
    isActive: true,
  },
  {
    ...CATALOG,
    id: AMENITY_IDS.balcony,
    name: "Balcón",
    icon: "fence",
    isActive: true,
  },
  {
    ...CATALOG,
    id: AMENITY_IDS.terrace,
    name: "Terraza",
    icon: "sun",
    isActive: true,
  },
  {
    ...CATALOG,
    id: AMENITY_IDS.elevator,
    name: "Ascensor",
    icon: "arrow-up-down",
    isActive: true,
  },
]

export const operationTypes: OperationType[] = [
  {
    ...CATALOG,
    id: "00000000-0000-4000-8000-000000002101",
    name: "Alquiler",
    isActive: true,
  },
  {
    ...CATALOG,
    id: "00000000-0000-4000-8000-000000002102",
    name: "Venta",
    isActive: true,
  },
  {
    ...CATALOG,
    id: "00000000-0000-4000-8000-000000002103",
    name: "Temporario",
    isActive: true,
  },
]

export const serviceTypes: ServiceType[] = [
  { ...CATALOG, id: SERVICE_TYPE_IDS.rent, name: "Alquiler", isActive: true },
  {
    ...CATALOG,
    id: SERVICE_TYPE_IDS.hoaFees,
    name: "Expensas",
    isActive: true,
  },
  { ...CATALOG, id: SERVICE_TYPE_IDS.electricity, name: "Luz", isActive: true },
  { ...CATALOG, id: SERVICE_TYPE_IDS.gas, name: "Gas", isActive: true },
  { ...CATALOG, id: SERVICE_TYPE_IDS.water, name: "Agua", isActive: true },
  {
    ...CATALOG,
    id: SERVICE_TYPE_IDS.municipalTax,
    name: "Municipal",
    isActive: true,
  },
  {
    ...CATALOG,
    id: SERVICE_TYPE_IDS.insurance,
    name: "Seguro",
    isActive: true,
  },
]
