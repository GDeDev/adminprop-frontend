# Adminprop – Integraciones Futuras con Terceros

> Documento para validar con Oppido (primera inmobiliaria) qué integraciones tienen sentido priorizar. Ninguna de estas es parte del MVP actual (Fases 1-23) — son evolución posterior. Cada una tiene su viabilidad técnica evaluada y, donde no pude confirmar datos concretos, queda marcado como pendiente de verificar en vez de asumido.

---

## 1. Las que ya propusiste

### 1.1 BCRA — Índices ICL / IPC
**Qué resuelve:** fuente oficial y estable para actualizar automáticamente el índice de aumento de los contratos (reemplaza el scraping frágil a ARQUILER mencionado originalmente en el PRD).
**Viabilidad:** el BCRA publica el ICL a través de su API de Estadísticas (`api.bcra.gob.ar`), de acceso público y gratuito. El IPC lo publica INDEC, también con datos abiertos.
**Prioridad sugerida:** Alta — reemplaza directamente el punto débil ya identificado en Fase 13 (fuente de índices). Es la integración más segura de las cinco porque es un organismo oficial con datos abiertos, sin costo ni aprobación comercial de por medio.

### 1.2 Mercado Libre Inmuebles
**Qué resuelve:** publicación automática de propiedades disponibles en el portal de mayor tráfico de clasificados de Argentina.
**Viabilidad:** API pública con autenticación OAuth 2.0, documentada, de uso extendido. Ya contemplada en Fase 23 del roadmap.
**Prioridad sugerida:** Alta — es la más viable técnicamente de los tres portales que mencionaste.

### 1.3 Zonaprop
**Qué resuelve:** publicación automática en el portal líder de real estate en Argentina.
**Viabilidad:** **no tiene API pública abierta.** La integración típica es vía feed XML acordado comercialmente con Navent (la empresa dueña de Zonaprop), lo que implica gestión comercial previa, no solo desarrollo. Ya marcado como bloqueante en Fase 23.
**Prioridad sugerida:** Media — alto impacto de negocio, pero depende de una negociación externa que no controlás vos.

### 1.4 Firmato — firma digital de contratos
**⚠️ No pude confirmar datos específicos de un producto llamado exactamente "Firmato".** Puede que el nombre sea otro o que sea muy nuevo/poco indexado. Lo que sí confirmé es que el ecosistema argentino de firma digital remota tiene varias opciones reales y con validez legal (Ley 25.506):
- **Lakaut / FID (Firma Instantánea Digital):** Autoridad Certificante licenciada, solución 100% remota, con plan gratuito inicial (5 firmas) y planes pagos. Explícitamente pensada para "operaciones inmobiliarias" según su propia comunicación.
- **TuFirma.Digital:** SaaS de firma electrónica y validación de identidad, permite firmar por web, presencial o WhatsApp.
- **Plataforma de Firma Digital Remota (PFDR)** del Estado argentino: gratuita, pero requiere trámite presencial inicial para obtener el certificado (no 100% remota de punta a punta).
**Qué resuelve (cualquiera de estas):** firmar el contrato de alquiler digitalmente en vez de imprimir/escanear, acortando el proceso de Fase 9.
**Prioridad sugerida:** Media-Alta si el volumen de contratos nuevos es alto — el ahorro operativo es real. **Acción:** confirmar con Micaela el nombre exacto del proveedor que tenía en mente, para evaluar su API puntual.

### 1.5 Didit — verificación de identidad (KYC)
**Qué resuelve:** escaneo y validación automática de DNI de inquilinos/garantes al momento de la carga (Fase 8), en vez de guardar solo una foto del documento sin verificar.
**Viabilidad:** confirmado — Didit es una API real de identidad y verificación (KYC), con OCR + validación de autenticidad de documento + detección de vida (liveness) + verificación biométrica. Cubre 220+ países, tiene 500 verificaciones gratuitas por mes y después es de pago por uso (sin mínimos ni contrato anual). Tiene SDKs y documentación abierta.
**Prioridad sugerida:** Media — da valor real (reduce fraude de identidad en altas de inquilinos/garantes) pero no es un problema urgente hoy; conviene evaluarlo si empieza a haber casos de identidad falsa o de necesidad de mayor compliance.

---

## 2. Otras integraciones y consideraciones regulatorias que pueden servir

### 2.1 AFIP / ARCA — Facturación de honorarios
Si la inmobiliaria factura formalmente sus honorarios de administración (no solo los descuenta internamente), integrar con el servicio de facturación electrónica de AFIP (ahora ARCA) permite emitir la factura de honorarios automáticamente al generar cada liquidación. Existen librerías y servicios intermedios ya armados para esto en el ecosistema argentino (ej. iFactura, entre otros).
**Prioridad sugerida:** Alta si Oppido factura formalmente sus comisiones — elimina un paso manual repetitivo mensual.

### 2.2 Veraz / Nosis — Verificación crediticia de inquilinos y garantes
Servicios de informe crediticio (situación en BCRA, deudas, juicios) muy usados en el proceso de aprobación de un inquilino/garante antes de firmar un contrato. Podría integrarse en el flujo de alta de Inquilino/Garante (Fase 8) como un paso opcional de verificación previa a aprobar el contrato.
**Prioridad sugerida:** Media-Alta — es una práctica estándar del rubro inmobiliario argentino y agregaría valor real al proceso de aprobación de contratos.

