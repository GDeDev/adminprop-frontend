import { z } from "zod"

/**
 * Misma política que la API (`StrongPassword` en adminprop-backend) para
 * avisar antes de mandar. La que manda igual es la de la API.
 */
export const strongPassword = z
  .string()
  .min(10, "Mínimo 10 caracteres.")
  .max(72, "Máximo 72 caracteres.")
  .regex(/[a-z]/, "Tiene que tener al menos una minúscula.")
  .regex(/[A-Z]/, "Tiene que tener al menos una mayúscula.")
  .regex(/\d/, "Tiene que tener al menos un número.")

export const PASSWORD_HINT =
  "Mínimo 10 caracteres, con mayúscula, minúscula y número."
