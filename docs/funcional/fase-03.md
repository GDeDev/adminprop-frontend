# Fase 3 — Setup (resumen funcional)

> Para quien no programa. El detalle técnico está en `docs/tecnica/fase-03.md`.

Esta fase no agrega funciones nuevas: deja lista la "cáscara" visual sobre la
que se construyen todas las pantallas, con el diseño definido en la Fase 2.

## Cómo se ve

- Los colores, tipografías y formas son los del sistema de diseño de
  Adminprop: fondo cálido claro, azul marino como color principal, arena como
  acento, y títulos y montos en Outfit.
- **Modo claro y modo oscuro.** Por defecto sigue la configuración del
  teléfono o la computadora; hay un botón (sol/luna) para cambiarlo.
- **En el celular**, la navegación está abajo, al alcance del pulgar, con hasta
  cinco accesos. En el backoffice son Inicio, Propiedades, Contratos, Cobros y
  "Más", que abre un panel desde abajo con Propietarios, Inquilinos y
  Configuración.
- **En la computadora**, la navegación pasa a una barra lateral oscura a la
  izquierda.
- Los botones y campos tienen el tamaño mínimo recomendado para tocarlos con el
  dedo sin errar.
- Los estados se muestran siempre con los mismos colores: disponible (verde),
  alquilada (azul), en mantenimiento (ámbar), en mora (rojo) y borrador (gris).

## Cada inmobiliaria con su color

Cada inmobiliaria puede tener su propio color principal: botones y detalles de
toda la pantalla toman ese color, sin cambiar nada más del diseño. El texto
sobre ese color se elige solo para que se lea bien, sea el color claro u
oscuro. Por ahora todas usan el azul de Adminprop. El color de cada una se
aplica cuando exista el login (Fase 4).

## Portal de propietarios e inquilinos

El portal público (listado de propiedades) y las áreas de propietarios e
inquilinos usan el mismo diseño y la misma navegación: abajo en el celular, al
costado en la computadora. Las pantallas siguen diciendo "Próximamente" hasta
sus fases.

## Para revisar el diseño

Con el backoffice levantado en la computadora de desarrollo, la dirección
`/design-system` muestra todos los componentes, los colores, el modo oscuro y
un simulador para probar el color de otra inmobiliaria. Esa página no existe
en producción.

## Calidad

- Antes de cada cambio se corren automáticamente las revisiones de formato,
  de código y las pruebas relacionadas. Si algo falla, el cambio no se guarda.
- En GitHub, cada cambio propuesto pasa por las mismas revisiones y además se
  verifica que las dos aplicaciones se construyan bien.