### 2.3 MercadoPago / integraciones de cobro digital
Hoy el PRD contempla cobro por transferencia con comprobante manual. A futuro, ofrecer un link de pago (MercadoPago u otro) para que el inquilino pague directo desde el portal de autogestión (Fase 18) simplificaría la cobranza y reduciría la carga operativa de conciliar comprobantes a mano.
**Prioridad sugerida:** Alta a mediano plazo — impacta directo en la experiencia de cobro, que es el corazón del sistema.

### 2.4 Renabap / Registro de la Propiedad — validación de titularidad
Para prevenir fraude en la carga de propiedades (que quien se presenta como propietario efectivamente lo sea), existen registros públicos provinciales que permiten validar titularidad de un inmueble. La integración varía mucho por jurisdicción (CABA vs. Provincia de Buenos Aires tienen sistemas distintos) y no siempre tiene API — a veces es solo consulta manual.
**Prioridad sugerida:** Baja — valioso pero de integración compleja y heterogénea por jurisdicción, no es un bloqueante hoy.

### 2.5 Normativa de Alquileres (Ley de Alquileres vigente)
No es una integración técnica sino una consideración regulatoria: la ley de locaciones urbanas argentina define reglas sobre índices de actualización permitidos, depósitos, plazos mínimos de contrato, y las multas por rescisión anticipada (que ya están contempladas en el PRD, RN-09). Conviene que el sistema, al momento de crear un contrato (Fase 9), valide que las condiciones cargadas (plazo, tipo de actualización) sean compatibles con la normativa vigente al momento — esto cambia si la ley se modifica, así que conviene que estos valores (plazo mínimo, índices permitidos) sean configurables por tenant y no hardcodeados, para poder ajustarlos sin tocar código si la ley cambia.
**Prioridad sugerida:** Alta como validación de datos (no como integración externa) — evita que se carguen contratos con condiciones inválidas.

### 2.6 Google Maps / geocoding
Para georreferenciar automáticamente cada propiedad a partir de su dirección (Fase 6), y así poder mostrar un mapa en el portal público (Fase 22) o calcular proximidad a servicios/transporte como dato de venta. Google Maps Platform tiene API de geocoding con capa gratuita generosa.
**Prioridad sugerida:** Media — mejora la experiencia del portal público pero no es crítico para el corazón del negocio.

### 2.7 Auditoría de entrega/apertura de emails — YA RESUELTO, no requiere terceros nuevos
**Confirmado:** Resend (el proveedor ya elegido en Fase 14) tiene webhooks propios (`email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, firmados con Svix) — no hace falta migrar a Mailgun ni sumar otro proveedor. Ya especificado en `specs/fase-14-notificaciones.md`, sección 3.1, con la entidad `EmailEvent` que guarda el historial completo como auditoría.

### 2.8 Tasación Automática de Alquiler
**Ya especificado como módulo nuevo:** `specs/fase-24-tasacion-automatica.md`. Enfoque de dos etapas: scraping periódico de comparables (Zonaprop/Argenprop/MercadoLibre) + un agente de IA que pondera esos comparables y sugiere un rango de precio con justificación. Marcado como prioridad post-MVP por su dependencia de scraping continuo (mismo riesgo de mantenimiento que el scraper de Tokko).
**Prioridad sugerida:** 🟡 Media — alto valor pero no bloqueante, y de mantenimiento continuo.

### 2.9 Registro de Inventario del Inmueble
**Ya especificado como extensión de Contratos:** `specs/fase-25-inventario-inmueble.md`. Checklist fotografiado en entrega y devolución, con vista comparativa automática para resolver disputas de depósito.
**Prioridad sugerida:** 🔴 Alta — bajo costo de desarrollo, resuelve un problema real y frecuente del rubro (disputas de depósito).

---

## 3. Resumen de Prioridades Sugeridas

| Integración | Prioridad | Depende de |
|---|---|---|
| BCRA (índices ICL/IPC) | 🔴 Alta | Solo desarrollo |
| Mercado Libre | 🔴 Alta | Solo desarrollo |
| Facturación AFIP/ARCA | 🔴 Alta | Confirmar si Oppido factura formalmente |
| MercadoPago (cobro digital) | 🔴 Alta (mediano plazo) | Solo desarrollo |
| Validación normativa de alquileres | 🔴 Alta | Solo desarrollo (como reglas configurables) |
| Firma digital (Firmato u otro) | 🟡 Media-Alta | Confirmar proveedor exacto con Micaela |
| Veraz/Nosis (informe crediticio) | 🟡 Media-Alta | Evaluar costo por consulta |
| Didit (verificación de identidad) | 🟡 Media | Solo desarrollo, evaluar necesidad real |
| Google Maps/geocoding | 🟡 Media | Solo desarrollo |
| Registro de Inventario del Inmueble | 🔴 Alta | Solo desarrollo, ya especificado (Fase 25) |
| Tasación Automática de Alquiler | 🟡 Media | Solo desarrollo, ya especificado (Fase 24), mantenimiento continuo |
| Auditoría de apertura/entrega de emails | ✅ Resuelto | Ya cubierto por webhooks de Resend (Fase 14) |
| Zonaprop | 🟡 Media | Gestión comercial con Navent |
| Registro de Propiedad (titularidad) | 🟢 Baja | Heterogéneo por jurisdicción |

---

*Recomendación: llevar esta tabla a la conversación con Micaela como primera inmobiliaria piloto — su feedback sobre cuáles de estas usa hoy manualmente (o le encantaría dejar de hacer a mano) es la mejor señal para priorizar el roadmap post-MVP.*
