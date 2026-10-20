# Fase 4 — Auth y usuarios (frontend)

> Spec: `../adminprop-repo-files/specs/fase-04-auth.md`. Rama `feature/fase-04-auth`.
> Backend de la fase: `adminprop-backend/docs/tecnica/fase-04.md`.
> Resumen para no técnicos: [`../funcional/fase-04.md`](../funcional/fase-04.md).

La fase se hizo **sin supervisión** (autorización de Giuliano del 2026-09-19). Las decisiones que la spec no resolvía están en [`../DECISIONES_TECNICAS.md`](../DECISIONES_TECNICAS.md), DT-23 a DT-29, para revisarlas.

## Spec sección 6 → dónde quedó

| Pedido de la spec                             | Dónde                                                                                                |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Pantalla de login con error visible           | `apps/backoffice/src/app/(auth)/login/login-form.tsx`; portal: `components/portal-login-form.tsx`    |
| Access token en memoria                       | `packages/session/src/client/token-store.ts`                                                         |
| Refresh token en cookie httpOnly              | `packages/session/src/server/session-routes.ts`, montado en `app/api/session` de cada app            |
| Refresh silencioso en el interceptor de Axios | `packages/session/src/client/api-client.ts` + `session-client.ts`                                    |
| Redirect a `/login` ante un 401 no manejado   | `createApiClient({ onUnauthenticated })` en `src/lib/api-client.ts` de cada app                      |
| `<ProtectedRoute>`                            | `packages/session/src/client/protected-route.tsx`; `SessionGate` (backoffice), `PortalGate` (portal) |

Además de lo que pide la spec: tipos generados desde el OpenAPI, login del portal, marca de la inmobiliaria y la pantalla de usuarios.

## Qué quedó construido

### Tipos del contrato (task 1)

- `npm run api:types` → `packages/shared-types/src/generated/api.ts` (openapi-typescript sobre `../adminprop-backend/openapi.json`). Commiteado y fuera de ESLint.
- `packages/shared-types/src/api.ts`: `User`, `AuthResult`, `AuthTokens`, `TenantBranding`, `Paginated<T>`, requests de login y de usuarios.
- `user.ts`: `Role`, `InternalRole`, `PortalType` con los valores de la API. `PortalRole` queda como área de la URL.

### `@adminprop/session` (task 2)

```
packages/session/src/
  server/  session-routes.ts   POST/DELETE /api/session, POST /api/session/refresh
           cookies.ts          nombres de cookie, marca codificada
  client/  token-store.ts      access token en memoria
           session-client.ts   refresh single-flight + Web Locks, start/end
           api-client.ts       Axios: Bearer, refresh ante 401, reintento, redirect
           api-error.ts        mensajes y códigos de error de la API
           session-provider.tsx SessionProvider / useSession (ensure, signIn, signOut)
           protected-route.tsx  ProtectedRoute (sesión + rol, reintento sin red)
```

Flujo:

```
Login:    navegador → API /auth/login → { user, tokens }
          navegador → POST /api/session { accessToken, refreshToken } → cookie httpOnly
Uso:      navegador → API con Bearer (token en memoria)
401:      → POST /api/session/refresh (una vez, con lock entre pestañas) → reintento
Recarga:  ProtectedRoute → refresh con la cookie → /auth/me
Logout:   DELETE /api/session → API /auth/logout → cookie borrada → login
```

### Backoffice (tasks 3 y 4)

- Cookies `adminprop_bo_rt` (refresh) y `adminprop_bo_brand` (marca).
- `src/proxy.ts`: sin cookie → `/login?next=...`. No aplica a `/login`, `/api` ni assets.
- `(dashboard)/layout.tsx`: `SessionGate` (sólo `ADMIN` y `EMPLOYEE`) + `AppShell` con el nombre de la inmobiliaria, el usuario y "Cerrar sesión".
- `layout.tsx` raíz: color de la inmobiliaria desde la cookie de marca.
- **Configuración → Usuarios** (`/configuracion/usuarios`, sólo admin): listado con filtros por rol y estado y paginado, alta, edición, desactivar/reactivar y reseteo de contraseña. React Query en `src/lib/users-api.ts`.

### Portal (task 5)

- Cookie `adminprop_portal_rt`, una sesión para las dos áreas.
- `PORTAL_TENANT_SLUG` → `GET /tenants/by-slug/:slug` para el nombre y el color (login y shell).
- `src/proxy.ts`: `/propietario/*` e `/inquilino/*` sin cookie → login de esa área. Lo público sigue público.
- `PortalGate`: cada área sólo para su rol (`OWNER` / `RENTER`).

## Variables de entorno

| Variable             | App    | Config Doppler | Notas                                                         |
| -------------------- | ------ | -------------- | ------------------------------------------------------------- |
| `PORTAL_TENANT_SLUG` | portal | `dev_portal`   | **Nueva**, creada vacía. En desarrollo: `demo`. Sólo servidor |

Para el login desde el navegador, `CORS_ORIGINS` de la API (`dev_backend`) tiene que incluir `http://localhost:3001` y `http://localhost:3002`.

## Tests

| Workspace          | Tests | Qué cubren                                                                                                                                       |
| ------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/session` | 30    | cookies, CSRF por Origin, rotación, logout; refresh ante 401, single-flight, sin loop, sin red; ProtectedRoute; errores de la API; open redirect |
| `apps/backoffice`  | 14    | login (éxito, `?next=`, error de la API), proxy, pantalla de usuarios (permisos, acciones)                                                       |
| `apps/portal`      | 11    | login de portal (slug y tipo, `?next=` de otra área, sin slug), proxy por área                                                                   |
| `packages/ui`      | 38    | sin cambios                                                                                                                                      |

Verificado además de punta a punta contra la API real (base descartable, sin tocar la de desarrollo): login, cookie, color de la inmobiliaria desde el server, refresh con rotación, reuso detectado → sesión cerrada, logout, y el login del portal con la marca por slug.

**No verificado a mano:** las pantallas logueadas en un navegador (la extensión de Chrome no estaba conectada). Revisar al probar: sidebar con usuario y "Cerrar sesión", y la pantalla de usuarios en mobile y desktop.

## Pendiente

- Fase 22: resolver la inmobiliaria del portal por dominio en vez de `PORTAL_TENANT_SLUG`.
- Fase 16: con muchas sesiones activas, que la API no cuente los refresh del servidor de Next contra el límite global por IP (DT-25).
- Cambiar la propia contraseña desde el front (la API ya tiene `POST /auth/change-password`): no lo pide la spec; hoy el admin puede resetearla a otro.
