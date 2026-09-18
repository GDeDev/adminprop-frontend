# Adminprop – Índice de Fases de Desarrollo
## Versión detallada

---

> Cada fase produce un `.md` ejecutable escrito por un especialista del área. El objetivo es que cada documento sea lo suficientemente granular para que un dev lo ejecute sin tomar decisiones por su cuenta. Las decisiones de arquitectura, patrones, tecnologías y convenciones se definen una sola vez en la Fase 1 y se referencian desde todas las fases siguientes sin repetir.

---

## Metodología: Spec-Driven Development (SDD)

**Toda fase se ejecuta en 4 pasos, en este orden estricto:**

1. **SPEC** — Se escribe primero `spec.md`: contratos de API (endpoints, DTOs in/out), reglas de negocio, criterios de aceptación y casos borde. El código se deriva de la spec.
2. **CÓDIGO** — Se implementa exactamente la spec. Nada de más, nada de menos.
3. **VERIFICACIÓN** — Tests que validan los criterios de aceptación + prueba manual. Commit solo con tests verdes.
4. **DOCUMENTACIÓN** — Se entregan dos documentos por fase: `docs/tecnica/<fase>.md` (arquitectura, entidades, contratos de endpoints, decisiones — para devs) y `docs/funcional/<fase>.md` (qué hace en términos de negocio, reglas, flujos — para el equipo de Oppido y como base para un futuro agente de consulta sobre el software).

Ninguna fase se cierra sin sus tests, su verificación y sus dos documentos. En un sistema financiero, "casi listo" = no listo.

## Principios técnicos transversales (definidos en Fase 1, respetados en todas)

- **API siempre autenticada** — JWT + guard de rol en todo endpoint (salvo login/refresh y portal público explícito).
- **CQRS** — Commands (escritura) y Queries (lectura) separados vía `@nestjs/cqrs`. Cada caso de uso es un handler; el controller no lleva lógica.
- **Multi-tenant blindado** — interceptor global inyecta `tenant_id` en cada query; aislamiento total entre inmobiliarias.
- **Reusabilidad y abstracción** — repos genéricos, base entities, DTOs y utilidades en `packages/shared`, guards y decorators reutilizables. DRY real, código abstraíble.
- **Dinero sin float** — montos en enteros (centavos) o decimal de precisión fija. Definido en Fase 1.
- **Capas separadas** — controller → command/query handler → domain service → repository. El controller no toca la DB.
- **Validación en el borde** — DTOs con `class-validator`; nada entra al dominio sin validar.
- **Errores tipados** — filtro global de excepciones con shape de error estándar.
- **Auditoría transversal** — decorator/interceptor registra acciones sensibles sin ensuciar los handlers.
- **Cron idempotente** — un job que corre dos veces no duplica datos.

> Cada fase de módulo (4 en adelante) arranca con su spec y sigue las subtareas: spec → entidad+migración → DTOs+validación → command/query handlers (CQRS) → domain service → controller autenticado → tests → front (vertical slice) → prueba manual → **documentación técnica y funcional** → commit.

---

### Fase 0 — PRD ✅
Documento funcional completo del producto. Define qué se construye, para quién, con qué reglas de negocio y bajo qué restricciones. Es la fuente de verdad funcional a la que todas las fases técnicas hacen referencia.

---

### Fase 1 — Arquitectura Técnica
La biblia técnica del proyecto. Todo lo que se define acá no se vuelve a repetir en ninguna fase posterior, solo se referencia. Incluye: estructura del monorepo con Turborepo (apps, packages, shared), schema SQL completo con todas las tablas, campos, tipos, índices y relaciones (el archivo de migraciones real), decisiones de infraestructura, estrategia de autenticación (JWT, refresh tokens, estructura de claims, roles, guards de NestJS), patrones de backend (estructura de módulos NestJS, convenciones de naming, estructura de DTOs, manejo de errores, responses estándar, paginación), patrones de frontend (estructura de carpetas Next.js en ambas apps, convenciones de componentes, manejo de estado, cliente HTTP, manejo de errores globales), estrategia de variables de entorno por entorno (dev/staging/prod), y convenciones generales de código que aplican a todo el proyecto.

