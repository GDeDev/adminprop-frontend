# Sitios web de las inmobiliarias (funcional, lo que ve el público)

Cada inmobiliaria con el sitio publicado tiene una dirección propia (un subdominio de Adminprop o su dominio) donde cualquier persona puede ver sus propiedades y escribirle. La configuración se hace desde **Mi sitio web** en el backoffice (ver [`web-inmobiliaria-backoffice.md`](web-inmobiliaria-backoffice.md)).

## Qué ve la persona que visita

- **Inicio**: portada con el buscador, cómo funciona, propiedades destacadas, números, servicios, testimonios, preguntas frecuentes, «sobre nosotros» y contacto. La inmobiliaria elige qué secciones se muestran y en qué orden.
- **Propiedades**: listado con filtros (operación, tipo, zona, precio, moneda, dormitorios) y páginas. La búsqueda queda en la dirección del navegador: se puede compartir.
- **Ficha**: fotos con galería, datos (ambientes, dormitorios, baños, superficies, antigüedad), descripción, comodidades, WhatsApp y formulario de consulta, y propiedades parecidas.
- **Contacto**: dirección, horarios, teléfono, WhatsApp, redes y formulario.
- Botón flotante de WhatsApp si la inmobiliaria cargó su número.

## Dos estilos

- **Clásico**: oscuro y cálido, portada a pantalla completa con el buscador en una tarjeta translúcida.
- **Moderno**: claro y limpio, barra de búsqueda horizontal y tarjetas con aire.

Los dos muestran lo mismo; cambian el diseño. Los colores, la tipografía y las esquinas los elige cada inmobiliaria.

## Reglas

- Una propiedad **Disponible** aparece; si se alquila o entra en mantenimiento, desaparece sola en un minuto. Sin precio se muestra «Consultar».
- Las consultas llegan a la bandeja de consultas del backoffice (con el aviso de siempre). El formulario tiene protección anti-spam y un límite de envíos por hora.
- Si el sitio no está publicado, o la dirección no existe, se ve «No encontramos este sitio».
- Una propiedad que ya no está disponible muestra «No encontramos esta página» con un botón para volver al inicio.
- El sitio funciona en celular, tableta y escritorio, y se puede usar con teclado y lector de pantalla.

- Cuando la inmobiliaria publica un cambio, el sitio se actualiza en la próxima visita (antes podía tardar un par de minutos).
- Si el servicio tiene un problema momentáneo, el sitio sigue mostrando la última versión buena en vez de un error.
- La paginación del listado muestra los números de página, y un rango de precio al revés se corrige solo.
