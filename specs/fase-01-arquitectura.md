# Spec — Fase 1: Arquitectura Técnica

> Resumen simple: acá definimos las reglas fijas del proyecto — cómo se organiza el código, cómo se guardan los datos, cómo se separan las inmobiliarias entre sí, y cómo se maneja la plata sin errores de redondeo. Todo lo que sigue en las próximas fases usa esto como base, sin repetirlo.

> ⚡ **VISIÓN DE PRODUCTO — leer antes de codear cualquier fase:** Adminprop se construye como un producto **SaaS multi-tenant desde el día uno**, no como un sistema a medida para Oppido. Oppido es el primer cliente/tenant, pero cada decisión de nombres, estructura de datos y UI debe asumir que mañana existen 50 inmobiliarias más usando la misma instancia. Esto implica: nunca hardcodear nombres, colores, textos o reglas de negocio específicas de Oppido en el código — todo lo que varía por cliente vive en la entidad `Tenant` o en sus datos, nunca en el código fuente. Todo dev (humano o agente) que trabaje en cualquier fase debe tener esto presente, no solo quien lea esta Fase 1.

**No depende de ninguna otra fase. No depende de respuestas de Micaela.**

---

## 1. Estructura del Monorepo

```
adminprop/
├── apps/
│   ├── api/              # NestJS — backend único
│   ├── backoffice/        # Next.js (App Router) — mayormente Client Components, SPA logueada
│   └── portal/             # Next.js — portal público + autogestión
├── packages/
│   ├── shared-types/       # Tipos TS compartidos (DTOs, enums, interfaces)
│   ├── shared-utils/        # Helpers puros (fechas, dinero, validadores)
│   └── ui/                  # Componentes UI compartidos (si backoffice y portal comparten)
├── docs/
│   ├── tecnica/              # Un .md por fase, generado al cerrar cada una
│   └── funcional/            # Idem, versión funcional
├── specs/                    # Specs de cada fase (este documento vive acá)
├── turbo.json
├── package.json
└── docker-compose.yml         # Postgres local
```

Gestionado con **Turborepo**. Cada app tiene su propio `package.json`; `packages/*` se consumen como workspace dependencies.

---

## 2. Base de Datos

- **PostgreSQL 16**, local vía Docker en desarrollo (`docker-compose.yml`), gestionado (Neon/Supabase) en despliegue.
- **ORM: Prisma** (schema declarativo único como fuente de verdad, cliente tipado auto-generado, migraciones con `prisma migrate`, buena integración con NestJS vía `@nestjs/prisma` o un `PrismaService` propio).
- Migraciones versionadas en `apps/api/src/database/migrations/`. **Nunca** `synchronize: true` fuera de un entorno de test aislado.
- Convención de nombres: tablas en `snake_case` plural (`properties`, `owners`), columnas en `snake_case`.
- Todas las tablas core llevan `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at`, `updated_at`.
- Soft delete vía `deleted_at NULLABLE` en entidades que lo requieran (nunca DELETE físico sobre datos con historial financiero).

### 2.1 Manejo de Dinero — REGLA CRÍTICA

**Todos los montos monetarios se almacenan como `NUMERIC(14,2)` en Postgres y como `string` (no `number`) en las capas de aplicación**, usando la librería **`decimal.js`** para cualquier operación aritmética (sumas, porcentajes, cálculo de punitorios).

- ❌ Nunca `number`/`float` para dinero — el redondeo de punto flotante genera diferencias de centavos que en un sistema financiero son inaceptables.
- ✅ DTOs de entrada validan montos como string numérico (`@IsNumberString()` o similar) y se convierten a `Decimal` inmediatamente al entrar al dominio.
- ✅ Un helper único `packages/shared-utils/money.ts` centraliza: suma, resta, porcentaje, redondeo (2 decimales, `ROUND_HALF_UP`), y formateo para mostrar.
- ✅ Todo cálculo de punitorios, honorarios y liquidaciones pasa por este helper — no se reimplementa la lógica de redondeo en cada módulo.

---

## 3. Estrategia Multi-Tenant

**Modelo:** single-database, shared-schema. Todas las tablas core (excepto `tenants` y tablas de maestros globales) tienen `tenant_id UUID NOT NULL REFERENCES tenants(id)`.

