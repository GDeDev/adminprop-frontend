# Fase 24 — Tasación automática de alquiler

En la ficha de cada propiedad, el botón «Sugerir precio» calcula un precio de alquiler a partir de los avisos vigentes de la zona. Se puede indicar la superficie, los ambientes y la moneda; si todavía hay pocos datos de la zona, el sistema avisa pero deja intentar igual. El resultado muestra el precio sugerido dentro de un rango, qué tan confiable es (alta, media o baja), cuántos avisos se usaron, qué antigüedad tiene el más viejo y una explicación en palabras. Es sólo una sugerencia: no cambia el precio de la propiedad, y se puede descartar. Si no hay datos suficientes o se llegó al límite diario de tasaciones, se muestra el motivo en el mismo lugar.

Debajo queda el historial de tasaciones de la propiedad, con fecha, quién la pidió y el rango. Si se repite exactamente la misma tasación en pocas horas, se muestra la anterior en vez de crear otra.

En Configuración → Automatizaciones, el administrador ve la tarjeta «Datos de mercado» con el estado de cada fuente de avisos (al día, desactualizada, bloqueada, con error de lectura o desactivada), cuándo ingresaron datos por última vez y cuántos avisos vigentes tiene.
