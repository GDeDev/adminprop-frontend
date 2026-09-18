# Spec — Fase 3: Setup del Proyecto

> Resumen simple: es el arranque técnico. Al terminar esta fase, el proyecto prende, se conecta a una base de datos local, y tiene toda la estructura de carpetas lista para empezar a meter funcionalidad.

**Depende de:** Fase 1 (Arquitectura) aprobada.
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


Inicializar el monorepo completo siguiendo la estructura definida en Fase 1, sin funcionalidad de negocio todavía — solo el esqueleto que compila y corre.

## 2. Tareas

### 2.1 Monorepo
- `npx create-turbo@latest` o setup manual con Turborepo
- Configurar `turbo.json` con pipelines: `build`, `dev`, `test`, `lint`
- Workspaces: `apps/api`, `apps/backoffice`, `apps/portal`, `packages/shared-types`, `packages/shared-utils`, `packages/ui`

### 2.2 Backend (`apps/api`)
- `nest new api` dentro del monorepo
- Instalar: `prisma`, `@prisma/client`, `@nestjs/cqrs`, `@nestjs/config`, `@nestjs/jwt`, `class-validator`, `class-transformer`, `decimal.js`
- `npx prisma init` — crea `prisma/schema.prisma`
- Crear un `PrismaService` (extiende `PrismaClient`, implementa `OnModuleInit`/`OnModuleDestroy` para conectar/desconectar prolijo) e inyectarlo como provider global de NestJS
- Configurar el Prisma Client Extension de aislamiento por tenant (`TenantScopedRepository`, ver Fase 1 sección 3.2) desde el arranque
- Configurar `ValidationPipe` global, `AllExceptionsFilter` global (placeholder, se completa en Fase 4)
- Endpoint `GET /health` que devuelve `{ status: 'ok', timestamp }` y chequea conexión a DB (`prisma.$queryRaw` simple)
- Estructura base de carpetas: `src/modules/`, `src/common/` (guards, filters, interceptors, decorators compartidos), `prisma/migrations/` (generadas por Prisma, no a mano)

### 2.3 Base de Datos Local
- `docker-compose.yml` en la raíz con servicio `postgres:16`, puerto `5432`, volumen persistente, variables de entorno para user/pass/db
- Primera migración con `npx prisma migrate dev --name init` que crea el modelo `Tenant` (único que no lleva `tenantId`, ver spec de Fase 1 sección 3.3) y `User` básico en `schema.prisma`

### 2.4 Frontend Backoffice (`apps/backoffice`)
- `npx create-next-app@latest backoffice --typescript --tailwind --app --src-dir`
- App Router. Es una SPA logueada de facto: casi todo detrás de auth, se usan Client Components para lo interactivo (formularios, wizards, tablas con filtros en tiempo real) — Server Components solo donde de verdad aportan (layout estático, fetch inicial de datos que no cambian por interacción del usuario). No forzar SSR donde no aporta nada a una pantalla atrás de login.
- **shadcn/ui** inicializado (`npx shadcn@latest init`) — los componentes se copian al proyecto (`components/ui/`), no es una dependencia externa con lock-in
- Instalar: **TanStack Query** (estado servidor/cache), **React Hook Form + Zod** (formularios y validación — hay varios wizards largos: alta de Contrato, de Propiedad), **Axios** (cliente HTTP)
- Configurar Tailwind con los tokens de color del PRD (Nero, Off-White, Dark Green, Copper) como variables de theme, mismo archivo de config que consume `packages/ui`
- Cliente HTTP base en `src/lib/api-client.ts` con interceptor de auth (agrega Bearer token) y manejo global de 401 (redirect a login)
- Layout base mobile-first con navbar inferior

### 2.5 Frontend Portal (`apps/portal`)
- `npx create-next-app@latest portal --typescript --tailwind --app --src-dir`
- App Router, usando SSR/SSG donde sí aporta (listado y ficha de propiedades públicas — Fase 22, importa para SEO), Client Components para las partes interactivas y para los portales de autogestión de propietario/inquilino (Fases 17-18, son secciones logueadas dentro de esta misma app)
- **shadcn/ui** inicializado igual que en backoffice, reusando la config de theme de `packages/ui` para que ambas apps se vean consistentes
- Estructura de rutas base (sin contenido real todavía): `/`, `/propietario/login`, `/inquilino/login`