### 3.1 Resolución del tenant
- El `tenant_id` viaja como claim dentro del JWT del usuario logueado (`{ sub, email, role, tenantId }`).
- Un **`TenantContextMiddleware`** lee el JWT en cada request y setea el `tenantId` en un `AsyncLocalStorage` (context de NestJS), disponible para toda la cadena de la request sin pasarlo manualmente por parámetros.

### 3.2 Aislamiento automático
- **`TenantScopedRepository`**: clase base (o, en el enfoque Prisma, un **Prisma Client Extension** aplicado globalmente vía `$extends`) que **inyecta automáticamente** `where: { tenantId }` en cada query (`findMany`, `findUnique`, `update`, `delete`, etc.). Ningún repositorio de entidad concreta escribe queries manuales sin pasar por este extension. Alternativa equivalente: middleware de Prisma (`$use`) que intercepta cada query y agrega el filtro — usar Client Extensions por ser el mecanismo recomendado actualmente por Prisma (los middlewares están en camino de deprecación).
- Esto hace estructuralmente imposible que un bug de un módulo exponga datos de otro tenant, porque el filtro no depende de que el developer se acuerde de agregarlo.

### 3.3 Entidad `Tenant`
Definida en el PRD (sección 5.0). Contiene los parámetros de negocio configurables por inmobiliaria (% honorarios, días de gracia, % punitorio, etc.). Alta de tenant nuevo: script de seed manual, sin ABM en el MVP.

---

## 4. Autenticación y Autorización

- **JWT** con access token (15 min) + refresh token (7 días, almacenado hasheado en DB para poder revocar).
- Roles: `admin`, `empleado`, `propietario`, `inquilino`.
- **`JwtAuthGuard`** global (aplicado vía `APP_GUARD`) — todo endpoint requiere autenticación salvo los marcados explícitamente con `@Public()`.
- **`RolesGuard`** + decorator `@Roles('admin', 'empleado')` para restringir por rol.
- Los portales de propietario/inquilino usan el mismo mecanismo JWT pero con rol restringido — sus queries además filtran por su propio `propietario_id`/`inquilino_id` (un propietario nunca ve datos de otro, aunque sean del mismo tenant).

---

## 5. Patrón CQRS

- Librería: **`@nestjs/cqrs`**.
- Cada caso de uso de escritura es un **Command** + **CommandHandler** (ej. `CreatePropertyCommand` / `CreatePropertyHandler`).
- Cada caso de uso de lectura es una **Query** + **QueryHandler** (ej. `GetPropertyByIdQuery` / `GetPropertyByIdHandler`).
- **El Controller NO contiene lógica de negocio.** Solo: recibe el DTO validado → arma el Command/Query → lo despacha via `CommandBus`/`QueryBus` → devuelve la respuesta.
- La lógica de negocio (reglas, validaciones de dominio) vive en el **Domain Service**, que el Handler invoca.
- Estructura de carpetas por módulo:
```
modules/properties/
├── commands/
│   ├── create-property.command.ts
│   └── create-property.handler.ts
├── queries/
│   ├── get-property-by-id.query.ts
│   └── get-property-by-id.handler.ts
├── domain/
│   └── property.service.ts       # Reglas de negocio puras
├── dto/
│   ├── create-property.dto.ts
│   └── property-response.dto.ts
├── entities/
│   └── property.entity.ts
├── events/
│   └── property-status-changed.event.ts   # Eventos que otros módulos pueden escuchar
├── public/
│   └── properties.facade.ts       # ÚNICO punto de entrada permitido para otros módulos
├── properties.controller.ts
└── properties.module.ts
```
> Ver sección 5.1 para las reglas de qué puede y no puede importarse entre módulos — es lo que deja la puerta abierta a extraer módulos a servicios independientes el día de mañana sin reescribirlos.

---

## 5.1 Modularidad para Extracción Futura (Modular Monolith)

**Decisión:** hoy todo corre en un único proceso NestJS (`apps/api`), pero cada módulo de negocio se construye con fronteras tan estrictas que el día de mañana — cuando haya presupuesto e infraestructura — se pueda extraer a su propio servicio (ej. un servicio de Auth aparte, uno de generación de PDFs aparte) **sin reescribir su lógica interna**, solo cambiando cómo se comunica hacia afuera.

