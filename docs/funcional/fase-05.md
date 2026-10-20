# Fase 5 — Maestros (resumen funcional)

> Para quien no programa. El detalle técnico está en `docs/tecnica/fase-05.md`.

En **Configuración → Maestros** están las listas que aparecen en los desplegables del sistema, una pestaña por cada una: tipos de propiedad, amenities, tipos de operación, tipos de servicio y ubicaciones.

- **Los administradores** pueden agregar un valor (botón "Agregar"), cambiarle el nombre (lápiz) y activarlo o desactivarlo (interruptor). A las amenities se les puede poner un ícono.
- **Los empleados** ven las listas pero no las cambian.
- **Desactivar no borra:** el valor deja de ofrecerse en las altas nuevas, pero lo que ya lo usa lo sigue mostrando, con la aclaración "(desactivado)".
- **Ubicaciones:** se ven como un árbol que se abre y se cierra (País → Provincia → Localidad → Barrio). Con el "+" de cada una se agrega lo que va adentro: una localidad dentro de una provincia, un barrio dentro de una localidad. Si se reactiva algo cuya ubicación de arriba está desactivada, el sistema lo permite pero avisa que no va a aparecer en los desplegables hasta reactivar también la de arriba.

Estos desplegables los van a usar las pantallas de las próximas fases: alta de propiedades, contratos y servicios.
