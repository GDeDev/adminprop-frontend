# Spec — Fase 16: Despliegue MVP

> Resumen simple: llevamos todo lo construido hasta acá a la nube, para que Micaela y el equipo lo usen con datos reales desde cualquier lugar, no solo en tu computadora.

**Depende de:** Fases 1 a 15 completadas y funcionando en local.
**No agrega funcionalidad — es infraestructura pura.**

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


Aprovisionar y desplegar los 3 componentes (API, Backoffice, Portal) a servicios gratuitos/económicos, migrar la base de datos local a una gestionada, configurar dominio y DNS.

## 2. Tareas

### 2.1 Base de Datos
- Crear proyecto en **Neon** (o Supabase, definir según cuál dé mejor experiencia al probar) — Postgres gestionado
- Correr las migraciones de Prisma (`npx prisma migrate deploy`) contra la DB de la nube
- Correr el seed de maestros + tenant Oppido

### 2.2 Backend
- Desplegar `apps/api` en **Render** o **Railway** (free tier)
- Variables de entorno de producción configuradas (JWT secrets distintos a desarrollo, DATABASE_URL de Neon, credenciales de Cloudinary/Resend/Novu)
- Verificar que `GET /health` responde correctamente en la URL pública

### 2.3 Frontend Backoffice
- Desplegar `apps/backoffice` en **Vercel**
- Variable de entorno `VITE_API_URL` apuntando a la API desplegada

### 2.4 Dominio y DNS
- Confirmar dónde está hosteado el dominio de Oppido y obtener acceso
- Configurar subdominio para el backoffice (ej. `app.oppidopropiedades.com`)
- Configurar registros SPF, DKIM, DMARC para que Resend pueda enviar emails autenticados desde el dominio (bloqueante ya identificado en Fase 14)

### 2.5 Cloudinary
- Confirmar que el proyecto de Cloudinary usado en producción es el mismo (o uno separado) del de desarrollo — recomendado: mismo proyecto, distintas carpetas por entorno, para simplificar

### 2.6 Verificación de Cron
- Confirmar que `@nestjs/schedule` corre correctamente en el entorno desplegado (algunos free tiers "duermen" la instancia si no hay tráfico — verificar que esto no rompa los cron jobs nocturnos; si Render/Railway free tier duerme la app, puede requerir un servicio externo de "ping" para mantenerla despierta, o evaluar upgrade a un plan que no duerma)

## 3. Criterios de Aceptación

- [ ] La API responde en su URL pública con HTTPS válido
- [ ] El backoffice carga correctamente y puede hacer login contra la API de producción
- [ ] Los emails enviados desde producción llegan a la bandeja de entrada (no spam)
- [ ] Un cron job de prueba corre efectivamente en el entorno desplegado a la hora programada
- [ ] Micaela puede acceder al backoffice desde su celular con una URL pública

## 4. Fuera de Alcance
- Optimización de performance/escala — este es el MVP, no la versión de producción final a gran escala
- CI/CD automatizado avanzado (deploy en cada push) — puede ser manual en esta fase, automatizarse después si se justifica

## 5. Notas
- Producción de mayor escala (DigitalOcean, infraestructura dedicada) queda como evolución futura si el free tier se queda corto en tráfico o Oppido crece.