Los candidatos más claros a extraerse el día de mañana son los que menos dependen del resto: **Auth**, **Generación de PDFs**, **Notificaciones/Mailing**, y **Cron Jobs**. Por eso estos módulos, en particular, deben respetar las reglas de abajo con más rigor todavía desde que se escriben por primera vez.

### Reglas obligatorias, desde la Fase 4 en adelante

1. **Un módulo nunca importa la entidad/repositorio de otro módulo directamente.** Si el módulo de Contratos necesita datos de Propiedades, no hace `import { PropertyRepository } from '../properties/...'` — lo pide a través de un **Facade/Service público** que ese módulo expone explícitamente (ver punto 2).

2. **Cada módulo expone una interfaz pública explícita** (`modules/properties/public/properties.facade.ts`), con solo los métodos que otros módulos tienen permitido usar (ej. `getPropertyBasicInfo(id)`), nunca el repositorio ni las entidades internas. Todo lo demás del módulo (`domain/`, `entities/`, `commands/`) es privado, no se importa desde afuera del módulo bajo ninguna circunstancia.

3. **La comunicación entre módulos para efectos secundarios (no consultas) es por eventos, no por llamada directa.** Los eventos de dominio en sí se emiten con el `EventBus` de `@nestjs/cqrs` (ej. `ContractCreatedEvent`, `PaymentConfirmedEvent`), pero **el transporte real detrás de ese evento es `pg-boss`** (ver sección 5.2, `QueuePort`) para los casos donde el efecto tiene que sobrevivir un reinicio del proceso o necesita reintentos — no todo evento necesita esto, pero cualquiera que dispare una acción de negocio importante (ej. generar una Liquidación al confirmarse un Pago) sí. Esto es clave: pg-boss corre sobre el mismo Postgres que ya tenés (cola persistida en una tabla, sin infraestructura nueva), y conceptualmente funciona igual que SQS (encolar, consumir, reintentar, dead-letter) — así que el día que un módulo se extrae a otro servicio, el adapter de pg-boss se reemplaza por uno de SQS sin tocar quién escucha ni por qué se dispara. Ejemplo real del dominio: cuando se confirma un Pago (Fase 11), el módulo de Liquidaciones (Fase 12) no es llamado directamente — escucha el evento `PaymentConfirmedEvent`, transportado por pg-boss.

4. **Los módulos candidatos a extracción temprana (Auth, PDFs, Notificaciones, Cron) no acceden a la base de datos de otros módulos ni siquiera en modo lectura directa** — todo lo que necesitan de otro módulo entra por su Facade público o por el payload del evento que los disparó. Esto es más estricto que la regla general (punto 1-2) porque son justamente los que se piensa desacoplar primero.

5. **Carpeta `modules/<nombre>/public/`** es la convención para lo exportado; todo lo demás dentro del módulo se considera implementación interna y el linter (regla de ESLint de import boundaries, ej. `eslint-plugin-boundaries`) debe rechazar imports que la violen — no queda como buena intención, se hace cumplir automáticamente.

### Qué NO implica esto ahora
No se despliega nada por separado todavía, no hay colas de mensajes reales, no hay múltiples bases de datos. Es **una sola app, un solo deploy, una sola base**, pero organizada por dentro con las costuras ya marcadas. El costo de escribirlo así desde el principio es bajo (una carpeta `public/` y pensar en eventos en vez de llamadas directas); el costo de no hacerlo y tener que desenredarlo después con el sistema en producción y con datos reales es mucho más alto.

---

## 5.2 Infraestructura Desacoplada (Adapters/Ports)

**Decisión:** hoy el MVP se despliega en servicios gratuitos/económicos (Neon o Supabase para Postgres, Render/Railway para la API, Cloudinary para assets, Resend para email — ver Fase 16). El destino final, cuando el negocio lo justifique, es **AWS** (o eventualmente Huawei Cloud) con infraestructura propia. Migrar de un proveedor gratuito a AWS **no debe requerir tocar una sola línea de lógica de negocio** — solo la capa de infraestructura y la configuración.

Esto se logra con el patrón **Ports & Adapters (arquitectura hexagonal aplicada a infraestructura)**: el dominio define una interfaz de lo que necesita ("guardar un archivo", "enviar un email", "publicar un evento"), y quién implementa esa interfaz es intercambiable por configuración.

### Regla obligatoria: ningún módulo de dominio importa un SDK de proveedor directamente

