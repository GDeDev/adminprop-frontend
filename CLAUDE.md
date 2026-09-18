# CLAUDE.md — Adminprop

> Este archivo se carga automáticamente al iniciar Claude Code en este repo. Contiene los lineamientos que aplican a TODA fase de desarrollo — no los repitas preguntando, ya los tenés acá.

## Qué es este proyecto

Adminprop es un SaaS multi-tenant de gestión inmobiliaria (administración de alquileres) para el mercado argentino. Primer cliente/tenant: Oppido Propiedades. Reemplaza Excel y Tokko Broker.

**Documentos de referencia (leer en este orden al iniciar cualquier trabajo):**
1. `docs/PRD.md` — qué se construye, reglas de negocio, entidades
2. `specs/fase-01-arquitectura.md` — CÓMO se construye todo (leer completo antes de tocar código por primera vez). **La Fase 1 no termina hasta que exista un módulo de referencia real** (`modules/_example/`, ver sección "Módulo de Referencia" abajo) — no alcanza con la prosa de la spec, tiene que haber código andando que las fases siguientes copien como patrón.
3. `specs/fase-XX-<nombre>.md` — la spec puntual de la fase que se está trabajando

## Reglas no negociables (aplican siempre, sin repetir por fase)

### Idioma y nomenclatura
- **Código 100% en inglés.** Las specs nombran entidades y campos en español porque son para lectura de negocio (Micaela, el equipo) — son documentación funcional, no nombres de código. Traducir siempre al implementar: `ServicioPropiedad` → `PropertyService`, `honorarios_pct` → `feePercentage`, etc. Ante ambigüedad, usar el término que usaría un ingeniero real estate angloparlante, no traducción literal.
- `PascalCase` clases/componentes, `camelCase` variables/funciones/campos, `kebab-case` archivos, `snake_case` solo nombres de tabla en Postgres (Prisma mapea con `@@map`/`@map` en `schema.prisma`).
- Comentarios en código: español permitido solo si aclaran una regla de negocio local no obvia. Mensajes de error al usuario: español (es la app de Oppido). Nombres de código: siempre inglés.

### Multi-tenant — nunca me olvides de esto
- Toda entidad nueva lleva `tenant_id`. Todo repositorio extiende `TenantScopedRepository` (Fase 1) — cero queries manuales sin ese filtro.
- Nunca hardcodear nombres, textos o reglas de negocio específicas de Oppido. Lo que varía por tenant vive en la entidad `Tenant` o en datos.
- Todo test de módulo nuevo incluye al menos un caso de aislamiento entre tenants.

### Modularidad de código (modular monolith)
- Un módulo NUNCA importa entidades/repositorios/servicios internos de otro módulo. Solo su Facade público (`modules/X/public/`) o eventos del `EventBus`.
- Auth, PDFs, Notificaciones y Cron Jobs son candidatos a extracción temprana — regla aún más estricta ahí (ni lectura directa a otras tablas).
- El linter de import boundaries hace cumplir esto — si el linter lo permite pero viola el espíritu de la regla, igual está mal.

### Infraestructura desacoplada (Ports & Adapters)
- El dominio NUNCA importa un SDK de proveedor directo (nada de `import cloudinary` en un Domain Service). Siempre vía interfaz propia (`StoragePort`, `EmailPort`, `QueuePort`, `FeatureFlagPort`) con adapter concreto inyectado por config.
- Proveedores MVP: Cloudinary (storage), Resend vía Novu (email), pg-boss (queue, ya real desde el día 1 — no placeholder), Doppler (secrets), Flagsmith (feature flags).
- Destino futuro (no instalar todavía, solo dejar el código listo): S3, SES, SQS, AWS Secrets Manager, AWS AppConfig.

### CQRS y capas
- Controller solo valida DTO y despacha Command/Query — cero lógica de negocio ahí.
- Domain Service tiene las reglas de negocio puras, testeable sin mocks de infraestructura.
- Flujo: `Controller → CommandBus/QueryBus → Handler → Domain Service → Repository (TenantScoped) → Postgres`.

### Dinero
- Siempre `Decimal` (librería `decimal.js`), nunca `number`/`float`. Todo cálculo monetario pasa por `packages/shared-utils/money.ts`. Redondeo `ROUND_HALF_UP` a 2 decimales.

