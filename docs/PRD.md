# PRD – Adminprop
## Sistema Multi-Tenant de Gestión Inmobiliaria
### Oppido Propiedades

---

**Versión:** 1.0  
**Fecha:** Junio 2026  
**Responsable funcional:** Micaela Oppido  
**Responsable técnico:** Giuliano Damico  
**Estado:** Pendiente de aprobación

---

## Índice

1. [Visión General del Producto](#1-visión-general-del-producto)
2. [Usuarios del Sistema](#2-usuarios-del-sistema)
3. [Arquitectura e Infraestructura](#3-arquitectura-e-infraestructura)
4. [Guía de Estilo y UI/UX](#4-guía-de-estilo-y-uiux)
5. [Entidades del Sistema](#5-entidades-del-sistema)
6. [Módulo A – Gestión de Propiedades](#6-módulo-a--gestión-de-propiedades)
7. [Módulo B – Gestión de Propietarios](#7-módulo-b--gestión-de-propietarios)
8. [Módulo C – Gestión de Inquilinos y Garantes](#8-módulo-c--gestión-de-inquilinos-y-garantes)
9. [Módulo D – Contratos de Alquiler](#9-módulo-d--contratos-de-alquiler)
10. [Módulo E – Servicios Asociados](#10-módulo-e--servicios-asociados)
11. [Módulo F – Motor Financiero y Cobros](#11-módulo-f--motor-financiero-y-cobros)
12. [Módulo G – Liquidaciones a Propietarios](#12-módulo-g--liquidaciones-a-propietarios)
13. [Módulo H – Automatizaciones y Notificaciones](#13-módulo-h--automatizaciones-y-notificaciones)
14. [Módulo I – Comercialización y CRM](#14-módulo-i--comercialización-y-crm)
15. [Módulo J – Portales de Autogestión](#15-módulo-j--portales-de-autogestión)
16. [Módulo K – Estadísticas y Reportes](#16-módulo-k--estadísticas-y-reportes)
17. [Módulo L – Configuración del Sistema](#17-módulo-l--configuración-del-sistema)
18. [Módulo M – Auditoría y Trazabilidad](#18-módulo-m--auditoría-y-trazabilidad)
19. [Módulo N – Migración de Datos (ETL)](#19-módulo-n--migración-de-datos-etl)
20. [Flujo Mensual de Operación](#20-flujo-mensual-de-operación)
21. [Reglas de Negocio Consolidadas](#21-reglas-de-negocio-consolidadas)
22. [Pantallas del Sistema](#22-pantallas-del-sistema)

---

## 1. Visión General del Producto

Adminprop es una plataforma PropTech integral (CRM + ERP Inmobiliario) diseñada específicamente para Oppido Propiedades, con capacidad de escalar como producto multi-tenant hacia otras inmobiliarias.

**Objetivo principal:** Reemplazar el Excel actual y los sistemas de terceros (Tokko Broker) con una herramienta unificada que gestione tanto la comercialización (captación y publicación de propiedades) como la administración financiera completa (cobros, pagos, liquidaciones, intereses, honorarios).

**Propuesta de valor:**
- Una sola herramienta para todo el ciclo de vida de un alquiler
- Automatización de procesos repetitivos (recordatorios, cálculo de aumentos, intereses)
- Visibilidad en tiempo real del estado financiero de cada propiedad
- Acceso móvil prioritario para gestionar desde cualquier lugar
- Portales de autogestión para propietarios e inquilinos

---

## 2. Usuarios del Sistema

### 2.1 Administrador
- Acceso total al sistema
- Puede definir y modificar parámetros de configuración global
- Gestiona usuarios internos (empleados)
- Visualiza todos los reportes y estadísticas
- Puede realizar anulaciones y correcciones de pagos con registro de auditoría

### 2.2 Empleado
- Gestiona propiedades, contratos y pagos en el día a día
- Puede registrar cobros, generar liquidaciones y enviar comunicaciones
- No accede a configuración global ni a acciones de auditoría interna

### 2.3 Propietario (usuario externo – portal)
- Acceso exclusivo al Portal de Propietarios mediante usuario y contraseña
- Visualiza el estado de cuenta de sus propiedades
- Descarga liquidaciones y comprobantes
- No puede modificar datos ni tomar acciones sobre el sistema

### 2.4 Inquilino (usuario externo – portal)
- Acceso exclusivo al Portal de Inquilinos mediante usuario y contraseña
- Visualiza su estado de cuenta (saldo, deuda, historial de pagos)
- Descarga recibos y comprobantes
- No puede modificar datos

---

## 3. Arquitectura e Infraestructura

### 3.1 Topología General
- **Monorepo** gestionado con Turborepo
- Modelo **Single-Deployment, Multi-Tenant**: base de datos PostgreSQL compartida con columna `tenant_id` obligatoria en todas las tablas core

### 3.2 Componentes

> ⚠️ **Nota:** esta tabla refleja la arquitectura original del PRD. Las decisiones técnicas definitivas y actualizadas viven en `specs/fase-01-arquitectura.md` y `specs/fase-03-setup.md`, que son la fuente de verdad vigente (ej. Frontend Backoffice pasó de React+Vite a Next.js, ORM es Prisma en vez de TypeORM). Ante cualquier diferencia entre esta tabla y las specs, gana la spec.

| Componente | Tecnología | Despliegue |
|---|---|---|
| API / Backend | NestJS (Monolito modular) | Render/Railway (MVP) → DigitalOcean/AWS (futuro) |
| Frontend Backoffice | Next.js (App Router, mayormente Client Components) | Vercel |
| Portal Público | Next.js (SSR/SSG) | Vercel |
| Base de Datos | PostgreSQL | Neon/Supabase (MVP) → RDS (futuro) |
| Almacenamiento Assets | Cloudinary | Cloud |
| Workers / Cron Jobs | NestJS Scheduler + pg-boss | Mismo proceso que la API |

### 3.3 Almacenamiento de Assets
Cloudinary gestiona:
- Fotos de propiedades
- PDFs de contratos escaneados
- Comprobantes de transferencia bancaria
- Documentos de identidad (DNI de inquilinos/garantes)

---

## 4. Guía de Estilo y UI/UX

### 4.1 Principios Core UX
- **Mobile-First estricto**: toda pantalla debe ser 100% operable desde un teléfono
- Interacciones sin recargas de página (SPA)
- Uso de *bottom sheets* para acciones contextuales en mobile
- *Skeleton loaders* en todas las pantallas con carga asíncrona
- Feedback visual inmediato en cada acción del usuario

### 4.2 Paleta de Colores

| Nombre | Hex | Uso |
|---|---|---|
| Nero | `#161616` | Fondos premium, barras de navegación |
| Off-White | `#F7F4EF` | Fondos base cálidos |
| Dark Green | `#314C38` | Botones de acción principal (CTA) |
| Copper | `#818A63` | Detalles, iconos, precios destacados |

### 4.3 Tipografía
- **Títulos y precios:** Serif clásica (ej. Playfair Display o similar)
- **Cuerpo e interfaz:** Sans-Serif geométrica (ej. Inter o DM Sans)

---

## 5. Entidades del Sistema

Estas son las entidades principales que el sistema persiste en base de datos.

### 5.0 Tenant (Inmobiliaria)
Entidad raíz del modelo multi-tenant. Cada inmobiliaria que usa el sistema es un tenant. Todas las demás entidades core referencian a un tenant vía `tenant_id`.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único del tenant |
| nombre | String | Nombre de la inmobiliaria (ej. Oppido Propiedades) |
| slug | String | Identificador corto único (ej. "oppido") |
| logo_url | String | Logo en Cloudinary (nullable) |
| color_primario | String | Color de marca para personalización de UI (nullable) |
| activo | Boolean | Si el tenant está habilitado |
| **Parámetros de negocio propios** | | |
| honorarios_pct_estandar | Decimal | Default 5% — configurable por inmobiliaria |
| honorarios_pct_reducido | Decimal | Default 3% |
| umbral_honorario_reducido | Integer | Default 3 propiedades |
| dias_gracia_pago | Integer | Default 10 |
| punitorio_pct_diario | Decimal | Default 5% |
| dia_generacion_cuotas | Integer | Default 28 |
| dia_envio_recordatorio | Integer | Default 1 |
| dias_aviso_vencimiento | Integer | Default 60 |
| dia_informe_mensual | Integer | Default 10 |
| moneda_principal | Enum | Default ARS |
| created_at | Timestamp | — |

> **Modelo Multi-Tenant:** el sistema es single-database / shared-schema. Todas las tablas core llevan `tenant_id` obligatorio. Un interceptor global de NestJS filtra automáticamente por el `tenant_id` del usuario logueado (tomado de su JWT) en cada query, garantizando aislamiento total entre inmobiliarias. El alta de un nuevo tenant se hace por seed/script (sin ABM en el MVP). Los parámetros de negocio que antes vivían en Configuración global ahora pertenecen al tenant, porque cada inmobiliaria puede tener reglas distintas. Adminprop nace preparado para múltiples inmobiliarias: Oppido es el primer tenant y opera con normalidad; sumar otra inmobiliaria no requiere tocar código.

### 5.1 Propiedad
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tenant_id | UUID | Identificador del tenant (inmobiliaria) |
| direccion | String | Dirección de calle y número |
| ubicacion_id | FK | Referencia al maestro de Ubicación (barrio/localidad) |
| tipo_propiedad_id | FK | Referencia al maestro de Tipo de Propiedad |
| estado | Enum | Disponible, Alquilada, En mantenimiento |
| propietario_id | FK | Referencia al propietario |
| inquilino_id | FK | Referencia al inquilino activo (nullable) |
| amenities | Array FK | Referencias al maestro de Amenities |
| servicios | Array | Lista de servicios asociados |
| observaciones | Text | Notas internas |
| fotos | Array | URLs en Cloudinary |
| created_at | Timestamp | Fecha de creación |
| updated_at | Timestamp | Última modificación |

> Los campos `ubicacion_id`, `tipo_propiedad_id` y `amenities` apuntan al **módulo de Maestros** (ver entidad 5.8). Esto garantiza datos consistentes y limpios, especialmente de cara a la migración desde Tokko y al portal público SEO.

### 5.2 Propietario
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tenant_id | UUID | Identificador del tenant |
| nombre | String | — |
| apellido | String | — |
| dni | String | Documento de identidad |
| telefono | String | — |
| email | String | — |
| direccion | String | — |
| datos_bancarios | JSON | CBU, alias, banco, titular |
| observaciones | Text | Notas internas |
| portal_usuario | String | Usuario para portal de propietarios |
| portal_password_hash | String | Hash de contraseña portal |

### 5.3 Inquilino
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | Identificador único |
| tenant_id | UUID | Identificador del tenant |
| nombre | String | — |
| apellido | String | — |
| dni | String | — |
| telefono | String | — |
| email | String | — |
| direccion | String | Domicilio del inquilino |
| fecha_ingreso | Date | Fecha de inicio de primer contrato |
| portal_usuario | String | Usuario para portal de inquilinos |
| portal_password_hash | String | Hash de contraseña portal |
| garante_id | FK | Referencia al garante (nullable) |

### 5.4 Garante
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| nombre | String | — |
| apellido | String | — |
| dni | String | — |
| telefono | String | — |
| email | String | — |
| direccion | String | — |
| tipo_garantia | Enum | Propiedad en garantía / Recibos de sueldo |
| detalle_garantia | Text | Descripción del bien o ingresos |

### 5.5 Contrato de Alquiler
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | — |
| propiedad_id | FK | — |
| propietario_id | FK | — |
| inquilino_id | FK | — |
| garante_id | FK | nullable |
| fecha_inicio | Date | — |
| fecha_fin | Date | — |
| monto_inicial | Decimal | Canon locativo inicial |
| moneda | Enum | ARS / USD |
| tipo_actualizacion | Enum | ICL / IPC / Fijo / Otro |
| frecuencia_aumento | Enum | Mensual / Trimestral / Cuatrimestral |
| deposito | Decimal | Monto de depósito en garantía |
| honorarios_pct | Decimal | Porcentaje aplicado (5% o 3%) |
| estado | Enum | Activo / Finalizado / Rescindido |
| pdf_contrato | String | URL en Cloudinary |
| servicios | Array | Lista de servicios del contrato |
| observaciones | Text | — |
| **Seguro de caución** | | |
| tiene_caucion | Boolean | Si el contrato exige seguro de caución |
| aseguradora_nombre | String | Ej: Finaer, Garantizar, etc. (nullable) |
| aseguradora_email_alerta | String | Email al que se envía la alerta automática (nullable) |
| poliza_numero | String | Número de póliza (nullable) |
| poliza_vencimiento | Date | Fecha de vencimiento de la póliza (nullable) |
| poliza_pdf | String | URL del PDF de la póliza en Cloudinary (nullable) |

### 5.6 Pago
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | — |
| contrato_id | FK | — |
| inquilino_id | FK | — |
| periodo | String | Ej: "2026-06" |
| monto_base | Decimal | Canon del mes |
| monto_punitorios | Decimal | Intereses acumulados (0 si pagó en término) |
| monto_total | Decimal | Base + punitorios |
| fecha_pago | Date | Fecha real de cobro |
| estado | Enum | Pendiente / Pagado / Vencido / Con mora |
| comprobante_url | String | URL en Cloudinary |
| metodo_pago | Enum | Transferencia / Efectivo / Otro |
| registrado_por | FK | ID del empleado que registró |

> **Ver CA-01 en sección de Consultas Abiertas:** el schema de punitorios (si se guarda detalle diario o solo el total) está pendiente de confirmación.

### 5.7 Liquidación

> El modelo de liquidación (individual por propiedad vs. consolidada por propietario) está pendiente de confirmación. Ver CA-02 en sección de Consultas Abiertas.

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | — |
| propietario_id | FK | — |
| propiedad_id | FK | — |
| periodo | String | Ej: "2026-06" |
| monto_alquiler | Decimal | Canon cobrado al inquilino |
| honorarios_monto | Decimal | Monto deducido en concepto de honorarios |
| honorarios_pct | Decimal | Porcentaje aplicado (5% o 3%) — registrado en el momento |
| gastos_adelantados | Decimal | Reparaciones/gastos del inquilino descontados |
| monto_a_transferir | Decimal | Neto a abonar al propietario |
| estado | Enum | Pendiente / Transferida / Confirmada |
| fecha_liquidacion | Date | — |
| pdf_liquidacion | String | URL en Cloudinary |

### 5.8 Maestros (Tablas de Referencia)

Tablas de datos estables que alimentan los selectores del sistema y garantizan consistencia. Se cargan inicialmente desde la migración de Tokko y luego se administran desde el backoffice.

#### 5.8.1 Ubicación (jerárquica)
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| tenant_id | UUID | nullable (los maestros pueden ser globales o por tenant) |
| tipo | Enum | Pais / Provincia / Localidad / Barrio |
| nombre | String | Nombre de la ubicación |
| parent_id | FK | Referencia a la ubicación padre (nullable para País) |

> Estructura jerárquica auto-referenciada: País → Provincia → Localidad → Barrio. Cada propiedad apunta al nivel más específico (generalmente Barrio o Localidad).

#### 5.8.2 Tipo de Propiedad
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| nombre | String | Casa, Departamento, Local, Oficina, PH, Terreno, etc. |
| activo | Boolean | Si está disponible para selección |

#### 5.8.3 Amenities / Características
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| nombre | String | Pileta, Cochera, Parrilla, Balcón, etc. |
| icono | String | Identificador de icono para UI (nullable) |
| activo | Boolean | — |

#### 5.8.4 Tipo de Operación
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| nombre | String | Alquiler, Venta, Temporario |
| activo | Boolean | — |

> Aunque el sistema arranca enfocado en Alquiler, se deja el maestro abierto para no requerir cambios de schema si se incorpora Venta o Temporario más adelante.

#### 5.8.5 Tipo de Servicio
| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID | — |
| nombre | String | Alquiler, Expensas, Luz, Gas, Agua, Municipal, Seguro, etc. |
| activo | Boolean | — |

> Los servicios pasan de ser un enum hardcodeado a un maestro administrable, para que la inmobiliaria pueda agregar nuevos tipos sin tocar código.

---

## 6. Módulo A – Gestión de Propiedades

### 6.1 Listado de Propiedades
- Vista de tarjetas en mobile y tabla en desktop
- Filtros por: estado (disponible / alquilada / en mantenimiento), propietario, tipo de propiedad
- Buscador por dirección
- Indicadores visuales de estado (badge de color)
- Acceso rápido a la ficha completa desde el listado

### 6.2 Ficha de Propiedad
- Toda la información del inmueble en una sola pantalla
- Sección de fotos con visualizador (Cloudinary)
- Datos del contrato activo con link directo al contrato
- Datos del propietario e inquilino con links directos
- Historial de contratos anteriores (solo lectura)
- Listado de servicios asociados y su estado de pago
- Historial de pagos del alquiler
- Sección de mantenimiento y reparaciones registradas
- Botón de acción: contactar propietario / contactar inquilino por WhatsApp

### 6.3 Alta de Propiedad
- Formulario en pasos (wizard) optimizado para mobile
- Paso 1: Datos básicos (dirección, tipo, observaciones)
- Paso 2: Asignar propietario (buscar existente o crear nuevo)
- Paso 3: Servicios (selector múltiple con configuración individual)
- Paso 4: Fotos (carga desde cámara o galería, hasta 20 fotos)
- Guardado en borrador automático al salir del formulario

### 6.4 Edición de Propiedad
- Modificación de cualquier campo excepto historial de pagos
- Toda modificación queda registrada en el log de auditoría

### 6.5 Estado de Propiedad
- **Disponible:** sin contrato activo, aparece en el portal de comercialización
- **Alquilada:** con contrato activo, no publicable en portal
- **En mantenimiento:** no publicable, marca visual destacada en el listado

---

## 7. Módulo B – Gestión de Propietarios

### 7.1 Listado de Propietarios
- Vista de tarjetas con nombre, cantidad de propiedades y estado general
- Filtros por: cantidad de propiedades, propiedades con deuda

### 7.2 Ficha de Propietario
- Datos personales completos
- Datos bancarios (CBU / alias)
- Listado de propiedades del propietario con estado de cada una
- Historial de liquidaciones con posibilidad de descargar PDF de cada una
- Indicador automático de si aplica honorario reducido (3%) por tener 3 o más propiedades alquiladas activas

### 7.3 Alta / Edición de Propietario
- Formulario completo con validación de DNI único por tenant
- Sección de datos bancarios obligatoria para poder generar liquidaciones
- Opción de crear credenciales para portal de autogestión desde la misma pantalla

---

## 8. Módulo C – Gestión de Inquilinos y Garantes

### 8.1 Listado de Inquilinos
- Vista en tarjetas con nombre, propiedad asociada y estado de pago del mes en curso
- Indicador visual de morosidad (pagó en término / moroso / deuda acumulada)
- Filtros por: estado de pago, propiedad, contrato por vencer

### 8.2 Ficha de Inquilino
- Datos personales completos
- Datos del garante asociado
- Contrato activo y contrato histórico
- Historial de pagos con estado de cada mes
- Indicador de días de mora acumulados si corresponde
- Botón de contacto WhatsApp directo

### 8.3 Alta / Edición de Inquilino
- Formulario de datos personales
- Sección de garante vinculable (crear nuevo o asociar existente)
- Generación de credenciales para portal de inquilinos

### 8.4 Gestión de Garantes
- ABM completo de garantes
- Tipo de garantía: propiedad (dirección y datos registrales) o recibos de sueldo (empleador, monto)
- Un garante puede estar vinculado a múltiples contratos

---

## 9. Módulo D – Contratos de Alquiler

### 9.1 Listado de Contratos
- Vista con filtros por: estado (activo / finalizado / rescindido), propiedad, inquilino, fecha de vencimiento
- Indicador visual para contratos próximos a vencer (menos de 60 días)
- Alerta visual para contratos ya vencidos sin renovación

### 9.2 Creación de Contrato
- Selector de propiedad (solo propiedades sin contrato activo)
- Selector de propietario (autocompletado desde la propiedad)
- Selector de inquilino (buscar existente o crear nuevo)
- Selector de garante (opcional)
- Definición de condiciones económicas:
  - Canon locativo inicial
  - Moneda (ARS / USD)
  - Tipo de actualización del índice (ICL / IPC / Fijo / Otro)
  - Frecuencia de actualización (mensual / trimestral / cuatrimestral)
  - Porcentaje de honorarios (precargado automáticamente según regla de negocio)
  - Monto de depósito en garantía
- Fechas: inicio y fin del contrato
- Upload del PDF del contrato escaneado a Cloudinary
- Definición de servicios del contrato (hereda los de la propiedad, modificables)
- Al guardar: el sistema cambia automáticamente el estado de la propiedad a "Alquilada"

### 9.3 Visualización de Contrato
- Todos los datos del contrato en una ficha
- Línea de tiempo visual del contrato (inicio → hoy → fin)
- Estado de cada mes: pagado / pendiente / moroso
- Botón para descargar PDF del contrato

### 9.4 Rescisión Anticipada
- Acción disponible desde la ficha del contrato
- El sistema solicita confirmación con la fecha de notificación de rescisión
- **Cálculo automático de multa:** 10% del saldo del canon locativo futuro (desde la fecha de notificación hasta la fecha de fin pactada)
- Se muestra el desglose del cálculo antes de confirmar
- Al confirmar: el contrato queda en estado "Rescindido" y la propiedad vuelve a "Disponible"
- La multa queda registrada como deuda del inquilino

### 9.5 Actualización de Canon por Índice
- El sistema aplica el aumento automáticamente según la frecuencia definida en el contrato
- Para ICL e IPC: el sistema busca el índice vigente del período correspondiente (integración con ARQUILER u otras fuentes oficiales)
- Para aumentos fijos: el sistema aplica el porcentaje definido
- Toda actualización genera un registro de auditoría con el índice utilizado y la fecha

### 9.6 Renovación de Contrato
- Flujo dedicado para renovar un contrato vencido o próximo a vencer
- El sistema precarga los datos del contrato anterior para edición
- Se puede modificar el canon, las condiciones y las fechas
- Se sube el nuevo PDF del contrato
- El contrato anterior queda en estado "Finalizado" e históricamente vinculado a la propiedad

---

## 10. Módulo E – Servicios Asociados

### 10.1 Configuración de Servicios por Propiedad
Cada propiedad puede tener una lista de servicios configurados individualmente:

| Campo | Opciones |
|---|---|
| Nombre del servicio | Alquiler, Expensas, Luz, Gas, Agua, Municipal, Seguro, Otro |
| Quién lo paga | Inquilino / Propietario |
| Moneda | ARS / USD |
| Tiene vencimiento | Sí / No |
| Tiene aumento | Sí / No |
| Frecuencia de aumento | Mensual / Trimestral / Otro |
| Gestionado desde la inmobiliaria | Sí / No |
| Observaciones | Campo libre |

### 10.2 Control de Servicios Vencidos
- El sistema marca automáticamente un servicio como vencido si superó su fecha de vencimiento
- A partir del 5° día de vencido: se dispara alerta automática al inquilino y al empleado
- El listado de servicios pendientes es visible en el dashboard principal

### 10.3 Registro de Gastos Adelantados por Inquilino
- El inquilino puede adelantar el pago de una reparación o servicio
- El empleado registra el gasto con: monto, descripción, comprobante (foto/PDF)
- El sistema asocia el gasto al contrato correspondiente
- El gasto se descuenta automáticamente de la próxima liquidación al propietario

---

## 11. Módulo F – Motor Financiero y Cobros

### 11.1 Generación de Cuotas Mensuales
- El sistema genera automáticamente las cuotas del mes para todos los contratos activos
- Se ejecuta los últimos días del mes anterior (configurable, default: día 28)
- Cada cuota generada incluye: monto actualizado según índice, período, estado "Pendiente"

### 11.2 Registro de Cobros
- Pantalla de cobros del mes con listado de todos los inquilinos y su estado
- Para registrar un cobro: seleccionar inquilino → ingresar monto → seleccionar medio de pago → subir comprobante
- **Regla estricta: el sistema NO permite pagos parciales.** El pago registrado debe cubrir el total (base + punitorios si los hay)
- Si existen punitorios acumulados, el sistema muestra el desglose y solo permite registrar el pago total

### 11.3 Motor de Intereses y Punitorios
- **Período de gracia:** del día 1 al 10 de cada mes (configurable)
- **A partir del día 11:** el sistema calcula automáticamente interés punitorio del **5% diario** sobre el monto total del alquiler por cada día de atraso
- Los punitorios se acumulan día a día de forma automática (cron job nocturno)
- El sistema puede **bloquear la recepción del alquiler base** sin el pago simultáneo del punitorio total acumulado (el empleado no puede registrar el pago base sin que esté cubierto el punitorio)
- El monto con punitorios se muestra desglosado en la pantalla de cobro y en el portal del inquilino

### 11.4 Alerta a Aseguradora (Seguro de Caución)
- Si un contrato tiene seguro de caución (ej. Finaer) y el alquiler no se registró pagado al cierre del día 1:
- El sistema **envía automáticamente un email de alerta** a la dirección de la aseguradora configurada en el contrato
- El email incluye: nombre del inquilino, propiedad, período y monto adeudado
- Se registra el envío en el log de auditoría

### 11.5 Gestión de Depósito de Garantía
- El depósito queda registrado en el contrato
- Al finalizar o rescindir el contrato: el sistema permite registrar la devolución total o parcial del depósito
- Si hay deuda del inquilino al momento del cierre, el empleado puede imputar el depósito como pago parcial con registro y justificación

---

## 12. Módulo G – Liquidaciones a Propietarios

### 12.1 Generación de Liquidación
- Se genera una liquidación por propiedad una vez que el inquilino pagó el mes completo
- El sistema calcula automáticamente en cada liquidación individual:
  - Canon cobrado
  - Porcentaje de honorarios (5% estándar o 3% si aplica la regla de 3+ propiedades)
  - Gastos adelantados por el inquilino a descontar
  - **Monto neto a transferir al propietario**

### 12.2 Fórmula de Liquidación
```
Monto neto = Canon cobrado − Honorarios − Gastos adelantados por inquilino
```

### 12.3 Regla de Honorarios Reducidos
- Si el propietario tiene **3 o más propiedades con contratos activos** en el momento de la liquidación: se aplica honorario del **3%**
- Si tiene menos de 3: se aplica honorario del **5%**
- El sistema evalúa esta condición automáticamente en el momento de calcular cada liquidación
- El porcentaje aplicado queda registrado en el detalle de la liquidación

### 12.4 Confirmación y Envío
- El empleado revisa el detalle de la liquidación y confirma
- El sistema genera un PDF de la liquidación (almacenado en Cloudinary)
- El PDF se envía automáticamente al propietario por email
- El propietario también puede descargarlo desde su portal
- El informe mensual general se envía el día 10 de cada mes (configurable)

### 12.5 Historial de Liquidaciones
- Por propietario: listado de todas las liquidaciones con estado (pendiente de transferencia / transferida / confirmada)
- Descarga de PDF de cada liquidación
- Registro de la transferencia bancaria (el empleado marca como transferida y puede subir el comprobante)

---

## 13. Módulo H – Automatizaciones y Notificaciones

### 13.1 Recordatorio de Pago al Inquilino
- **Cuándo:** Día 1 de cada mes
- **A quién:** Inquilino
- **Medio:** Email + WhatsApp (mensaje con plantilla predefinida)
- **Contenido:** Nombre del inquilino, propiedad, período, monto a pagar, datos bancarios de la inmobiliaria

### 13.2 Aviso de Mora al Inquilino
- **Cuándo:** Día 11 del mes (si no registró pago)
- **A quién:** Inquilino + Empleado responsable
- **Medio:** Email
- **Contenido:** Detalle del monto base + punitorio acumulado hasta la fecha

### 13.3 Aviso de Vencimiento de Contrato
- **Cuándo:** 60 días antes de la fecha de fin del contrato
- **A quién:** Propietario + Empleado
- **Medio:** Email + notificación interna en el sistema
- **Contenido:** Datos del contrato, fecha de vencimiento, link al portal

### 13.4 Aviso de Servicio Vencido
- **Cuándo:** A partir del 5° día de vencimiento del servicio
- **A quién:** Inquilino + Empleado
- **Medio:** Email
- **Contenido:** Nombre del servicio, propiedad, días de vencimiento

### 13.5 Alerta a Aseguradora (Seguro de Caución)
- **Condición:** El contrato tiene `tiene_caucion = true` y no se registró pago al cierre del día 1 del mes
- **A quién:** Email configurado en `aseguradora_email_alerta` del contrato
- **Medio:** Email automático
- **Contenido del email:** Nombre del inquilino, DNI, propiedad (dirección), número de póliza, período adeudado, monto
- **Control de vencimiento de póliza:** El sistema alerta al empleado 30 días antes del vencimiento de `poliza_vencimiento` para gestionar la renovación
- **Alerta de póliza vencida:** Si la fecha actual supera `poliza_vencimiento`, el sistema muestra una alerta roja en la ficha del contrato y en el dashboard — el contrato queda marcado como "Caución vencida" hasta que se cargue la nueva póliza
- **Registro:** Todo envío de alerta a aseguradora queda registrado en el log de auditoría con timestamp, destinatario y contenido

### 13.6 Actualización Automática de Índices (ICL / IPC)
- **Cuándo:** Diariamente (cron job nocturno) o según la frecuencia de publicación del índice
- **Fuente:** Scraper de ARQUILER u otras fuentes oficiales (configurable)
- **Acción:** Actualiza la tabla de índices en el sistema
- Si no puede obtener el índice automáticamente, genera una alerta interna para carga manual
- Toda actualización queda registrada con fecha y fuente

### 13.7 Generación Automática de Cuotas Mensuales
- **Cuándo:** Día 28 de cada mes (configurable)
- **Acción:** Genera las cuotas del mes siguiente para todos los contratos activos
- Aplica el aumento de índice si corresponde según la frecuencia definida en el contrato

---

## 14. Módulo I – Comercialización y CRM

### 14.1 Portal Público de Propiedades
- Sitio web SEO-optimizado (Next.js SSR/SSG) que muestra las propiedades disponibles de la inmobiliaria
- Cada propiedad disponible se publica automáticamente al marcarse como "Disponible"
- Ficha pública: fotos, descripción, características, precio, formulario de contacto

### 14.2 Multipublicación en Portales Externos
- Integración con: Zonaprop, Argenprop, Mercado Libre
- Carga unificada desde Adminprop: el empleado ingresa los datos una sola vez
- El sistema redistribuye automáticamente hacia los portales configurados
- Estado de publicación por portal (publicada / pendiente / error) visible en la ficha de propiedad

### 14.3 CRM – Pipeline de Consultas
- Tablero Kanban de consultas entrantes
- Estados del pipeline:
  - **Nuevo:** consulta recibida sin respuesta
  - **Contactado:** se inició comunicación con el prospecto
  - **Visita programada:** se agendó visita a la propiedad
  - **Propuesta enviada:** se envió oferta o condiciones
  - **Cerrado ganado:** se formalizó el contrato
  - **Cerrado perdido:** el prospecto no avanzó
- Cada tarjeta del kanban muestra: nombre del prospecto, propiedad de interés, fecha de consulta, canal de origen

### 14.4 Integración WhatsApp
- Botón de acción directa en cada tarjeta del CRM
- Al hacer clic, abre WhatsApp Web/App con el número del prospecto y una plantilla de mensaje predefinida
- Las plantillas son configurables por el administrador

### 14.5 Analítica de Inmuebles
- Por cada propiedad: cantidad de vistas en el portal, cantidad de consultas recibidas, tasa de conversión
- Informe exportable para enviar a propietarios como reporte de actividad comercial

---

## 15. Módulo J – Portales de Autogestión

### 15.1 Portal de Propietarios
- Acceso web independiente por subdomain o sección dedicada del portal
- Login con usuario y contraseña (generados desde el backoffice)
- **Vistas disponibles:**
  - Listado de sus propiedades y estado de cada una
  - Estado de cuenta del mes actual
  - Historial de liquidaciones con descarga de PDF
  - Historial de pagos de cada inquilino
  - Datos de contacto de la inmobiliaria
- **No puede:** modificar nada, ver datos de otros propietarios, ver información financiera de la inmobiliaria

### 15.2 Portal de Inquilinos
- Login con usuario y contraseña
- **Vistas disponibles:**
  - Estado de cuenta del mes actual (monto a pagar / deuda con punitorios)
  - Historial de pagos con posibilidad de descargar comprobantes
  - Datos del contrato (fecha inicio / fin, monto, servicios)
  - Datos de contacto de la inmobiliaria y botón WhatsApp
- **No puede:** modificar nada, ver datos de otros inquilinos

---

## 16. Módulo K – Estadísticas y Reportes

### 16.1 Dashboard Principal (Backoffice)
- Resumen del mes en curso: alquileres cobrados / pendientes / en mora
- Próximas liquidaciones a generar
- Contratos por vencer en los próximos 60 días
- Servicios vencidos con acción pendiente
- Accesos rápidos a las acciones más frecuentes

### 16.2 Reportes Financieros
| Reporte | Descripción |
|---|---|
| Ingresos del mes | Total cobrado en el período |
| Honorarios cobrados | Suma de honorarios del período |
| Alquileres pagados | Listado de pagos registrados |
| Alquileres vencidos | Inquilinos con deuda actual |
| Punitorios generados | Suma de intereses del período |

### 16.3 Reportes Operativos
| Reporte | Descripción |
|---|---|
| Propiedades alquiladas | Listado con datos del contrato activo |
| Propiedades disponibles | Listado con tiempo sin alquilar |
| Contratos por vencer | Ordenados por fecha de fin ascendente |
| Servicios pendientes | Servicios vencidos o sin confirmación de pago |

### 16.4 Reportes por Propietario
| Reporte | Descripción |
|---|---|
| Ingresos generados | Liquidaciones históricas del propietario |
| Historial de pagos | Mes a mes, de cada inquilino del propietario |
| Estado de propiedades | Activas, disponibles, en mantenimiento |

### 16.5 Reportes por Inquilino
| Reporte | Descripción |
|---|---|
| Historial de pagos | Mes a mes con estado |
| Deuda actual | Monto base + punitorios acumulados |
| Contratos activos | Datos del contrato vigente |

### 16.6 Exportación
- Todos los reportes son exportables a Excel (XLSX) y PDF
- Los reportes de liquidación y recibos tienen plantilla con logo de la inmobiliaria

---

## 16.5 Módulo – Maestros (Tablas de Referencia)

Administración de las tablas de referencia que alimentan los selectores del sistema. Accesible para el Administrador (y opcionalmente empleados según permiso).

### Gestión de Ubicaciones
- ABM jerárquico de País → Provincia → Localidad → Barrio
- Vista de árbol para navegar la jerarquía
- Usado en alta de propiedades y en filtros del portal público

### Gestión de Tipos de Propiedad
- ABM de tipos (Casa, Depto, Local, etc.)
- Activar/desactivar sin eliminar (preserva integridad referencial con propiedades existentes)

### Gestión de Amenities
- ABM de características con icono asociado para la UI

### Gestión de Tipos de Operación
- ABM de operaciones (Alquiler, Venta, Temporario)

### Gestión de Tipos de Servicio
- ABM de servicios disponibles para asociar a propiedades/contratos

> Todos los maestros se cargan inicialmente durante la migración desde Tokko (ver Módulo N) y luego se mantienen desde estas pantallas. Las eliminaciones se manejan con borrado lógico (`activo = false`) para no romper referencias históricas.

---

## 17. Módulo L – Configuración del Sistema

### 17.1 Parámetros Generales (por Tenant — gestionados por el Administrador)

> Estos parámetros pertenecen a cada inmobiliaria (entidad Tenant, ver 5.0). Cada tenant tiene su propia configuración; los valores de abajo son los defaults de Oppido.

| Parámetro | Default | Descripción |
|---|---|---|
| Porcentaje honorarios estándar | 5% | Aplicable a la mayoría de propietarios |
| Porcentaje honorarios reducidos | 3% | Para propietarios con 3+ propiedades activas |
| Umbral para honorario reducido | 3 propiedades | Cantidad mínima para aplicar 3% |
| Día de generación de cuotas | 28 | Día del mes en que se generan cuotas del mes siguiente |
| Días de gracia de pago | 10 | Días sin punitorio (del 1 al X) |
| Porcentaje punitorio diario | 5% | A partir del día 11 |
| Día envío recordatorio | 1 | Día de envío de recordatorio de pago |
| Días antes aviso vencimiento contrato | 60 | Anticipo de aviso de renovación |
| Día de envío de informe mensual | 10 | Día de envío del resumen a propietarios |
| Moneda principal | ARS | Peso Argentino |

### 17.2 Plantillas de Comunicación
- Editor de plantillas de email (recordatorio de pago, aviso mora, liquidación, alerta aseguradora)
- Editor de plantillas de WhatsApp (message templates)
- Variables disponibles: {{nombre_inquilino}}, {{propiedad}}, {{monto}}, {{periodo}}, {{dias_mora}}, etc.

### 17.3 Integración con Portales
- Configuración de credenciales de acceso a Zonaprop, Argenprop y Mercado Libre
- Estado de conexión por portal (activo / desconectado)

### 17.4 Configuración de Fuentes de Índices
- URL del scraper de ARQUILER u otras fuentes
- Frecuencia de actualización automática
- Email de alerta si la actualización automática falla

---

## 18. Módulo M – Auditoría y Trazabilidad

### 18.1 Registro de Auditoría (Inmutable)
Todo cambio significativo en el sistema genera un registro que incluye:
- Quién realizó la acción (usuario, rol)
- Qué acción realizó (tipo de evento)
- Sobre qué entidad (ID, descripción)
- Cuándo (timestamp)
- Estado anterior y estado nuevo (JSON diff)

### 18.2 Eventos Auditados
- Creación, edición y eliminación de propiedades, propietarios, inquilinos y contratos
- Registro y anulación de pagos
- Modificación de precios y cánones
- Generación y modificación de liquidaciones
- Cambios en configuración del sistema
- Accesos al portal de propietarios e inquilinos
- Envíos de notificaciones automáticas

### 18.3 Visualización de Auditoría
- Pantalla de log de auditoría accesible solo para el Administrador
- Filtros por: usuario, tipo de acción, entidad afectada, rango de fechas
- No se pueden editar ni eliminar registros de auditoría

---

## 19. Módulo N – Migración de Datos (ETL)

### 19.1 Importador desde Tokko Broker
- Script automatizado (Node.js) para extracción vía API de Tokko (`GET /api/v1/property/search/`)
- Extrae catálogos de propiedades y diccionarios estáticos (ubicaciones, amenities)
- Mapeo automático de campos con revisión manual antes de importación definitiva

### 19.2 Importador Excel
- Herramienta de carga masiva para migrar la cartera administrativa actual (propietarios, inquilinos, contratos históricos)
- Template de Excel descargable con columnas predefinidas y validaciones
- Vista previa de los datos antes de confirmar la importación
- Registro de errores por fila con descripción del problema

### 19.3 Migración de Assets
- Descarga automática de imágenes desde URLs externas (Tokko u otros)
- Resubida optimizada a Cloudinary con compresión automática
- Reporte de assets migrados / fallidos

---

## 20. Flujo Mensual de Operación

Este es el ciclo operativo estándar de la inmobiliaria mes a mes:

```
DÍA 28 DEL MES ANTERIOR
  └─ El sistema genera automáticamente las cuotas del nuevo mes
     (aplica actualización de índice si corresponde)

DÍA 1 DEL MES
  └─ El sistema envía recordatorios de pago a todos los inquilinos
     (email + WhatsApp con template predefinido)

DÍAS 1 AL 10 (PERÍODO DE GRACIA)
  └─ Los inquilinos realizan sus pagos
  └─ El empleado registra los cobros en el sistema
      ├─ Adjunta comprobante de transferencia
      └─ El sistema valida que el monto sea el total (sin parciales)

DÍA 1 (SI NO HAY PAGO Y EL CONTRATO TIENE CAUCIÓN)
  └─ El sistema envía email automático a la aseguradora

DÍA 11 EN ADELANTE (SI NO PAGÓ)
  └─ El sistema activa el motor de punitorios: 5% diario sobre el total
  └─ Envía aviso de mora al inquilino y al empleado
  └─ El pago base queda bloqueado sin pago simultáneo del punitorio

CUANDO EL INQUILINO PAGA
  └─ El empleado registra el cobro total (base + punitorios)
  └─ El sistema genera automáticamente la liquidación para el propietario
      ├─ Calcula honorarios (5% o 3% según regla)
      └─ Descuenta gastos adelantados si los hay

DÍA 10 DEL MES
  └─ El sistema envía el informe mensual a los propietarios
     (PDF de liquidación + resumen de estado)
```

---

## 21. Reglas de Negocio Consolidadas

| # | Regla | Detalle |
|---|---|---|
| RN-01 | Sin pagos parciales | El sistema no permite registrar un cobro que no cubra el total adeudado (base + punitorios) |
| RN-02 | Punitorio diario | A partir del día 11, se calcula 5% diario sobre el monto total del alquiler por cada día de atraso |
| RN-03 | Bloqueo de base sin punitorio | No se puede registrar el pago del canon sin cubrir simultáneamente todos los punitorios acumulados |
| RN-04 | Un contrato activo por propiedad | Una propiedad no puede tener más de un contrato en estado "Activo" simultáneamente |
| RN-05 | Un inquilino activo por contrato | Un contrato tiene un único inquilino titular activo |
| RN-06 | Honorario estándar | El honorario de administración es del 5% del canon locativo |
| RN-07 | Honorario reducido | Si el propietario tiene 3 o más propiedades con contratos activos, el honorario baja al 3% |
| RN-08 | Evaluación automática de honorario | El sistema evalúa la condición de RN-07 en el momento de calcular cada liquidación |
| RN-09 | Multa por rescisión anticipada | La multa es del 10% del saldo del canon futuro (desde notificación hasta fin de contrato pactado) |
| RN-10 | Alerta a aseguradora | Si hay seguro de caución y no se registra el pago al cierre del día 1, el sistema envía email automático a la aseguradora |
| RN-11 | Gastos adelantados descontables | Los gastos de reparación o servicio adelantados por el inquilino se descuentan automáticamente de la liquidación del propietario |
| RN-12 | Aviso de vencimiento de contrato | El sistema avisa 60 días antes del vencimiento al propietario y al empleado |
| RN-13 | Aviso de servicio vencido | A partir del 5° día de vencimiento de un servicio, el sistema alerta al inquilino y al empleado |
| RN-14 | Registro de auditoría inmutable | Toda modificación de datos sensibles genera un log que no puede ser eliminado ni editado |
| RN-15 | Actualización de índice | Los aumentos ICL/IPC se calculan automáticamente con el índice vigente del período correspondiente |
| RN-16 | Control de vencimiento de póliza | El sistema alerta 30 días antes del vencimiento de la póliza de caución. Si la póliza vence sin renovación, el contrato se marca "Caución vencida" con alerta visible en dashboard y ficha |

---

## 22. Pantallas del Sistema

### Backoffice (Empleado / Administrador)

| Pantalla | Descripción |
|---|---|
| Login | Autenticación con email y contraseña |
| Dashboard | Resumen del mes, alertas, acciones rápidas |
| Propiedades – Listado | Tarjetas/tabla con filtros |
| Propiedades – Ficha | Detalle completo de la propiedad |
| Propiedades – Alta/Edición | Formulario wizard |
| Propietarios – Listado | Tarjetas con estado |
| Propietarios – Ficha | Detalle + historial de liquidaciones |
| Propietarios – Alta/Edición | Formulario completo |
| Inquilinos – Listado | Tarjetas con estado de pago |
| Inquilinos – Ficha | Detalle + historial de pagos |
| Inquilinos – Alta/Edición | Formulario con garante |
| Contratos – Listado | Tabla con filtros y alertas |
| Contratos – Detalle | Ficha del contrato + timeline |
| Contratos – Nuevo/Renovación | Wizard de creación |
| Contratos – Rescisión | Flujo de cálculo y confirmación |
| Cobros del mes | Listado de cuotas del mes + registro de pago |
| Liquidaciones | Listado y generación de liquidaciones |
| Liquidación – Detalle | Desglose del cálculo |
| Servicios | Gestión de servicios por propiedad |
| CRM – Pipeline | Tablero Kanban de consultas |
| Estadísticas | Reportes financieros y operativos |
| Configuración | Parámetros, plantillas, integraciones |
| Auditoría | Log inmutable de acciones (solo Admin) |
| Migración de Datos | Herramienta ETL (solo Admin) |

### Portal de Propietarios

| Pantalla | Descripción |
|---|---|
| Login | Acceso con usuario y contraseña |
| Mis propiedades | Listado y estado de propiedades |
| Estado de cuenta | Mes actual y deuda |
| Liquidaciones | Historial y descarga de PDFs |
| Historial de pagos | Mes a mes por propiedad |
| Contacto | Datos de la inmobiliaria |

### Portal de Inquilinos

| Pantalla | Descripción |
|---|---|
| Login | Acceso con usuario y contraseña |
| Estado de cuenta | Monto del mes, deuda, punitorios |
| Historial de pagos | Mes a mes con descarga de comprobante |
| Mi contrato | Datos vigentes del contrato |
| Contacto | Datos e inmobiliaria y botón WhatsApp |

---

## 23. PDFs del Sistema

Lista de todos los documentos PDF que el sistema genera o gestiona. El contenido detallado de cada uno (campos, layout, logo, pie de página) se define en documento separado.

### PDFs Generados por el Sistema

| # | Documento | Cuándo se genera | Destinatario | Almacenado en |
|---|---|---|---|---|
| PDF-01 | Liquidación por propiedad | Al confirmar la liquidación de una propiedad | Propietario | Cloudinary |
| PDF-02 | Liquidación consolidada por propietario | Pendiente — ver CA-02 | Propietario | Cloudinary |
| PDF-03 | Recibo de pago de alquiler | Al registrar un cobro | Inquilino | Cloudinary |
| PDF-04 | Informe mensual al propietario | Día 10 de cada mes | Propietario | Cloudinary |
| PDF-05 | Cálculo de rescisión anticipada | Al confirmar una rescisión | Propietario + Inquilino | Cloudinary |

### PDFs Cargados por el Usuario (uploads)

| # | Documento | Dónde se carga | Vinculado a |
|---|---|---|---|
| PDF-06 | Contrato de alquiler escaneado | Módulo Contratos | Contrato |
| PDF-07 | Póliza de seguro de caución | Módulo Contratos | Contrato (`poliza_pdf`) |
| PDF-08 | Comprobante de transferencia (pago de inquilino) | Módulo Cobros | Pago |
| PDF-09 | Comprobante de transferencia (pago al propietario) | Módulo Liquidaciones | Liquidación |

> El contenido detallado (campos, plantilla visual, logo, datos a incluir) de cada PDF generado será definido por Micaela en documento separado y luego incorporado al PRD como Anexo A.

---

## 24. Consultas Abiertas

Puntos que requieren confirmación de Micaela antes de iniciar el desarrollo de los módulos afectados.

| # | Consulta | Módulo afectado | Impacto si no se define |
|---|---|---|---|
| CA-01 | **Detalle diario de punitorios:** ¿El sistema guarda un registro por día de cada punitorio generado (tabla separada `punitorio_log`) o solo persiste el total acumulado en el campo `monto_punitorios` del Pago al momento del cobro? Guardar el detalle permite auditar día a día cómo se llegó al número. Solo guardar el total es más simple pero no permite reconstruirlo. | Motor Financiero (F), Auditoría (M) | Afecta el schema de base de datos — difícil de cambiar después |
| CA-02 | **Liquidación consolidada por propietario:** El modelo actual genera una liquidación por propiedad. ¿Se genera además una consolidada por propietario que agrupe todas sus propiedades del mes en un solo PDF? Si es así: ¿se genera automáticamente cuando todas sus propiedades pagaron, o el empleado la genera manualmente? ¿El email incluye ambos PDFs o solo la consolidada? | Liquidaciones (G), Automatizaciones (H), PDFs | Afecta schema, flujo del módulo y plantillas de PDF |

---

*Documento preparado para aprobación. Una vez aprobado, se procede a la definición de fases de diseño, arquitectura detallada y plan de codeo por módulo.*
