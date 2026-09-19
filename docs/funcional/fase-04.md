# Fase 4 — Login y usuarios (resumen funcional)

> Para quien no programa. El detalle técnico está en `docs/tecnica/fase-04.md`.

## Backoffice

- Se entra con email y contraseña. Si algo está mal, aparece un mensaje claro: "Email o contraseña incorrectos", "La cuenta está bloqueada temporalmente" o "Demasiadas solicitudes, reintentá en unos segundos".
- Si alguien abre un link del sistema sin haber entrado, va al login y, después de ingresar, vuelve a la pantalla que quería ver.
- Arriba a la izquierda aparece el nombre de la inmobiliaria, y todo el sistema toma su color.
- Abajo del menú se ve quién está conectado y el botón para cerrar sesión (en el celular, arriba a la derecha).
- La sesión se renueva sola mientras se usa el sistema. Si se corta la conexión, no echa a nadie: muestra "Reintentar".

### Usuarios (sólo administradores)

En **Configuración → Usuarios** un administrador puede:

- ver a todos los administradores y empleados, y filtrar por rol o por activos/desactivados;
- crear un usuario con una contraseña inicial, que le pasa a la persona;
- editar nombre, apellido, email y rol;
- desactivar a alguien (queda afuera en el momento) y volver a activarlo;
- ponerle una contraseña nueva a quien se la olvidó.

Sobre su propio usuario, un administrador no puede desactivarse, cambiarse el rol ni resetearse la contraseña: así la inmobiliaria nunca se queda sin administrador. Los empleados no ven esta sección.

## Portal de propietarios e inquilinos

- Cada portal (propietarios, inquilinos) tiene su login, con el nombre y el color de la inmobiliaria.
- Se entra con email y contraseña. Un inquilino que intenta entrar al portal de propietarios no ve nada de ese portal.
- Las páginas públicas (propiedades disponibles) se siguen viendo sin entrar.
- Los accesos de propietarios e inquilinos se van a crear desde su ficha (Fases 7 y 8). Para probar ya hay un propietario y un inquilino de demo.
