# Fase 7 — Propietarios (resumen funcional)

> Para quien no programa. El detalle técnico está en `docs/tecnica/fase-07.md`.

- **Propietarios** aparece en el menú. El listado se busca por nombre, apellido o DNI (sin importar acentos ni puntos) y muestra cuántas propiedades tiene cada uno, cuántas están alquiladas, si le toca el honorario reducido y si ya tiene acceso al portal.
- **Cargar uno:** nombre, apellido, DNI o CUIT, teléfono, email, dirección, observaciones y, si se quiere, la cuenta bancaria. Mientras se escribe el DNI, el sistema avisa si ya está cargado (con link a esa ficha). Si el CBU coincide con el de otro propietario, avisa pero deja guardar.
- **Ficha:** datos, cuenta bancaria, sus propiedades (con estado y link), acceso al portal y el lugar para las liquidaciones futuras.
- **Cuenta bancaria:** se cambia con su propio botón "Cambiar", separado de la edición de los datos personales. Cada cambio queda registrado.
- **Acceso al portal:** el botón "Generar acceso" crea el usuario (su email) y muestra la contraseña **una sola vez**, con un botón para copiarla. Si la pierde, "Nueva contraseña" genera otra y la anterior deja de servir. Sin email cargado, el botón no se habilita.
- **Eliminar:** sólo un administrador y sólo si no tiene propiedades asignadas.
- **En las propiedades:** al cargar o editar una propiedad, el paso "Propietario" ahora permite buscarlo y elegirlo (o dejarlo sin asignar). La ficha de la propiedad muestra su propietario con link.