Nunca hacer `import { v2 as cloudinary } from 'cloudinary'` dentro de un Domain Service o Handler. En su lugar:

1. **Se define una interfaz propia** en `packages/shared-types` o en el módulo correspondiente, ej.:
```typescript
// modules/storage/storage.port.ts
export interface StoragePort {
  upload(file: Buffer, path: string): Promise<{ url: string }>;
  delete(url: string): Promise<void>;
}
```
2. **Se implementa un adapter concreto por proveedor**, ej. `CloudinaryStorageAdapter implements StoragePort`, y el día de mañana `S3StorageAdapter implements StoragePort` — ambos viven en `infrastructure/adapters/`, nunca en `domain/`.
3. **El módulo de NestJS inyecta la interfaz, no la implementación** (`@Inject('StoragePort')`), y qué adapter concreto se registra se decide en el `Module` según una variable de entorno (`STORAGE_PROVIDER=cloudinary` vs `STORAGE_PROVIDER=s3`), nunca hardcodeado.

### Puertos a definir desde el inicio (uno por cada pieza de infraestructura externa)

| Puerto | Implementación MVP (gratis) | Implementación futura (AWS) |
|---|---|---|
| `StoragePort` | Cloudinary | S3 |
| `EmailPort` | Resend (vía Novu) | SES |
| `DatabasePort` | Postgres en Neon/Supabase | Postgres en RDS — **este es el más simple de los cinco**, porque es el mismo motor (Postgres) con el mismo ORM; migrar es un cambio de `DATABASE_URL`, no de código |
| `QueuePort` | **pg-boss** — cola de trabajos real, corre sobre el mismo Postgres (sin infraestructura adicional), con reintentos y dead-letter queue nativos | SQS |
| `CronPort` | `@nestjs/schedule` disparando jobs encolados en **pg-boss** (que ya da idempotencia y evita doble ejecución si algún día hay más de una instancia) | EventBridge + Lambda, o `@nestjs/schedule` en un proceso dedicado |

> La fila de `DatabasePort` es la razón por la que elegimos Postgres desde el día uno en vez de un motor propietario de algún proveedor gratuito — nos garantiza que ese puerto en particular es casi gratis de migrar.
>
> **`QueuePort` con pg-boss no es una implementación "de mentira" para más adelante — es una cola real desde el día uno**, a diferencia de Storage/Email donde el MVP usa directamente el proveedor gratuito externo. Acá la elección fue distinta: en vez de "nada hasta que migremos", se usa pg-boss porque no cuesta nada extra (vive en el Postgres que ya existe) y da beneficios reales ahora (reintentos, persistencia ante caídas) — la migración a SQS es una mejora de escala futura, no una necesidad para tener colas funcionando hoy.

### pg-boss no es solo para cron — también para acciones manuales pesadas

Cualquier acción que el usuario dispara desde la UI y que implica procesar muchos registros o llamar a un servicio externo muchas veces (ej. "reenviar recordatorio de pago a todos los morosos", "regenerar los PDFs de liquidación del mes", "reprocesar una importación de Tokko fallida") **nunca se ejecuta de forma síncrona dentro del request HTTP** — el Controller/Handler encola el trabajo en pg-boss y responde de inmediato (`202 Accepted` con un id de job), y el procesamiento real ocurre en background con reintentos individuales si algún ítem falla. Esto evita que el usuario se quede esperando con el navegador colgado y evita timeouts del lado del servidor en operaciones de muchos registros. El frontend puede consultar el estado del job (`GET /jobs/:id/status`) o recibir una notificación in-app (Fase 14) cuando termina.

### Qué NO implica esto ahora
No se instala nada de AWS todavía, no hay cuenta de AWS activa, no se paga infraestructura propia. Se escribe **una interfaz fina y un solo adapter (el gratuito)** por cada puerto — el segundo adapter (AWS) se escribe recién cuando haga falta migrar, y en ese momento es la única pieza de código nueva, todo el dominio queda intacto.

---

## 5.3 Secret Management y Feature Flags

**Decisión:** en vez de manejar credenciales sueltas por `.env` en cada entorno (fácil de perder sincronía entre dev/staging/prod, fácil de filtrar sin querer en un commit), y en vez de hardcodear condicionales de "esto está habilitado o no" en el código, se usan dos herramientas externas desde el día uno — ambas con plan gratuito, ambas reemplazables por su equivalente de AWS (Secrets Manager / AppConfig) el día de la migración sin tocar cómo el código las consume.