### Jobs asíncronos
- Acción manual pesada (reenvío masivo, regeneración de PDFs, reproceso de importación) → nunca síncrono en el request HTTP. Encolar en pg-boss, responder `202` con id de `AsyncJob`, frontend consulta `GET /jobs/:id/status` (endpoint genérico, no crear uno por módulo).

### Testing
- Domain Services de módulos financieros: 90% cobertura mínima, sin excepciones.
- Todo módulo nuevo con al menos un test de aislamiento multi-tenant.

## Módulo de Referencia (obligatorio antes de la Fase 4)

Al cerrar la Fase 1, además de la infraestructura (Prisma, pg-boss, Doppler, Flagsmith), debe quedar un módulo dummy completo en `modules/_example/` que implemente el patrón entero de punta a punta: una entidad simple, su Command + Handler, su Query + Handler, su Domain Service con una regla de negocio trivial, su Controller autenticado, su Facade público (`public/`), un test unit y uno e2e, y su documentación técnica/funcional. **Este módulo no se borra** — queda como referencia viva. Cuando una fase nueva tenga dudas de "¿así se ve un Handler acá?", la respuesta es "mirá `modules/_example/`", no "reinterpretá la prosa de la Fase 1".

## Qué hacer ante una ambigüedad técnica (no de negocio)

Distinto de `docs/CONSULTAS_PENDIENTES.md` (que es para dudas de negocio a responder por Micaela): si durante la implementación de una fase aparece una ambigüedad **técnica** que la spec no cubre y el Módulo de Referencia tampoco resuelve —

1. **No inventar en silencio.** Proponer la interpretación más simple y consistente con el resto del código ya escrito, dejarla anotada en `docs/DECISIONES_TECNICAS.md` (crear si no existe) con: qué ambigüedad había, qué se decidió, por qué.
2. **Avisar explícitamente en la respuesta al humano**, no solo en el archivo — una línea del tipo "Nota: la spec no especifica X, asumí Y por Z, revisar."
3. Si la ambigüedad es grande (afecta el schema, una regla de negocio, no solo un detalle de implementación) — **parar y preguntar antes de seguir**, no asumir y continuar.

## Checklist antes de abrir cada PR (autoaplicar, no esperar que se pida)

- [ ] Todos los tests de la fase pasan (`turbo test`)
- [ ] Lint y boundaries de módulos pasan (`turbo lint`)
- [ ] `docs/tecnica/fase-XX.md` y `docs/funcional/fase-XX.md` escritos
- [ ] Sección "Estado del Proyecto" de este archivo actualizada (marcar la fase como completada)
- [ ] Si hubo alguna ambigüedad técnica, quedó anotada en `docs/DECISIONES_TECNICAS.md`
- [ ] Ningún secreto/credencial hardcodeado en el código (todo vía Doppler)



0. **Chequear requisitos previos** — antes de leer la spec en profundidad, revisar la tabla de "Requisitos Previos por Fase" de abajo y avisar si falta algo por crear/decidir. No asumir que ya está resuelto.
1. **Spec ya existe** en `specs/fase-XX.md` — leerla completa antes de proponer plan. Si la fase depende de otras ya cerradas (la spec lo dice explícito en su línea "Depende de:"), leer también sus `docs/tecnica/fase-YY.md` correspondientes para no perder decisiones tomadas ahí.
2. **Plan de implementación** — antes de escribir código, mostrar el plan (archivos a tocar/crear, orden, decisiones de implementación) y esperar aprobación. El plan se desglosa en tasks concretas (ver Git Workflow abajo).
3. **Código, task por task** — implementar exactamente la spec, ni más ni menos. Una task = un commit (ver abajo).
4. **Tests** — unit para Domain Services, e2e para flujos críticos de la fase.
5. **Documentación** — al cerrar la fase, generar `docs/tecnica/fase-XX.md` y `docs/funcional/fase-XX.md` (quedan en el repo — no hace falta pegarlas en ningún lado; una sesión nueva las lee del repo si las necesita).
6. **PR de la fase** — al terminar todas las tasks de la fase, push de la rama y PR contra `dev` (ver Git Workflow). No mergear sin aprobación humana.
7. **Nunca pasar a la siguiente fase sin checkpoint humano y el PR de la actual creado.**

