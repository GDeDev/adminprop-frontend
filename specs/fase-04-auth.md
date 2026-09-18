# Spec — Fase 4: Auth y Usuarios

> Resumen simple: acá se arma el sistema de login. Cada persona que entra al sistema (empleado, admin, propietario, inquilino) tiene usuario y contraseña, y el sistema sabe quién es, de qué inmobiliaria, y qué puede ver.

**Depende de:** Fase 3 (Setup) completada.
**No depende de respuestas de Micaela.**

---

## 1. Alcance

> 🏢 **Multi-Tenant y SaaS:** esta fase construye pensando en múltiples inmobiliarias (tenants) usando el mismo sistema, no solo Oppido. Toda entidad nueva lleva `tenant_id` y usa `TenantScopedRepository` (Fase 1) — ningún query manual sin ese filtro. Ningún nombre, texto o regla específica de Oppido se hardcodea en código; lo que varía por cliente vive en la entidad `Tenant` o en datos.
>
> ✅ **Tests de esta fase deben incluir:** al menos un caso que verifique aislamiento entre tenants (ej. "un usuario del Tenant A no puede ver/modificar datos del Tenant B, ni por ID directo") además de los tests funcionales propios del módulo.
>
> 🧩 **Modularidad (Fase 1, sección 5.1):** este módulo solo se comunica con otros vía su Facade público (`public/`) o mediante eventos del `EventBus` — nunca importando entidades, repositorios o servicios internos de otro módulo directamente.
>
> ☁️ **Infraestructura desacoplada (Fase 1, sección 5.2):** si este módulo usa storage, email, colas o cualquier servicio externo, se accede vía su Port/interfaz (ej. `StoragePort`, `EmailPort`), nunca importando el SDK del proveedor (Cloudinary, Resend, etc.) directamente en el Domain Service — así migrar de Neon/Supabase/Cloudinary/Resend a AWS más adelante es solo un cambio de adapter y configuración.
>
> 🔐 **Secretos y flags (Fase 1, sección 5.3):** las credenciales de esta fase se gestionan en Doppler, nunca hardcodeadas ni en un `.env` compartido. Si esta fase necesita activarse/desactivarse por tenant o probarse gradualmente, usar `FeatureFlagPort` (Flagsmith), no un booleano hardcodeado ni una variable de entorno para eso.
>
> 🌐 **Idioma del código (Fase 1, sección 12):** esta spec nombra entidades y campos en español para que se lea y apruebe fácil — es documentación funcional. El código (clases, variables, columnas, endpoints) se escribe 100% en inglés, traduciendo los nombres al implementar.


Autenticación completa (login, refresh, logout), gestión de usuarios internos (admin/empleado), y toda la infraestructura de guards/roles/tenant-context que las fases siguientes van a usar.

## 2. Entidades

### 2.1 `User` (usuarios internos: admin y empleado)
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| tenant_id | UUID | FK a tenants |
| email | String | único por tenant |
| password_hash | String | bcrypt, nunca se devuelve en responses |
| nombre | String | — |
| apellido | String | — |
| role | Enum | `admin` \| `empleado` |
| activo | Boolean | permite desactivar sin borrar |
| created_at, updated_at | Timestamp | — |

### 2.2 `RefreshToken`
| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK, puede ser User, Propietario o Inquilino (polimórfico simple con `user_type`) |
| user_type | Enum | `internal` \| `propietario` \| `inquilino` |
| token_hash | String | el refresh token se guarda hasheado |
| expires_at | Timestamp | — |
| revoked | Boolean | default false |

> Nota: Propietario e Inquilino ya tienen `portal_usuario`/`portal_password_hash` definidos en el PRD (secciones 5.2, 5.3). Sus credenciales se validan contra esos campos, no contra la tabla `User`.

## 3. Endpoints

### 3.1 `POST /auth/login` (público)
**Request:**
```json
{ "email": "string", "password": "string" }
```
**Response 200:**
```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": { "id": "uuid", "nombre": "string", "role": "admin|empleado", "tenantId": "uuid" }
}
```
**Response 401:** credenciales inválidas (mensaje genérico, no revelar si el email existe o no)