### Secret Manager: Doppler
- Reemplaza el manejo manual de `.env` por entorno. Los secretos (DB credentials, API keys de Cloudinary/Resend/Novu, JWT secrets) se administran en Doppler y se inyectan como variables de entorno al arrancar el proceso (`doppler run -- npm start` en desarrollo; integración nativa con Render/Railway/Vercel en los entornos desplegados).
- El código de la aplicación **sigue leyendo `process.env.X`** normalmente (vía `@nestjs/config`, como ya está definido en la sección 11) — Doppler no cambia cómo el código accede a la variable, solo de dónde viene esa variable al momento de arrancar. Esto es clave: el día que se migre a AWS Secrets Manager, cambia solo el comando de arranque/la inyección, cero cambios en `apps/api/src/**`.
- Un solo lugar de verdad para los secretos de los 3 entornos (dev/staging/prod), con historial de cambios y control de quién accedió a qué.

### Feature Flags: Flagsmith
- Para activar/desactivar funcionalidad sin deploy (ej. activar el módulo de Tasación Automática — Fase 24 — solo quirúrgicamente, o probar una funcionalidad nueva primero con Oppido antes de habilitarla a otros tenants cuando existan).
- **Regla igual que con Storage/Email (sección 5.2):** el dominio nunca importa el SDK de Flagsmith directamente. Se define un `FeatureFlagPort` con un método simple (`isEnabled(flagKey: string, context?: { tenantId: string }): Promise<boolean>`), y el adapter concreto (`FlagsmithAdapter`) es quien habla con Flagsmith. El día de migrar a AWS AppConfig, se escribe `AppConfigAdapter implements FeatureFlagPort` y no cambia ningún lugar donde se usa un flag.
- Soporta segmentación por tenant de forma nativa — encaja directo con el modelo multi-tenant: un flag puede estar activo para el tenant Oppido y apagado para el resto, sin lógica custom.
- Uso típico en código: `if (await this.featureFlags.isEnabled('tasacion-automatica', { tenantId })) { ... }` dentro de un Handler o Controller, nunca dentro del Domain Service puro (la regla de negocio no debería saber sobre flags; el flag decide si se invoca esa regla, no cómo se comporta la regla en sí).

### Puertos actualizados (extiende la tabla de la sección 5.2)

| Puerto | Implementación hoy (gratis) | Implementación futura (AWS) |
|---|---|---|
| `SecretsPort` (indirecto — vía inyección al arrancar, no una interfaz de código) | Doppler | AWS Secrets Manager |
| `FeatureFlagPort` | Flagsmith | AWS AppConfig |

### Qué NO implica esto ahora
No se paga ningún plan pago de Doppler ni Flagsmith — ambos arrancan en su free tier, suficiente para un solo tenant real (Oppido) y para pruebas. Tampoco implica dejar de usar `.env.example` como documentación de qué variables existen — Doppler convive con eso, solo deja de ser la fuente de verdad real en los entornos compartidos.


---

## 6. Capas y Flujo de una Request

```
Request → Controller (valida DTO) → Command/Query Bus → Handler
        → Domain Service (reglas de negocio) → Repository (TenantScoped)
        → Postgres
```

El Controller no conoce Prisma. El Domain Service no conoce HTTP. El Repository no conoce reglas de negocio. Dependencias siempre hacia adentro.

---

## 7. DTOs y Validación

- Todo input pasa por un DTO con decoradores de `class-validator` (`@IsString()`, `@IsUUID()`, `@IsNumberString()`, etc.).
- `ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true` — rechaza cualquier campo no declarado en el DTO.
- DTOs de respuesta separados de las entidades (nunca se devuelve el modelo de Prisma directo) — usar `class-transformer` con `@Exclude()` en campos sensibles, mapeando explícitamente del resultado de Prisma al DTO de respuesta.

---

## 8. Manejo de Errores

- **Filtro global de excepciones** (`AllExceptionsFilter`) que captura cualquier error y devuelve shape consistente:
```json
{
  "statusCode": 400,
  "error": "ValidationError",
  "message": "Descripción legible",
  "timestamp": "2026-09-17T...",
  "path": "/api/properties"
}
```
- Excepciones de dominio custom (`InsufficientPaymentException`, `ContractAlreadyActiveException`, etc.) que extienden de una base `DomainException`, mapeadas a códigos HTTP apropiados en el filtro.