**Sección crítica — Estrategia Multi-Tenant:** esta fase define en profundidad el modelo multi-tenant que atraviesa todo el sistema. Modelo single-database / shared-schema con `tenant_id` en todas las tablas core. Middleware/interceptor global de NestJS que inyecta y filtra automáticamente el `tenant_id` en cada query a nivel de repositorio, de forma que sea imposible que una inmobiliaria acceda a datos de otra aunque exista un bug en un módulo. Resolución del tenant vía claim en el JWT del usuario logueado. Tabla `tenants` con la configuración propia de cada inmobiliaria (nombre, logo, colores de marca, y parámetros de negocio propios: % de honorarios, días de gracia, día de cobro, etc. — porque otra inmobiliaria puede tener reglas distintas a Oppido). Alta de nuevas inmobiliarias vía script de seed (sin ABM por ahora). El código nace multi-tenant desde el día uno: Oppido funciona perfecto y si entra otra inmobiliaria se inserta por base y opera sin tocar código. El ABM de tenants como proveedor de servicio queda fuera de alcance del MVP.

**Sección crítica — Patrones de calidad de código:** define y ejemplifica los patrones que todas las fases respetan. CQRS con `@nestjs/cqrs` (estructura de Commands, Queries y sus Handlers; el controller solo despacha). Arquitectura en capas (controller → handler → domain service → repository) con dependencias hacia adentro. Repositorios genéricos y base entities reutilizables. Paquete `packages/shared` para DTOs, tipos, validadores y utilidades compartidas entre apps. Guards, decorators e interceptors reutilizables (auth, roles, tenant, auditoría). Manejo de dinero: enteros en centavos o decimal de precisión fija, nunca float — se define acá la convención y los helpers de cálculo monetario que usarán punitorios, honorarios y liquidaciones. Filtro global de excepciones con shape de error estándar. Estrategia de tests (unit para lógica de negocio, e2e para flujos críticos). El objetivo es un producto de calidad productiva: reusable, abstraíble, testeable y mantenible.

---

### Fase 2 — Diseño de Pantallas
Descripción ejecutable de cada pantalla del sistema. Define qué muestra cada vista, qué acciones expone, qué componentes la componen y cómo se navega entre ellas. Incluye: flujos de navegación completos (backoffice, portal propietarios, portal inquilinos, portal público), jerarquía de componentes reutilizables, sistema de diseño aplicado (tokens de color, tipografía, espaciado, estados de componentes), y comportamiento responsive/mobile de cada pantalla. Lo suficientemente detallado para que el dev frontend no tome ninguna decisión visual por su cuenta.

---

### Fase 3 — Setup del Proyecto
Ejecución de la base técnica sobre la que se construye todo. Inicialización del monorepo Turborepo con las tres apps (api, backoffice, portal), configuración base de NestJS con módulos compartidos, configuración base de Next.js en ambas apps de frontend, **PostgreSQL local vía Docker (cero costo, cero dependencia de terceros para desarrollar)**, **Prisma** con la primera migración del schema completo, configuración de Cloudinary, setup de variables de entorno, configuración de ESLint/Prettier/Husky, y pipeline básico de CI/CD. Al final de esta fase el proyecto compila, conecta a la base de datos local y tiene el schema aplicado. El despliegue a la nube no ocurre acá — se hace en la Fase de Despliegue una vez que hay MVP.

---

### Fase 4 — Auth y Usuarios
Sistema de autenticación y control de acceso completo. JWT con refresh tokens, estrategia de roles (admin, empleado, propietario, inquilino), guards de NestJS por rol, middleware que inyecta tenant_id en cada request, endpoints de login/logout/refresh, gestión de usuarios internos (crear empleado, cambiar contraseña, desactivar), y los guards reutilizables que todas las fases siguientes usan para proteger sus endpoints.

---

### Fase 5 — Maestros
Módulo de tablas de referencia, base de datos limpia para todo lo que viene después. CRUD de ubicaciones jerárquicas (país/provincia/localidad/barrio con estructura auto-referenciada), CRUD de tipos de propiedad, amenities, tipos de operación y tipos de servicio, todos con borrado lógico (activo/inactivo) para no romper referencias históricas. Esta fase es bloqueante de Propiedades y Contratos porque ambas dependen de los maestros. Se ejecuta después de Auth y puede correr en paralelo con nada (es prerrequisito de la mayoría).

