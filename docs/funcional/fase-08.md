# Fase 8 — Inquilinos y garantes (resumen funcional)

> Para quien no programa. El detalle técnico está en `docs/tecnica/fase-08.md`.

- **Inquilinos** en el menú: listado con búsqueda por nombre, apellido o DNI; cada uno muestra su garante, si tiene acceso al portal y un estado de pago que por ahora dice "Sin datos" (se completa cuando exista la parte de cobros).
- **Cargar un inquilino:** nombre, apellido, DNI o CUIT (avisa si ya está cargado), teléfono, email, dirección, fecha de ingreso, garante y observaciones. El garante se busca por nombre o DNI; si no existe, se crea ahí mismo sin salir del formulario y queda elegido.
- **Ficha del inquilino:** datos, botón de **WhatsApp** (abre el chat con el número ya formateado), el garante con sus datos y tipo de garantía (con link a su ficha), acceso al portal (contraseña que se muestra una sola vez, igual que propietarios) y los lugares donde van a aparecer el contrato y los pagos.
- **Garantes** tienen su propia pantalla: listado, ficha con los inquilinos que garantizan, alta y edición. Al elegir "Recibos de sueldo" se pide empleador e ingresos; con "Propiedad en garantía", el inmueble y sus datos. Una misma persona puede garantizar a varios inquilinos.
- **Eliminar:** sólo un administrador. Un inquilino con contrato activo no se puede eliminar; un garante asignado a algún inquilino, tampoco (primero se le cambia el garante al inquilino).
