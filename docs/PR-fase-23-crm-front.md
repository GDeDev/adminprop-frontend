# feat(backoffice): CRM y multipublicación (frontend de la Fase 23)

Rama `feature/fase-23-crm-front`, sobre `feature/fase-24-tasacion-automatica`. Contrato: `REDISENO_FASE_23.md` y `shared-types/src/crm.ts` y `listings.ts` (sin cambios). El backend de la fase es otro repo y todavía no está integrado: todo se probó con la API mockeada.

## Qué incluye

La rama ya traía el grueso de la fase (tablero, detalle, alta manual, canales, panel de publicaciones, tarjeta del dashboard; DT-98 a DT-103). Este PR agrega lo que faltaba y endurece lo que había:

- **Analítica con gráficos:** resumen del CRM con consultas por etapa y por canal; analítica de la propiedad con serie diaria (vistas en línea, consultas en barras, cada una con su escala), desglose por etapa y canal y selector de 7, 30 o 90 días. SVG propio, sin librería nueva, colores `--chart-*`, resumen en texto y tabla alternativa en cada gráfico, y la aclaración de que las vistas se cuentan desde la activación (DT-175, DT-176).
- **Tablero accesible:** menú «Mover a…» en cada tarjeta de escritorio, sensor táctil, blancos de 44 px, avisos de arrastre en español, error con reintento en «Ver más» (DT-177).
- **Detalle:** registro manual de llamados y emails (DT-178).
- **Canales y publicaciones:** el aviso de conexión exige el estado real, reintento al fallar la carga y frase en español delante de los errores del portal (DT-178).
- **Tests:** tablero, tarjeta, filtros, detalle, resumen, gráficos, analítica de la propiedad, canales, y la lógica de movimiento con su vuelta atrás sobre un `QueryClient` real.

## Cómo se probó

`npm run typecheck`, `npm run lint`, `npm run format:check` y `npm test` en la raíz del monorepo (cifras en el mensaje de entrega). **No se vio en un navegador ni contra la API real.** El gesto de arrastre de dnd-kit no se simula en jsdom: se prueban la resolución del destino, los avisos y la alternativa del menú.

## Supuestos

| Supuesto                                                                                       | Dónde        | Qué pasa si no se cumple                                                   |
| ---------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------- |
| `beforeId` es la tarjeta de arriba y `afterId` la de abajo (el rediseño no precisa el sentido) | DT-99        | El orden dentro de la columna queda invertido; se corrige en `neighborsAt` |
| `POST …/listings/:channel/publish` también actualiza una publicación existente                 | DT-102       | «Actualizar publicación» no hará nada hasta que haya un endpoint propio    |
| `byStage` y `bySource` llegan con todas las claves; si falta alguna se toma 0                  | DT-176       | Ninguno: se tolera                                                         |
| `daily` trae un punto por día del rango; si es ralo, los puntos se reparten parejos            | DT-175       | El eje X no sería proporcional al tiempo                                   |
| `to` es hoy y `from` hoy menos N días, con la fecha del navegador                              | DT-176       | Con otra zona horaria que la del tenant el último día puede correrse       |
| Una consulta con teléfono admite el registro de un llamado y una con email el de un email      | DT-178       | Se ofrecería un registro que la API no usa                                 |
| `lastError` de canales y publicaciones es un texto pensado para mostrarse                      | DT-178       | Se vería un mensaje técnico tras la frase en español                       |
| Los gráficos de vistas dependen de `property_views` desde la activación                        | DT-176, A-83 | Ninguno: el aviso ya lo dice                                               |
| El backend de `/crm/*` y `/crm/channels/*` existe como en las secciones 5 y 6 del rediseño     | DT-98        | Las pantallas muestran sus estados de error                                |

## Pendiente

- Probar en un navegador y contra la API real: arrastre con mouse, tacto y teclado, contraste de los gráficos en modo oscuro, lector de pantalla.
- Conectar Mercado Libre de verdad (A-86 del rediseño).
- Tarjeta de «Consultas sin atender» sigue acotada a las 50 tarjetas de la columna Nueva (DT-103).
