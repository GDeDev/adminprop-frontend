# Spec — Fase 2: Diseño de Pantallas

> Resumen simple: esta fase no produce código — produce el diseño visual (sistema de diseño + pantallas clave) que las fases de desarrollo van a implementar. Se ejecuta con Claude Design, no con Claude Code.

**Depende de:** Fase 1 (Arquitectura) aprobada, para conocer las entidades y campos reales que cada pantalla debe mostrar.
**No depende de respuestas de Micaela** — se diseña con identidad propia "Adminprop" (ver decisión en `extras/ADMINPROP_marca_e_interfaz.md`), personalizable por tenant después.

---

## 1. Alcance

Sistema de diseño base (tokens, componentes) y las pantallas clave del backoffice, siguiendo el orden y los prompts ya preparados en:
- `extras/MENSAJE_UNICO_Claude_Design.md` — el mensaje único a pegar en Claude Design para arrancar todo el Bloque 1 de una vez (logo + sistema de diseño + Dashboard + Listado de Propiedades + Ficha de Propiedad)
- `extras/CLAUDE_DESIGN_pedidos.md` — el resto de los bloques (2 a 7), a pedir una vez validada la dirección del Bloque 1
- `extras/ADMINPROP_marca_e_interfaz.md` — contexto de marca, qué es personalizable por tenant y qué no

## 2. Entregables de esta Fase

1. Logo de Adminprop (SVG, variante horizontal + variante isotipo solo)
2. Sistema de diseño: tokens de color como variables de tema, escala tipográfica, componentes base (botones, inputs, cards, badges, bottom sheet, skeleton loader, navbar)
3. Mockups de: Dashboard, Listado de Propiedades, Ficha de Propiedad (Bloque 1)
4. (Opcional, si se pide research adicional) Mockups de los Bloques 2-7 según se necesiten, en el orden ya definido en `CLAUDE_DESIGN_pedidos.md`

## 3. Reglas de Negocio / Diseño

- Todo color de marca se define como variable de tema (`--color-primary`, `--color-accent`), nunca hardcodeado en el mockup — es lo que permite retemizar por tenant después sin rehacer diseño.
- Mobile-first estricto en cada pantalla — el diseño desktop es una adaptación del mobile, no al revés.
- Los campos mostrados en cada mockup deben corresponder exactamente a los campos reales definidos en el PRD (sección 5, Entidades) y en la spec de la fase de desarrollo correspondiente (ej. Ficha de Propiedad usa los campos de `specs/fase-06-propiedades.md`) — no inventar campos que no existen en el modelo de datos.

## 4. Criterios de Aceptación

- [ ] Logo aprobado por Giuliano, en las dos variantes (horizontal + isotipo), funcionando sobre fondo claro y oscuro
- [ ] Sistema de diseño con tokens documentados (no solo visual — los valores hex/rem exportables para implementar en Tailwind config, Fase 3)
- [ ] Las 3 pantallas del Bloque 1 aprobadas antes de pedir el resto de los bloques
- [ ] Cada campo mostrado en los mockups corresponde a un campo real de la spec de la fase de desarrollo equivalente

## 5. Casos Borde
- Si el logo elegido no funciona bien reducido a favicon — pedir ajuste antes de aprobar, no forzarlo después con CSS
- Si algún mockup incluye un campo o funcionalidad que no está en el PRD/specs de desarrollo — marcarlo y decidir si se agrega a la spec correspondiente o se saca del diseño, nunca dejarlo como inconsistencia silenciosa entre diseño y código