---

### Fase 6 — Propiedades
Módulo completo de gestión de propiedades. CRUD de propiedades con todas las validaciones, vinculación a maestros (ubicación, tipo, amenities), upload de fotos a Cloudinary (múltiples imágenes, orden, eliminación), gestión de estados (disponible/alquilada/en mantenimiento) con transiciones controladas, filtros y búsqueda, y los endpoints que las fases siguientes necesitan para vincular propiedades a contratos.

---

### Fase 7 — Propietarios
Módulo completo de gestión de propietarios. CRUD con validación de DNI único por tenant, gestión de datos bancarios (CBU/alias), lógica de conteo de propiedades activas para determinar el porcentaje de honorario aplicable (5% o 3%), y creación de credenciales para el portal de autogestión.

---

### Fase 8 — Inquilinos y Garantes
Módulo completo de inquilinos y garantes. CRUD de inquilinos, CRUD de garantes, vinculación entre ambas entidades, tipos de garantía (propiedad o recibos de sueldo), y creación de credenciales para el portal de autogestión.

---

### Fase 9 — Contratos
El módulo más complejo del sistema. Creación de contratos con todas las validaciones (una propiedad activa por contrato, un inquilino por contrato), upload del PDF escaneado a Cloudinary, upload y gestión de la póliza de caución (6 campos), lógica de actualización del canon por índice (ICL/IPC/Fijo) según frecuencia definida, cálculo y registro de rescisión anticipada (multa del 10% del saldo futuro), flujo de renovación de contratos, y gestión de estados del contrato.

> ⚠️ **Confirmar con Micaela ANTES de esta fase:** ¿el depósito de garantía se actualiza junto con los aumentos del canon o queda fijo al monto inicial del contrato? Afecta el cálculo que se guarda en el contrato y su devolución al finalizar.

---

### Fase 10 — Servicios Asociados
Gestión de servicios vinculados a cada propiedad/contrato. CRUD de servicios con configuración individual (quién paga, moneda, vencimiento, aumento, gestión desde inmobiliaria), registro de gastos adelantados por inquilino con upload de comprobante, y la lógica de descuento automático de esos gastos en la liquidación del propietario.

---

### Fase 11 — Motor de Cobros y Punitorios
El corazón financiero del sistema. Generación de cuotas mensuales (estructura de la cuota, estado inicial), pantalla de cobros del mes, registro de cobros con validación de pago total (sin parciales), upload de comprobante a Cloudinary, motor de cálculo de punitorios (5% diario desde el día 11), lógica de bloqueo del pago base sin cobertura total de punitorios, y los estados de pago (pendiente/pagado/con mora/vencido).

> ⚠️ **Confirmar con Micaela ANTES de esta fase — bloqueante real, no arrancar sin esto:**
> - **CA-01:** ¿el sistema guarda un log diario de cada punitorio generado (tabla `punitorio_log`) o solo el total acumulado en el momento del cobro? Define el schema de esta fase.
> - **Base de cálculo del punitorio:** el PRD dice "5% diario sobre el monto TOTAL del alquiler" (RN-02) — confirmar con un ejemplo numérico concreto (ej: "canon $200.000, atraso de 5 días, ¿el punitorio se calcula sobre los $200.000 completos cada día, o sobre el saldo pendiente?"). Cambia el monto final drásticamente.
> - **Moneda USD:** si un contrato está en dólares, ¿cómo se cobra? ¿A qué cotización (oficial/MEP/blue) y de qué fuente?
> - **Saldo a favor:** ¿se permite que un inquilino pague de más o adelante un mes? ¿Cómo se registra ese excedente?

---

### Fase 12 — Liquidaciones
Generación y gestión de liquidaciones a propietarios. Cálculo automático al registrar un cobro (canon − honorarios − gastos adelantados), aplicación de la regla de honorario reducido evaluada en el momento del cálculo, estados de la liquidación (pendiente/transferida/confirmada), registro del comprobante de transferencia al propietario, e historial de liquidaciones por propietario. (La liquidación consolidada se implementa una vez resuelta la CA-02.)

