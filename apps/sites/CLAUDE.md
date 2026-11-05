@AGENTS.md

# apps/sites

Sitios web públicos de las inmobiliarias (puerto 3003). Sin sesión, sin cookies. Spec: `adminprop-repo-files/specs/web-inmobiliaria.md`; doc: `docs/tecnica/web-inmobiliaria.md`.

- No usa los tokens del backoffice: el color sale del tema de cada sitio por variables CSS `--site-*`.
- Todo texto del usuario se renderiza como texto de React; nada de `dangerouslySetInnerHTML`.
