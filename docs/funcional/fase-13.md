# Fase 13 — Automatizaciones (resumen funcional)

> Para quien no programa. El detalle técnico está en `docs/tecnica/fase-13.md`.

- **Tareas automáticas:** el sistema hace solo lo que antes había que acordarse de hacer: generar las cuotas del mes, traer los índices ICL e IPC, aplicar los aumentos de alquiler que vencen, avisar de cuotas atrasadas, de contratos y pólizas por vencer, de servicios sin pagar y de consolidados pendientes.
- **Configuración → Automatizaciones** (administradores): lista cada tarea con qué hace, cada cuánto corre, cuándo corrió por última vez, cómo le fue y cuándo vuelve a correr. Cada una se puede **ejecutar ahora**; las que trabajan por mes piden cuál. Abajo está el **historial** con lo que hizo cada corrida y los errores, filtrable por tarea y por estado.
- **Índices:** en Configuración → Índices se ve el último valor traído, de dónde salió y cómo fue el último intento, con un botón para **traer ahora**. Si la fuente falla, siempre queda la carga manual.
- **Avisos internos:** en el tablero aparece una tarjeta con lo que requiere atención (un aumento que no se pudo aplicar, un índice que no se trajo, una tarea que falló). Se marcan como leídos de a uno o todos juntos, y cada aviso lleva a la ficha correspondiente.
- **Todavía no:** los avisos por email a inquilinos y propietarios llegan con la Fase 14. Hasta entonces quedan registrados en el sistema.