### 3.2 `POST /auth/portal-login` (público — para propietarios e inquilinos)
**Request:** `{ "usuario": "string", "password": "string", "tipo": "propietario" | "inquilino" }`
**Response:** igual shape que 3.1, con `role: "propietario"` o `"inquilino"` y el id de la entidad correspondiente en el claim

### 3.3 `POST /auth/refresh` (público, requiere refresh token válido)
**Request:** `{ "refreshToken": "string" }`
**Response 200:** nuevo `accessToken` (+ rotación opcional del refresh token)
**Response 401:** refresh token inválido, expirado o revocado

### 3.4 `POST /auth/logout` (autenticado)
Revoca el refresh token actual. **Response 204**.

### 3.5 `GET /auth/me` (autenticado)
Devuelve los datos del usuario logueado según su JWT. Sin params.

### 3.6 CRUD de Usuarios Internos (solo `admin`)
- `GET /users` — lista paginada, filtro por rol/activo
- `POST /users` — crear empleado (envía invitación por email opcionalmente, o se define password directo — a decidir en implementación, no bloqueante)
- `PATCH /users/:id` — editar datos, cambiar rol
- `PATCH /users/:id/deactivate` — desactivar (soft, no borra)
- `PATCH /users/:id/password` — reseteo de contraseña por admin

## 4. Reglas de Negocio

- Password hasheado con `bcrypt`, cost factor 10 mínimo.
- Access token: 15 minutos de vida. Refresh token: 7 días.
- El JWT del access token contiene: `{ sub: userId, tenantId, role, userType }`.
- Un usuario `admin` desactivado no puede loguearse aunque tenga credenciales válidas.
- Login de portal (propietario/inquilino) valida contra tenant correcto — un propietario de Oppido no puede loguearse "cruzado" aunque exista otro tenant.
- Rate limiting básico en `/auth/login` y `/auth/portal-login` (ej. 5 intentos por minuto por IP) para mitigar fuerza bruta — usar `@nestjs/throttler`.

## 5. Guards y Decorators (quedan disponibles para TODAS las fases siguientes)

- `@Public()` — marca un endpoint como no autenticado
- `JwtAuthGuard` — global, valida el access token
- `RolesGuard` + `@Roles('admin', 'empleado')` — restringe por rol
- `TenantContextMiddleware` — puebla el `AsyncLocalStorage` con el `tenantId` del JWT (definido en Fase 1, implementado acá)
- `@CurrentUser()` — decorator de parámetro que extrae el usuario del JWT en el controller

## 6. Frontend (Backoffice)

- Pantalla de Login (email + password), con manejo de error visible
- Guardado de tokens en memoria + refresh silencioso vía interceptor de Axios (no `localStorage` para el access token; refresh token en httpOnly cookie si es posible, o storage seguro)
- Redirect a `/login` en cualquier 401 no manejado
- Ruta protegida wrapper (`<ProtectedRoute>`) que valida sesión antes de renderizar

## 7. Criterios de Aceptación

- [ ] Login con credenciales válidas devuelve tokens y datos de usuario correctos
- [ ] Login con credenciales inválidas devuelve 401 con mensaje genérico
- [ ] Un endpoint protegido sin token devuelve 401
- [ ] Un endpoint protegido con token expirado devuelve 401
- [ ] Refresh token válido genera un nuevo access token
- [ ] Refresh token revocado (post-logout) es rechazado
- [ ] Un `empleado` no puede acceder a `POST /users` (solo `admin`) → 403
- [ ] Dos tenants distintos, mismo email de propietario en ambos → cada login resuelve al tenant correcto, sin cruce
- [ ] Rate limiting bloquea el 6to intento de login fallido en el mismo minuto

## 8. Casos Borde
- Usuario desactivado intenta loguearse → 401 (mismo mensaje genérico que credenciales inválidas, no revelar que existe pero está desactivado)
- Token JWT manipulado (firma inválida) → 401
- Request con `tenantId` en el JWT que no existe más en la tabla `tenants` (tenant eliminado) → 401