---

## 9. Auditoría (interceptor reutilizable)

- **`AuditInterceptor`** aplicable vía decorator `@Audit('entity_name')` sobre los handlers de Command que modifican datos sensibles.
- Registra automáticamente: usuario, acción, entidad, id, timestamp, diff de estado (antes/después) — sin que cada handler escriba código de auditoría manualmente.
- Persiste en tabla `audit_log` (ver PRD sección 18).

---

## 9.1 Convención de Jobs Asíncronos (acciones manuales pesadas)

Para no reinventar el patrón "encolar en pg-boss + consultar estado" en cada fase que lo necesite (ver sección 5.2), existe una convención única y reutilizable:

- **Entidad `AsyncJob`** (tabla propia, compartida por todos los módulos):

| Campo | Tipo | Notas |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | — |
| tipo | String | ej `"reenvio-masivo-recordatorios"`, `"regenerar-pdfs-liquidacion"` |
| estado | Enum | `pendiente` \| `procesando` \| `completado` \| `completado_con_errores` \| `fallido` |
| iniciado_por | FK | usuario |
| total_items | Integer | nullable, si se conoce de antemano |
| items_procesados | Integer | default 0 |
| items_con_error | Integer | default 0 |
| resultado | JSON | nullable, detalle libre según el tipo de job |
| iniciado_en | Timestamp | — |
| finalizado_en | Timestamp | nullable |

- **`GET /jobs/:id/status`** (autenticado, valida que el job pertenezca al tenant del usuario) — endpoint único y genérico para toda la app, no uno por módulo.
- Cualquier módulo que encole un trabajo pesado crea un `AsyncJob`, lo actualiza a medida que pg-boss procesa los ítems, y el frontend consulta ese mismo endpoint sin importar qué tipo de trabajo sea.
- Cuando el job termina, dispara (opcional según el caso) una notificación in-app vía el `EventBus`/Fase 14, para que el usuario no tenga que quedarse mirando la pantalla.

---

## 10. Testing

- **Unit tests:** Jest, para Domain Services (lógica de negocio pura — cálculo de punitorios, honorarios, multa de rescisión). Sin mocks de DB, funciones puras testeadas con casos borde.
- **E2E tests:** Supertest sobre la API levantada contra una DB de test (Docker), para flujos críticos completos (ej: "crear contrato → registrar cobro → generar liquidación").
- Cobertura mínima exigida en Domain Services de módulos financieros: **90%**. En el resto: mejor esfuerzo, no bloqueante.

---

## 10.1 Git Workflow

- **Una rama por fase:** `feature/fase-XX-<nombre-corto>`, creada desde `dev`.
- **Un commit por task**, no un commit gigante por fase. Cada subtarea del plan (entidad+migración, DTOs, handlers, domain service, controller, tests, integración front, documentación) se commitea por separado, en inglés, formato Conventional Commits. Esto habilita `git bisect` preciso y hace que el historial cuente la historia real de cómo se construyó cada fase.
- **El pre-commit hook (Husky) corre lint, format, y los tests relevantes de lo que se está commiteando — un commit con tests en rojo se rechaza.** No es una instrucción a seguir de buena fe, es una barrera mecánica.
- **Al cerrar la fase (todas sus tasks commiteadas y con documentación generada):** push de la rama y apertura de PR contra `dev`. El PR describe qué se implementó y qué decisiones de implementación se tomaron (más allá de lo que ya decía la spec). **El merge del PR requiere aprobación humana explícita — nunca automático.**

---

## 11. Variables de Entorno

- `.env.example` versionado, `.env` en gitignore — sirve como documentación de qué variables existen, aunque el valor real en dev/staging/prod se gestiona en **Doppler** (ver sección 5.3) en vez de archivos `.env` sueltos por entorno.
- Por entorno: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `RESEND_API_KEY`, `NOVU_API_KEY`, `FRONTEND_URL`, `FLAGSMITH_ENVIRONMENT_KEY`.
- **Variables de selección de proveedor** (ver sección 5.2, Infraestructura Desacoplada): `STORAGE_PROVIDER=cloudinary`, `EMAIL_PROVIDER=resend` — deciden qué adapter concreto se registra en cada módulo. El día de la migración a AWS, cambian estos valores (`STORAGE_PROVIDER=s3`, etc.) y se agregan las credenciales del nuevo proveedor, sin tocar código de dominio.
- Validación de env al bootear la app (`@nestjs/config` con schema `Joi`) — la app no arranca si falta una variable requerida, sin importar si la variable llegó de un `.env` local o inyectada por Doppler.

