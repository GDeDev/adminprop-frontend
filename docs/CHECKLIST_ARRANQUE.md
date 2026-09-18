# Adminprop – Checklist Maestro de Arranque

> Documento vivo para ir marcando. Marcá con `[x]` lo completado.
> Objetivo: llegar al viernes con el máximo terreno ganado y sentarte a codear con todo saliendo solo.

---

## 🎯 Metodología: Spec-Driven Development (SDD)

Cada fase se ejecuta en 4 pasos, siempre en este orden:

1. **SPEC** — Antes de codear, se escribe `spec.md` de la fase: contratos de API (endpoints, DTOs de entrada/salida), reglas de negocio, criterios de aceptación, casos borde. El código se deriva de la spec, no al revés.
2. **CÓDIGO** — Se implementa exactamente lo que dice la spec. Nada que no esté en la spec; nada de la spec queda sin implementar.
3. **VERIFICACIÓN** — Tests que validan los criterios de aceptación de la spec + prueba manual con Micaela. Commit solo cuando pasa.
4. **DOCUMENTACIÓN** — Al cerrar la fase, Claude Code entrega dos documentos:
   - `docs/tecnica/<fase>.md` — arquitectura del módulo: entidades, endpoints y contratos, decisiones tomadas, dependencias. Para devs.
   - `docs/funcional/<fase>.md` — qué hace en términos de negocio: reglas, flujos, quién lo usa. Para Micaela y para alimentar a futuro un agente de soporte/consulta sobre el software.

**Regla de oro:** ninguna fase se da por terminada sin sus tests verdes, la prueba manual OK, y sus dos documentos escritos. En un sistema financiero, un módulo "casi listo" es un módulo no listo.

---

## 🏛️ Principios técnicos transversales (aplican a TODAS las fases)

Estos principios se definen en la Fase 1 y se respetan en cada fase siguiente:

- [ ] **API autenticada siempre** — todo endpoint pasa por guard de JWT + rol, salvo login/refresh y portal público explícito.
- [ ] **CQRS** — separación de Commands (escritura) y Queries (lectura). En NestJS con `@nestjs/cqrs`: cada caso de uso es un Command o Query handler, no lógica en el controller.
- [ ] **Multi-tenant blindado** — interceptor global que inyecta `tenant_id` en cada query. Imposible cruzar datos entre inmobiliarias.
- [ ] **Reusabilidad y abstracción** — repositorios genéricos, base entities, DTOs compartidos en `packages/shared`, guards y decorators reutilizables. DRY real.
- [ ] **Manejo de dinero correcto** — montos en enteros (centavos) o `decimal` con precisión fija. NUNCA float. Definir en Fase 1.
- [ ] **Validación en el borde** — DTOs con `class-validator`. Nada entra al dominio sin validarse.
- [ ] **Errores tipados y consistentes** — filtro global de excepciones, responses de error con shape estándar.
- [ ] **Separación de capas** — controller → command/query handler → domain service → repository. El controller no sabe de DB.
- [ ] **Tests por fase** — unit para lógica de negocio (punitorios, honorarios, liquidaciones), e2e para flujos críticos.
- [ ] **Auditoría transversal** — decorator/interceptor que registra acciones sensibles sin ensuciar cada handler.
- [ ] **Idempotencia en cron jobs** — un job que corre dos veces no duplica cuotas ni punitorios.

---

## 📋 PRE-VIERNES — Definiciones de Micaela (bloqueantes)

> Sin estas respuestas, el código financiero se traba. Sacarlas apenas se pueda.

### Bloquean schema / lógica
- [ ] **CA-01** — Punitorios: ¿log diario (tabla aparte) o solo total acumulado en el pago?
- [ ] **CA-02** — Liquidación consolidada: ¿existe? ¿automática o manual? ¿un PDF o dos (individual + consolidada)?
- [ ] **Punitorio** — ¿5% diario sobre el TOTAL del alquiler o sobre el SALDO adeudado? (pedir ejemplo numérico concreto)
- [ ] **Moneda USD** — contratos en dólares: ¿cómo se cobran? ¿al cambio del día? ¿qué cotización (oficial/MEP/otra)?
- [ ] **Honorarios** — ¿se calculan sobre el canon base o sobre canon + punitorios cobrados?
- [ ] **Depósito de garantía** — ¿se actualiza con los aumentos del canon o queda fijo al monto inicial?
- [ ] **Saldo a favor** — ¿se permite que un inquilino pague a cuenta / quede saldo a favor?

### Aprobación general
- [ ] **PRD aprobado** por Micaela (documento completo)
- [ ] **Anexo A** — contenido y diseño de cada PDF (PDF-01 a PDF-05). Necesario para Fase 15, no para arrancar.

---

## 📋 PRE-VIERNES — Cosas que puedo adelantar YO (sin depender de nadie)

### Datos de Tokko (hacer YA)
- [ ] Correr `tokko_scraper_v2.js` con la **key de prueba** (ya incluida) → validar que anda
- [ ] Revisar `properties_schema_inferred.json` → ver campos reales de propiedades
- [ ] Conseguir la **API key real de Oppido** (pedir a Micaela)
- [ ] Correr el scraper con la key de Oppido → datos reales para el seed
- [ ] Pasar los JSON a Claude para afinar el schema de Adminprop a los datos reales

