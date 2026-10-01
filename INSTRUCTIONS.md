# Agent-Driven Mockup Lifecycle (`ui-design-sandbox`)

Este repositorio está diseñado para **desarrollo guiado 100% por Agentes de IA**.
El usuario solicitará la creación o iteración de mockups mediante comandos naturales como:
- *"Quiero crear un mockup para [funcionalidad/pantalla]"*
- *"Quiero iterar el mockup [id-de-mockup]"*

## Protocolo Autónomo del Agente

Cuando el usuario pida crear o iterar un mockup, el Agente DEBE seguir estos pasos sin requerir intervención manual del usuario:


### 1. Creación o Modificación del Componente
- Ubicación del componente: `src/mockups/<NombreComponente>.tsx`.
- Utilizar **React 19** y componentes **Base UI** (`@base-ui/react`: Tooltip, Dialog, Tabs, Switch, Accordion, Popover).
- Incluir estados interactivos reales (ej. abrir modales con Dialog, cambiar switches, alternar pestañas).

> **No inventar atributos de Base UI.** Antes de escribir un selector `[data-*]`
> o de leer una variable CSS de una primitiva, consultar la documentación:
>
> - **Índice**: `https://base-ui.com/llms.txt` — lista los `.md` de cada componente.
> - **Componente**: `https://base-ui.com/react/components/<nombre>.md` — trae la
>   tabla de atributos y variables CSS por parte. Preferir el `.md` sobre la
>   página HTML.
>
> Ya paso una vez: el CSS enganchaba `.base-Tabs-tab[data-selected]`, atributo
> inexistente. El real es `data-active`, y esta documentado en `tabs.md`. El fallo
> es silencioso —compila y no lanza errores—, solo se ve como un estilo que nunca
> se aplica, asi que no basta con que el build pase.
>
> Atributos ya verificados contra el DOM real: `data-active` (Tabs.Tab),
> `data-checked` (Switch.Root), `data-panel-open` (Accordion.Trigger),
> `data-popup-open` (triggers de Dialog y Popover).

**Sistema visual.** El shell es un instrumento que se retira: cromo en grafito
estrictamente neutro, para que no contamine cómo se lee el mockup. Un mockup puede
tener la estética que quiera, pero si usa los tokens del shell hereda coherencia:

- Cromo: `--ink` `--rail` `--rail-hi` `--line` `--line-soft`
- Texto: `--fg` `--fg-quiet` `--fg-faint`
- Señal única (ocre, solo en afordancias, nunca decorando): `--signal`
- Tipografía: `--font-display` (Archivo variable, usar `font-variation-settings`
  con el eje `wdth`), `--font-ui` (Inter), `--font-mono` (JetBrains Mono)
- Clases: `.display` `.mono` `.label` `.badge` `.rail-btn`, y las primitivas
  `.base-Switch-*` `.base-Tabs-*` `.base-Accordion-*` `.base-Dialog-*`
  `.base-Tooltip-popup` `.base-Popover-popup`

El mockup se renderiza a ancho completo bajo un riel de 48px, sin caja ni sombra.
No asumir un contenedor angosto: el mockup ocupa toda la página. **Debe traer su
propio fondo**, porque el visor no le pone ninguno.

Para variar el estilo sin tocar la estructura existe el **sistema de pieles**:
envolver el mockup en `.skin` mas una clase de tema (`.skin-tabla`,
`.skin-cocina`, `.skin-ficha`, `.skin-editorial`, `.skin-nocturno`) y leer todo
desde las variables `--sk-*`:

- Color: `--sk-bg` `--sk-panel` `--sk-ink` `--sk-quiet` `--sk-faint` `--sk-tint`
  `--sk-line` `--sk-accent` `--sk-signal`
- Tipografia: `--sk-font-display` `--sk-font-ui` `--sk-wdth` `--sk-case` `--sk-tracking`
- Forma: `--sk-radius` `--sk-rule-heavy` `--sk-rule-mid` `--sk-meter` `--sk-border`

Las primitivas Base UI se re-tiñen solas bajo `.skin`, incluidas las pieles
oscuras. Los helpers `display()`, `plain()`, `Rule` y `RuleMeter` de
`mockups/nutrition/parts.tsx` ya consumen estas variables: **no fijar colores,
pesos de filete ni `text-transform` en el componente**, o la piel deja de aplicar.

Agregar una piel nueva son ~18 lineas: un bloque de variables en `index.css` y
una entrada en `SKINS` dentro del mockup. Ver `NutritionApp.tsx`.

### 2. Ruteo
- Cada mockup queda disponible en su propia URL: `/m/<id>`.
- El ruteo usa **wouter** y vive en `src/App.tsx`. Registrar el mockup en el registry
  es suficiente: la ruta se resuelve sola desde `mockupRegistry` por `id`.
- Un `id` inexistente cae en la vista `NotFound`, no en pantalla en blanco.