> ⚠️ **Confirmar con Micaela ANTES de esta fase:**
> - **CA-02:** ¿existe liquidación consolidada por propietario además de la individual por propiedad? Si existe: ¿automática o manual? ¿un PDF o dos?
> - **Base de honorarios:** ¿el 5%/3% se calcula sobre el canon base, o sobre canon + punitorios cobrados ese mes?

---

### Fase 13 — Cron Jobs y Workers
Todas las tareas automáticas del sistema que corren en background. Generación automática de cuotas el día 28 de cada mes, cálculo y acumulación diaria de punitorios para pagos vencidos, integración con la fuente oficial para actualización de índices ICL/IPC (a definir fuente estable — preferentemente API/dato oficial del BCRA para ICL antes que scraping frágil), control diario de vencimiento de pólizas de caución (alerta 30 días antes y badge de vencida), y el job de marcado de contratos próximos a vencer. **Nota de arquitectura:** con una sola instancia de API, los cron corren dentro del mismo proceso vía `@nestjs/schedule`, sin infra adicional. Si en el futuro se escala a múltiples instancias, habrá que mover a un sistema de lock distribuido o worker dedicado para evitar ejecución duplicada.

---

### Fase 14 — Notificaciones y Mailing (Novu + Resend)
Sistema completo de comunicaciones automáticas y notificaciones, construido sobre **Novu** como capa de orquestación con **Resend** como proveedor de envío de email. Novu maneja las plantillas, los triggers, el multi-canal (email ahora, in-app cuando se necesite, extensible a SMS/push a futuro) y las preferencias de notificación; Resend ejecuta el envío real del correo. Se puede integrar y probar desde local desde el inicio. Incluye: configuración de Novu + integración del provider Resend, definición de workflows para cada trigger del PRD (recordatorio de pago día 1, aviso de mora día 11, vencimiento de contrato 60 días antes, servicio vencido día 5, alerta a aseguradora, envío de liquidación), plantillas de cada notificación, notificaciones in-app para el backoffice (campana de avisos), integración con WhatsApp vía deep links `wa.me` con texto pre-cargado (sin API de Meta, abre el WhatsApp del empleado), y registro de cada envío en el log de auditoría. **Dependencia externa real:** dominio propio de Oppido con SPF/DKIM/DMARC configurados en su DNS para que los mails no caigan en spam — único bloqueante de terceros de esta fase.

---

### Fase 15 — Generación de PDFs
Sistema de generación de documentos PDF. Plantilla y lógica de generación para cada PDF del sistema: liquidación por propiedad (PDF-01), recibo de pago de alquiler (PDF-03), informe mensual al propietario (PDF-04), y cálculo de rescisión anticipada (PDF-05). Almacenamiento automático en Cloudinary y vinculación al registro correspondiente en base de datos. El contenido y diseño de cada plantilla se define según el Anexo A del PRD.

---

### Fase 16 — Despliegue MVP
Primer despliegue a la nube, una vez que el núcleo del sistema está funcional de punta a punta (auth, maestros, propiedades, propietarios, inquilinos, contratos, cobros, liquidaciones, cron, mailing y PDFs). Objetivo: que Micaela y el equipo de Oppido puedan usar el sistema con datos reales. Incluye: aprovisionamiento de la base de datos gestionada gratuita (**Neon** o **Supabase** Postgres), despliegue de la API (**Render** o **Railway** en free tier), despliegue del frontend backoffice (**Vercel** / Cloudflare Pages), configuración de variables de entorno de producción, migración del schema a la DB de la nube, configuración del dominio de Oppido y registros DNS (SPF/DKIM/DMARC para Resend), conexión de Cloudinary de producción, y verificación del cron corriendo en la instancia desplegada. Esta fase no agrega funcionalidad; lleva lo construido a un entorno accesible. Producción de mayor escala (DigitalOcean) queda como evolución futura si el free tier se queda corto.

---