### Documentación / Specs (hacer antes del viernes)
- [ ] **Fase 1 — Arquitectura Técnica completa** (la escribe Claude vía chat, ANTES del viernes — es trabajo de escritorio, no necesita a Micaela presente). LA prioridad, destraba todo lo demás.
- [ ] Escribir specs de **Fase 3 (Setup)**, **Fase 4 (Auth)**, **Fase 5 (Maestros)** si da el tiempo
- [ ] Definir en Fase 1: manejo de dinero, estructura CQRS, convención de specs SDD, convención de documentación técnica/funcional

### Infraestructura / Cuentas
- [ ] Crear cuenta **Cloudinary** → guardar cloud name, API key, API secret
- [ ] Confirmar dónde está hosteado el **dominio de Oppido** y conseguir acceso al **DNS**
- [ ] (Opcional) Crear cuenta **Resend** y **Novu** para tenerlas listas (se usan en Fase 14)

### Diseño
- [ ] Pedir a Micaela su **identidad de marca** (logo + colores oficiales) — mañana
- [ ] Con la identidad en mano, lanzar **Bloque 1 de Claude Design** (sistema + dashboard + listado + ficha propiedad)
- [ ] Validar dirección visual del Bloque 1 con Micaela

---

## 📋 VIERNES — Orden de arranque (4 carriles en paralelo)

### Primeros 30 minutos
- [ ] Sentarse con Micaela y cerrar las definiciones críticas del checklist de arriba

### Carril 1 — Diseño (corre solo en background)
- [ ] Lanzar Claude Design Bloque 1 con identidad de marca
- [ ] Revisar y aprobar con Micaela cuando vuelva

### Carril 2 — Datos Tokko (ya extraídos idealmente)
- [ ] Enchufar maestros reales (ubicaciones, tipos, amenities) en el seed

### Carril 3 — Código base (el principal, atención plena)
- [ ] Ejecutar **Fase 3 — Setup** (monorepo, Docker Postgres, schema, migración)
- [ ] Ejecutar **Fase 4 — Auth** (JWT, roles, guards, tenant interceptor)
- [ ] Ejecutar **Fase 5 — Maestros** (+ enchufar datos de Tokko)
- [ ] Primer vertical slice: **Fase 6 — Propiedades** back+front
- [ ] Micaela carga una propiedad real y la ve → primer "wow", iterar

### Carril 4 — Definiciones (todo el día con Micaela al lado)
- [ ] Ir sacando respuestas del checklist que falten y desbloqueando código

---

## 📋 EJECUCIÓN DE FASES — Cómo correr cada una

**Regla de ejecución:** 1 fase a la vez, dividida en subtareas, con checkpoint humano + commit entre fases. NO correr todo de corrido hasta quedarse sin tokens.

**Vertical slices:** desde Fase 6 en adelante, cada fase entrega back + front juntos, para que Micaela pruebe en el momento. Fases 1-5 son back/infra (cimientos), ahí es back-first.

Subtareas típicas de una fase de módulo (ej. Propiedades):
1. [ ] Spec de la fase (contratos, reglas, criterios de aceptación)
2. [ ] Entidad + migración
3. [ ] DTOs + validaciones
4. [ ] Command/Query handlers (CQRS)
5. [ ] Domain service (reglas de negocio)
6. [ ] Controller (endpoints autenticados)
7. [ ] Tests (unit + e2e de lo crítico)
8. [ ] Front del módulo (vertical slice)
9. [ ] Prueba manual con Micaela
10. [ ] Documentación técnica (`docs/tecnica/<fase>.md`)
11. [ ] Documentación funcional (`docs/funcional/<fase>.md`)
12. [ ] Commit + checkpoint

---

## 📋 ORDEN DE FASES (referencia rápida)

Cimientos (secuencial estricto):
- [ ] Fase 1 — Arquitectura Técnica
- [ ] Fase 2 — Diseño de Pantallas
- [ ] Fase 3 — Setup del Proyecto
- [ ] Fase 4 — Auth y Usuarios
- [ ] Fase 5 — Maestros

Módulos core (6-8 paralelos entre sí tras Fase 5):
- [ ] Fase 6 — Propiedades
- [ ] Fase 7 — Propietarios
- [ ] Fase 8 — Inquilinos y Garantes
- [ ] Fase 9 — Contratos (requiere 6+7+8)

Financiero (secuencial):
- [ ] Fase 10 — Servicios Asociados
- [ ] Fase 11 — Motor de Cobros y Punitorios
- [ ] Fase 12 — Liquidaciones
- [ ] Fase 13 — Cron Jobs y Workers
- [ ] Fase 14 — Notificaciones y Mailing (Novu + Resend)
- [ ] Fase 15 — Generación de PDFs

Despliegue y resto:
- [ ] Fase 16 — Despliegue MVP
- [ ] Fase 17 — Portal de Propietarios
- [ ] Fase 18 — Portal de Inquilinos
- [ ] Fase 19 — Estadísticas y Reportes
- [ ] Fase 20 — Auditoría y Trazabilidad
- [ ] Fase 21 — Migración de Datos (ETL)
- [ ] Fase 22 — Portal Público
- [ ] Fase 23 — CRM y Multipublicación
