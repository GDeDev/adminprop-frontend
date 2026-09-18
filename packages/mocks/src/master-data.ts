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

export const locations: Location[] = [
  {
    id: L.argentina,
    level: "country",
    name: "Argentina",
    parentId: null,
    isActive: true,
  },
  {
    id: L.buenosAiresProvince,
    level: "province",
    name: "Buenos Aires",
    parentId: L.argentina,
    isActive: true,
  },
  {
    id: L.caba,
    level: "province",
    name: "Ciudad Autónoma de Buenos Aires",
    parentId: L.argentina,
    isActive: true,
  },
  {
    id: L.cabaCity,
    level: "city",
    name: "CABA",
    parentId: L.caba,
    isActive: true,
  },
  {
    id: L.laPlata,
    level: "city",
    name: "La Plata",
    parentId: L.buenosAiresProvince,
    isActive: true,
  },
  {
    id: L.quilmes,
    level: "city",
    name: "Quilmes",
    parentId: L.buenosAiresProvince,
    isActive: true,
  },
  {
    id: L.palermo,
    level: "neighborhood",
    name: "Palermo",
    parentId: L.cabaCity,
    isActive: true,
  },
  {
    id: L.belgrano,
    level: "neighborhood",
    name: "Belgrano",
    parentId: L.cabaCity,
    isActive: true,
  },
  {
    id: L.caballito,
    level: "neighborhood",
    name: "Caballito",
    parentId: L.cabaCity,
    isActive: true,
  },
  {
    id: L.laPlataCentro,
    level: "neighborhood",
    name: "Centro",
    parentId: L.laPlata,
    isActive: true,
  },
  {
    id: L.cityBell,
    level: "neighborhood",
    name: "City Bell",
    parentId: L.laPlata,
    isActive: true,
  },
  {
    id: L.tolosa,
    level: "neighborhood",
    name: "Tolosa",
    parentId: L.laPlata,
    isActive: true,
  },
  {
    id: L.bernal,
    level: "neighborhood",
    name: "Bernal",
    parentId: L.quilmes,
    isActive: true,
  },
]

export const propertyTypes: PropertyType[] = [
  { id: PROPERTY_TYPE_IDS.house, name: "Casa", isActive: true },
  { id: PROPERTY_TYPE_IDS.apartment, name: "Departamento", isActive: true },
  { id: PROPERTY_TYPE_IDS.ph, name: "PH", isActive: true },
  { id: PROPERTY_TYPE_IDS.retail, name: "Local", isActive: true },
  { id: PROPERTY_TYPE_IDS.office, name: "Oficina", isActive: true },
  { id: PROPERTY_TYPE_IDS.land, name: "Terreno", isActive: true },
]

export const amenities: Amenity[] = [
  { id: AMENITY_IDS.pool, name: "Pileta", icon: "waves", isActive: true },
  { id: AMENITY_IDS.garage, name: "Cochera", icon: "car", isActive: true },
  { id: AMENITY_IDS.grill, name: "Parrilla", icon: "flame", isActive: true },
  { id: AMENITY_IDS.balcony, name: "Balcón", icon: "fence", isActive: true },
  { id: AMENITY_IDS.terrace, name: "Terraza", icon: "sun", isActive: true },
  {
    id: AMENITY_IDS.elevator,
    name: "Ascensor",
    icon: "arrow-up-down",
    isActive: true,
  },
]

export const operationTypes: OperationType[] = [
  {
    id: "00000000-0000-4000-8000-000000002101",
    name: "Alquiler",
    isActive: true,
  },
  { id: "00000000-0000-4000-8000-000000002102", name: "Venta", isActive: true },
  {
    id: "00000000-0000-4000-8000-000000002103",
    name: "Temporario",
    isActive: true,
  },
]

export const serviceTypes: ServiceType[] = [
  { id: SERVICE_TYPE_IDS.rent, name: "Alquiler", isActive: true },
  { id: SERVICE_TYPE_IDS.hoaFees, name: "Expensas", isActive: true },
  { id: SERVICE_TYPE_IDS.electricity, name: "Luz", isActive: true },
  { id: SERVICE_TYPE_IDS.gas, name: "Gas", isActive: true },
  { id: SERVICE_TYPE_IDS.water, name: "Agua", isActive: true },
  { id: SERVICE_TYPE_IDS.municipalTax, name: "Municipal", isActive: true },
  { id: SERVICE_TYPE_IDS.insurance, name: "Seguro", isActive: true },
]
