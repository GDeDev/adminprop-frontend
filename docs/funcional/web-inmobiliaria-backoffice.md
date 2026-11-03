# Mi sitio web — guía funcional (backoffice)

Solo los administradores ven «Mi sitio web» (menú lateral; en el celular, dentro de «Más»). Ahí se arma el sitio público de la inmobiliaria.

## Estado y dirección

Arriba se ve si el sitio está **Publicado**, en **Borrador con cambios** (está en línea pero hay cambios que el público no ve) o **Sin publicar** (nunca se publicó o se despublicó). Si ya tiene dirección, hay botones para copiarla y abrirla; si no, avisa que falta elegir un subdominio y lleva a esa pestaña.

## Elegir el diseño

Dos templates, **Clásico** y **Moderno**, con una maqueta de cómo se ven con sus colores. Al cambiar, el sistema pregunta si querés restaurar también los colores, la tipografía y las esquinas del template o conservar los tuyos; los textos y las imágenes siempre se conservan. Si tenías cambios sin guardar, se guardan junto con el cambio.

## Pestañas

- **Diseño**: cinco colores (con selector y código `#RRGGBB`), tipografía y esquinas. Un panel muestra en vivo si los colores se leen bien (texto sobre fondo y sobre tarjetas, color principal sobre fondo). Para publicar, los tres tienen que cumplir.
- **Contenido**: un desplegable por bloque (marca, contacto y redes, portada, pasos, propiedades destacadas, números, servicios, testimonios, preguntas, nosotros, buscadores). Las listas permiten agregar, quitar y mover. Cada texto muestra cuántos caracteres lleva y cuántos admite. Las imágenes se suben (JPG, PNG o WebP, hasta 5 MB) con vista previa y se pueden quitar. Todo es texto plano: no se interpreta HTML.
- **Secciones**: qué secciones se muestran en el inicio y en qué orden.
- **Dominio**: el subdominio gratuito (el sistema avisa mientras escribís si está disponible) y, opcionalmente, un dominio propio con las instrucciones para cargar el DNS. Se guardan **al instante**, cada uno con su botón; no dependen del borrador ni de publicar.
- **Vista previa**: el sitio tal como queda el borrador, a ancho de celular, tablet o computadora. En pantallas grandes aparece al costado. Se recarga sola después de cada guardado.

## Guardar y publicar

- **Guardar borrador** guarda lo que cambiaste sin que el público lo vea. Mientras haya cambios sin guardar se avisa, y si intentás salir (cerrar la pestaña o tocar otro menú) se pide confirmación.
- Si algo no es válido, el error aparece junto al campo y se abre el desplegable correspondiente; lo que no se puede ubicar se resume arriba.
- **Publicar** pide confirmación y, si hay cambios sin guardar, los guarda primero. Si falta algo (por ejemplo, título para buscadores o colores con poco contraste), muestra la lista de problemas.
- **Despublicar** (solo con el sitio en línea) pide confirmación; el público deja de verlo, pero no se pierde nada.

## Propiedades: operación, precio y características

En el alta y la edición de propiedades hay un paso nuevo, **Publicación**: operación (Alquiler o Venta, Alquiler por defecto), precio y moneda (sin precio el público ve «Consultar»), descripción pública, ambientes, dormitorios, baños, superficie total y cubierta (hasta 2 decimales) y antigüedad. Todos son opcionales; dejar un campo vacío lo borra. La ficha de la propiedad muestra estos datos. Esos datos son los que usa el sitio público.

## Dominio propio: cómo se verifica

1. En la pestaña **Dominio**, escribí tu dominio (por ejemplo `www.tuinmobiliaria.com.ar`) y guardalo. Queda **reservado**, pero el sitio todavía no responde ahí.
2. Aparece un registro **TXT** (un nombre y un valor). Cargalo en el DNS de tu dominio, en el panel donde lo compraste.
3. Cuando lo hayas cargado, tocá **Verificar dominio**. Los cambios de DNS pueden tardar un rato (a veces unas horas): si todavía no lo encuentra, te avisa y podés probar de nuevo.
4. Una vez verificado, el dominio es tuyo: ninguna otra inmobiliaria puede usarlo. Para que el sitio responda ahí falta además el registro **CNAME** que te indica el equipo de Adminprop.

Si cambiás o quitás el dominio, hay que volver a verificarlo. Esto evita que alguien reserve el dominio de otra persona.

«Mi sitio web» es solo para administradores: un empleado que entra por la dirección ve un aviso.