## Git Workflow

- **Una rama por fase:** `feature/fase-XX-<nombre-corto>`, creada desde `dev`.
- **Un commit por task.** Cada una de las subtareas del plan (entidad+migración, DTOs, handlers, domain service, controller, tests, front, docs) es un commit propio con mensaje Conventional Commits en inglés (`feat(properties): add Property entity and migration`). Esto permite hacer `git bisect` directo a la task que rompió algo, en vez de a toda la fase.
- **Pre-commit hook (Husky) bloquea el commit si:**
  - Lint o format fallan
  - **Los tests relevantes no pasan** — nunca commitear en rojo, esto se hace cumplir con el hook, no queda como instrucción a recordar
- **Al cerrar la fase:** push de la rama, abrir PR contra `dev` con la descripción generada a partir del plan de la fase (qué se implementó, qué decisiones se tomaron, qué quedó pendiente si algo). El PR queda esperando revisión humana — Claude Code no mergea por su cuenta.

## Estado del Proyecto (actualizar a mano o pedirle a Claude Code que lo actualice al cerrar cada fase)

> Mantener esta lista corta y al día es lo que le permite a una sesión nueva saber "dónde estamos" sin releer todo el historial de conversación. Ver `docs/tecnica/` para el detalle de cada fase cerrada.

- Fase 1 (Arquitectura): ⬜ no iniciada
- Fase 2 (Diseño): ⬜ no iniciada
- Fase 3 (Setup): ⬜ no iniciada
- Fase 4 (Auth): ⬜ no iniciada
- Fase 5 (Maestros): ⬜ no iniciada
- *(el resto de las fases se agregan a esta lista a medida que se planifican)*

## Requisitos Previos por Fase (avisar ANTES de empezar a trabajar una fase)

> Antes de arrancar el plan de cualquier fase, revisar esta lista y avisarme explícitamente qué cuenta/credencial/config necesito tener lista ANTES de que se pueda completar esa fase. Si falta algo, decirlo al principio, no a mitad de la implementación.

| Fase | Requiere tener creado/decidido ANTES |
|---|---|
| Fase 3 (Setup) | Cuenta **Doppler** (free tier) con proyecto creado. Cuenta **Flagsmith** (free tier) con proyecto creado. Docker instalado localmente. |
| Fase 5 (Maestros) | Nada nuevo — usa lo de Fase 3. |
| Fase 6 (Propiedades) | Cuenta **Cloudinary** (free tier) con cloud name/API key/API secret. |
| Fase 9 (Contratos) | Nada nuevo — reusa Cloudinary de Fase 6. |
| Fase 13 (Cron Jobs) | Decidir fuente real de índices ICL/IPC (ver consulta pendiente en la spec — API del BCRA sugerida). |
| Fase 14 (Notificaciones) | Cuenta **Resend** (free tier). Cuenta **Novu** (free tier). **Dominio de Oppido con acceso a su DNS** para configurar SPF/DKIM/DMARC — sin esto los emails van a spam. |
| Fase 16 (Despliegue MVP) | Cuenta **Neon** o **Supabase** (decidir cuál). Cuenta **Render** o **Railway** (decidir cuál). Cuenta **Vercel**. Acceso al DNS de Oppido (mismo de Fase 14). |
| Fase 21 (Migración ETL) | **API key de Tokko** de la cuenta real de Oppido (hoy el scraper usa una key pública de prueba). |
| Fase 23 (CRM) | App creada en **Mercado Libre Devcenter** (OAuth). Zonaprop/Argenprop requieren acuerdo comercial, no solo cuenta técnica — evaluar aparte. |
| Fase 24 (Tasación) | Nada nuevo si se reusa scraping ya construido; evaluar si necesita su propia infraestructura de workers más adelante. |



- No instalar SDKs de AWS todavía (no hay cuenta activa) — respetar los Ports con su adapter MVP.
- No mezclar idioma en nombres de código.
- No importar directo entre módulos saltándose el Facade.
- No usar `number` para dinero.
- No ejecutar más de una fase sin parar a mostrar avance y pedir checkpoint.
- No commitear si los tests fallan (esto ya lo bloquea el hook, pero tampoco intentar saltearlo con `--no-verify`).
- No mergear un PR de fase sin aprobación humana explícita.