### 2.6 Packages Compartidos
- `packages/shared-types`: exportar interfaces base (`Tenant`, `User`, enums de roles/estados)
- `packages/shared-utils`: implementar `money.ts` (helpers de `decimal.js` definidos en Fase 1), tests unitarios de redondeo
- `packages/ui`: componentes shadcn/ui compartidos entre `backoffice` y `portal` (Button, Card, Badge, Input, etc. — los mismos "primitivos" copiados una vez acá y reexportados, para no duplicar el `components/ui/` de shadcn en cada app), más la config de theme (colores, tipografía) que ambas apps de Tailwind extienden

### 2.7 Tooling
- ESLint + Prettier compartidos desde raíz
- Husky + lint-staged: pre-commit corre lint, format, y los tests afectados por los archivos modificados (nunca commitear con tests en rojo)
- `.env.example` en cada app con las variables que va a necesitar (aunque no se usen todavía)
- `.gitignore` correcto (node_modules, .env, dist, .turbo)

### 2.7.1 Secret Manager y Feature Flags (ver Fase 1, sección 5.3)
- Crear proyecto en **Doppler** (free tier), cargar los secretos base (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` — el resto se suma en las fases que los necesiten)
- Configurar los 3 entornos en Doppler (dev/staging/prod), aunque staging/prod queden vacíos hasta la Fase 16
- `apps/api` arranca vía `doppler run -- npm run start:dev` en el script de desarrollo, no leyendo un `.env` local directo
- Crear proyecto en **Flagsmith** (free tier), definir el `FeatureFlagPort` (interfaz) y su `FlagsmithAdapter` en `packages/shared-utils` o en un módulo `infrastructure/feature-flags/`
- Un flag de prueba (`test-flag`) creado y consumido desde un endpoint dummy, para validar que la integración funciona de punta a punta

### 2.7.2 Cola de Trabajos (pg-boss)
- Instalar `pg-boss`, apuntando al mismo Postgres del `docker-compose.yml` (crea su propio schema interno, no requiere infraestructura adicional)
- Definir el `QueuePort` (interfaz) y su `PgBossQueueAdapter` en `infrastructure/queue/`
- Un job dummy que se encola, procesa, y — simulando una falla — reintenta correctamente, para validar la integración antes de que Fase 13 dependa de esto

### 2.8 CI básico
- GitHub Actions: workflow que en cada push corre `turbo lint` y `turbo test`
- No incluye deploy todavía (eso es Fase 16)

## 3. Criterios de Aceptación

- [ ] `docker-compose up` levanta Postgres local sin errores
- [ ] `turbo dev` levanta las 3 apps simultáneamente sin errores
- [ ] `GET /health` responde 200 con conexión a DB verificada
- [ ] La migración inicial corre limpia contra la DB local (`npx prisma migrate dev`) y `npx prisma studio` permite ver las tablas creadas
- [ ] `packages/shared-utils/money.ts` tiene tests que pasan (`turbo test`)
- [ ] Un commit con código mal formateado es rechazado por el pre-commit hook
- [ ] Un commit con un test roto (simular uno a propósito) es rechazado por el pre-commit hook
- [ ] El backoffice muestra una pantalla en blanco con el navbar y los colores del theme aplicados (prueba visual de que Tailwind + tokens funcionan)
- [ ] Un componente de `packages/ui` (ej. Button) se importa y renderiza correctamente tanto en `backoffice` como en `portal`, confirmando que el paquete compartido funciona en las dos apps
- [ ] `doppler run -- npm run start:dev` arranca la API con los secretos inyectados desde Doppler correctamente
- [ ] El endpoint dummy de feature flags devuelve `true`/`false` correctamente según el flag creado en Flagsmith
- [ ] Un job dummy encolado en pg-boss se procesa correctamente, y reintenta si el handler falla la primera vez

## 4. Fuera de Alcance
- Cualquier lógica de negocio, entidad más allá de `tenants`/`users` básica, autenticación funcional (eso es Fase 4)
- Despliegue a la nube (Fase 16)