> **Requisito de servidor** (ya satisfecho): al ser rutas limpias (sin `#`), Nginx debe
> hacer fallback a `index.html` o cualquier link directo a `/m/<id>` devolveria 404.
> Ya está presente en `/etc/nginx/sites-available/sandbox.shocker.cl` en la VPS:
> ```nginx
> location / {
>   try_files $uri $uri/ /index.html;
> }
> ```
> Anotado por si el servidor se reconstruye desde cero.

### 3. Registro Central (`src/mockups/registry.ts`)
- Registrar o actualizar la entrada en `mockupRegistry`:
  - `id`: slug en kebab-case.
  - `title`: Título legible.
  - `category`: Base UI Primitives, Dashboards, SaaS & Pricing, Settings & Modals, o Fintech & Cards (o nueva categoría).
  - `description`: Resumen claro de conceptos de UI probados.
  - `tags`: Etiquetas clave.
  - `version`: Incremento semántico (ej. `v1.0.0` -> `v1.1.0`).
  - `updatedAt`: Fecha actual (YYYY-MM-DD).
  - `component`: Referencia al componente React.

### 4. Verificación y artefacto
- Usar la tarea, rama y run de Governance. En ChatGPT Web, registrar el perfil
  remoto y consultar la evidencia de CI del SHA exacto; no declarar pruebas
  locales que el conector no puede ejecutar.
- CI ejecuta los tests de empaquetado, `npm ci` y `npm run build` una sola vez.
  Publica un artefacto identificado por SHA de origen y ejecución de Actions.
- El archivo incluye `release.json`. El digest del tar.gz y el digest del
  contenedor de Actions son identidades distintas y deben conservarse separados.

### Preview temporal del worktree

Para revisar cambios antes del merge, puedes pedir: *"Muéstrame una preview de
los cambios de esta tarea en `/m/<id>`"*.

- El agente debe leer la tarea canónica y su run, confirmar la rama y el
  worktree exclusivos de UDS y elegir la ruta del mockup que se va a revisar.
- Seguir el [runbook de previews de Infrastructure](https://github.com/shockerqt/infrastructure/blob/ff06c34bbeeb4327c409987057215078618912cd/runbooks/workspace-preview-session.md).
  Su ruta propietaria es `infrastructure/runbooks/workspace-preview-session.md`;
  el enlace fija la versión revisada de INF-013 mientras su PR está pendiente.
  Resolver el repositorio desde `governance/projects.yaml` y consultar la tarea
  INF-013 y su último run, incluso si sus registros siguen en su rama de tarea.
- Comprobar la instalación y las sesiones existentes. Preparar `plan` con el
  ID de la tarea UDS, su worktree, perfil `vite`, ruta `/m/<id>` y plazo `2h`.
  Si falta la instalación o un registro canónico, resolverlo siguiendo el
  runbook antes de iniciar; no usar otro checkout ni inventar una tarea.
- Revisar el plan, el estado de red y el rollback. Obtener aprobación explícita
  para iniciar la sesión pública, salvo que ya exista para ese plan exacto.
  La aprobación para editar un mockup no autoriza exponerlo públicamente.
- El controlador ejecuta `npm run build` y sirve el resultado estático en un
  puerto asignado de 8083-8085, con vencimiento independiente. El plazo
  predeterminado es de dos horas y el máximo de ocho. Durante la sesión, la URL
  usa HTTP público sin autenticación ni TLS; revisar ese alcance en el plan.
- Verificar la ruta por loopback y por la URL pública. Consultar
  `status --lease-id ID`, exigir exactamente un resultado en `.sessions` y
  comprobar esa sesión mediante `.sessions[0]`.
  Entregar al usuario la URL verificada, el ID completo de la sesión y su
  vencimiento; guardar la evidencia en el run.
- Tras nuevas ediciones, detener esa sesión por su ID completo y solicitar un
  nuevo inicio para reconstruir los cambios. `renew` solo prolonga el plazo.
  Al terminar la revisión, detenerla o verificar su expiración y limpieza según
  el runbook. La preview temporal no activa una release en `sandbox.shocker.cl`.
- Este procedimiento requiere ejecución local en el host. Un agente que solo
  tiene el conector GitHub prepara el plan y registra esa limitación; no afirma
  haber iniciado ni comprobado una preview que no puede operar.

### 5. Publicación y entrega
- Crear un commit Conventional Commits en la rama exclusiva de la tarea,
  abrir/reutilizar su PR y comprobar CI sobre el SHA que se integrará.
- El servidor recibe el artefacto validado; no hace fetch de main ni recompila.
- La entrega por artefactos está en implementación bajo UDS-007 e INF-014.
  Este cambio retira el job antiguo que recompilaba por SSH. Mantener el PR en
  draft hasta revisar el procedimiento de instalación y migración del host.
- El despliegue debe verificar SHA/digest, hacer activación con estado esperado,
  comprobar HTTPS y disponer de rollback a la release previa sin reconstruirla.
  Ver `docs/artifact-delivery.md` y los runbooks de Infrastructure.