### Fase 17 — Portal de Propietarios
Frontend del portal de autogestión para propietarios. Login con credenciales generadas desde el backoffice, vista de mis propiedades con estado de cada una, estado de cuenta del mes actual, historial de liquidaciones con descarga de PDF, historial de pagos mes a mes por propiedad, y datos de contacto de la inmobiliaria.

---

### Fase 18 — Portal de Inquilinos
Frontend del portal de autogestión para inquilinos. Login con credenciales generadas desde el backoffice, estado de cuenta del mes (monto base + punitorios desglosados), historial de pagos con descarga de comprobantes, datos del contrato vigente, y datos de contacto de la inmobiliaria con botón de WhatsApp directo.

---

### Fase 19 — Estadísticas y Reportes
Módulo de analytics e inteligencia del negocio. Dashboard principal con resumen del mes, todos los reportes financieros (ingresos, honorarios, alquileres pagados/vencidos, punitorios), reportes operativos (propiedades por estado, contratos por vencer, servicios pendientes), reportes por propietario e inquilino, y exportación de cada reporte a XLSX y PDF.

---

### Fase 20 — Auditoría y Trazabilidad
Sistema de registro inmutable de acciones. Implementación del log de auditoría (quién, qué, sobre qué, cuándo, estado anterior y nuevo), cobertura de todos los eventos definidos en el PRD, pantalla de auditoría con filtros accesible solo para el rol admin, y garantía de que ningún registro puede ser editado ni eliminado.

---

### Fase 21 — Migración de Datos (ETL)
Herramienta de onboarding para la carga inicial. Importador desde Tokko Broker vía API (extracción con el scraper, mapeo de diccionarios a los Maestros, carga de propiedades), importador masivo desde Excel (template descargable, validación por fila, vista previa antes de confirmar, reporte de errores), y migración de assets (descarga desde URLs externas y resubida a Cloudinary). Depende de Maestros, Propiedades, Propietarios, Inquilinos y Contratos para poder mapear los datos importados.

---

### Fase 22 — Portal Público
Sitio web público de la inmobiliaria (sin foco SEO por ahora). Next.js con listado de propiedades disponibles con filtros (usando los Maestros de ubicación y tipo), ficha pública de cada propiedad (fotos, descripción, precio, características), formulario de contacto que alimenta el CRM, y publicación/despublicación automática según el estado de la propiedad en el backoffice. La optimización SEO (SSR/SSG avanzado, metadatos, sitemap) queda fuera de alcance en esta instancia y se retoma si el negocio lo requiere.

---

### Fase 23 — CRM y Multipublicación
Módulo comercial del sistema, al final del roadmap. Pipeline Kanban de consultas con sus estados y transiciones, integración de consultas entrantes desde el portal público, integración con WhatsApp para respuesta desde el CRM, configuración y publicación en portales externos (Zonaprop, Argenprop, Mercado Libre), y analítica de rendimiento por propiedad (vistas y consultas). **Bloqueante de terceros:** Zonaprop/Argenprop no tienen API pública abierta (requieren acuerdo comercial / feed XML); Mercado Libre sí (OAuth 2.0, app en devcenter). Se evalúa al momento de encarar la fase.

---

*Total: 23 fases + PRD. Secuencia recomendada: Fases 1→2→3→4→5 en orden estricto (5 es prerrequisito de casi todo). Fases 6, 7 y 8 paralelas entre sí una vez completada la Fase 5. Fase 9 requiere 6+7+8. Fases 10 a 15 secuenciales (núcleo financiero + comunicaciones + PDFs). Fase 16 (Despliegue MVP) lleva todo lo anterior a la nube para uso real de Oppido. Fases 17-20 suman portales externos, reportes y auditoría. Fase 21 (ETL) requiere los módulos core listos. Fases 22 y 23 al final.*

---

*Total: 22 fases + PRD. Secuencia recomendada: Fases 1→2→3→4→5 en orden estricto (5 es prerrequisito de casi todo). Fases 6, 7 y 8 paralelas entre sí una vez completada la Fase 5. Fase 9 requiere 6+7+8. Fases 10 en adelante secuenciales. Fase 20 (ETL) requiere que los módulos core estén listos. Fases 21 y 22 al final.*