---

## 12. Convenciones Generales

- **Idioma del código: 100% inglés.** Nombres de clases, variables, funciones, archivos, tablas, columnas, endpoints, DTOs — todo en inglés, sin excepción. El español queda reservado para: comentarios que expliquen una regla de negocio local si hace falta contexto (raro, el código debería ser autoexplicativo), mensajes de error mostrados al usuario final, y contenido de datos (nombre de un tenant, texto de un email).
- **⚠️ Nota importante sobre las specs de este proyecto:** las specs de las Fases 5 en adelante (Maestros, Propiedades, Contratos, etc.) fueron escritas en español para que Micaela y el equipo las lean y aprueben fácilmente — nombran entidades y campos en español (`ServicioPropiedad`, `GastoAdelantado`, `honorarios_pct`, `deposito`). **Esos nombres son la documentación funcional, no el nombre a usar en el código.** Al implementar cada fase, traducir: `ServicioPropiedad` → `PropertyService`, `GastoAdelantado` → `AdvancedExpense`, `honorarios_pct` → `feePercentage`, `deposito` → `securityDeposit`, y así con el resto. Ante cualquier ambigüedad de traducción, se prioriza el término que usaría un ingeniero angloparlante del rubro real estate, no una traducción literal palabra por palabra.
- TypeScript estricto (`strict: true`) en todo el monorepo.
- ESLint + Prettier compartidos desde la raíz, un solo `.eslintrc` base extendido por cada app.
- Regla de ESLint de fronteras entre módulos (`eslint-plugin-boundaries` o equivalente) configurada para rechazar imports que violen la sección 5.1 — un módulo solo puede importar de `modules/otro-modulo/public/`, nunca de sus carpetas internas.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`), en inglés.
- Nomenclatura: `PascalCase` para clases/componentes, `camelCase` para variables/funciones/campos del schema de Prisma, `kebab-case` para nombres de archivo, `snake_case` para nombres de tabla en Postgres (convención estándar de SQL — en el `schema.prisma`, cada modelo lleva `@@map("nombre_snake_case")` y cada campo `@map("nombre_snake_case")` si difiere de camelCase, así el código sigue siendo 100% camelCase y la tabla física sigue la convención SQL).

---

## Criterios de Aceptación de esta Fase

- [ ] Documento revisado y aprobado por Giuliano antes de codear
- [ ] `packages/shared-utils/money.ts` con los helpers de dinero, testeado con casos de redondeo
- [ ] `docker-compose.yml` con Postgres local funcionando
- [ ] **Módulo de referencia `modules/_example/` creado y NO se borra al terminar la fase** (ver `CLAUDE.md`, sección "Módulo de Referencia") — un módulo real y completo que demuestra en un solo lugar: entidad Prisma con `tenantId`, Prisma Client Extension filtrando correctamente por tenant, un Command + Handler, un Query + Handler, el `AuditInterceptor` registrando una acción, un segundo módulo dummy comunicándose con el primero vía `EventBus` (nunca importando sus internos — el linter de boundaries lo rechaza si se intenta), un `StoragePort` con dos adapters intercambiables por configuración, un `FeatureFlagPort` con Flagsmith segmentado por tenant, un job encolado en pg-boss con reintento simulado, y el flujo completo de acción pesada asíncrona (`202` + `AsyncJob` + `GET /jobs/:id/status`). Con tests unit y e2e, y su `docs/tecnica/`+`docs/funcional/`.
- [ ] `doppler run -- npm run start:dev` arranca la API correctamente con los secretos inyectados desde Doppler (no desde un `.env` local)

## Casos Borde a Tener en Cuenta
- Un request sin JWT a un endpoint no público → 401 consistente
- Un usuario de un tenant intentando acceder (por ID directo) a un recurso de otro tenant → 404 (no 403, para no revelar que el recurso existe)
- Cálculo de punitorio con decimales que no cierran exacto (ej. 5% de $150.333,33) → redondeo `ROUND_HALF_UP` a 2 decimales, documentado y testeado
