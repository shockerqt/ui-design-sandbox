# Agent-Driven Mockup Lifecycle (`ui-design-sandbox`)

Este repositorio está diseñado para **desarrollo guiado 100% por Agentes de IA**.
El usuario solicitará la creación o iteración de mockups mediante comandos naturales como:
- *"Quiero crear un mockup para [funcionalidad/pantalla]"*
- *"Quiero iterar el mockup [id-de-mockup]"*

## 🤖 Protocolo Autónomo del Agente

Cuando el usuario pida crear o iterar un mockup, el Agente DEBE seguir estos pasos sin requerir intervención manual del usuario:

### 1. Creación o Modificación del Componente
- Ubicación del componente: `src/mockups/<NombreComponente>.tsx`.
- Utilizar **React 19** y componentes **Base UI** (`@base-ui/react`: Tooltip, Dialog, Tabs, Switch, Accordion, Popover).
- Mantener una estética moderna, Dark Mode con acentos HSL, bordes translúcidos, glassmorphism (`backdrop-filter`) y micro-animaciones en `index.css`.
- Incluir estados interactivos reales (ej. abrir modales con Dialog, cambiar switches, alternar pestañas).
- Utilidades compartidas disponibles en `src/index.css`: clases `.glass-panel`, `.badge`,
  `.badge-primary`, `.base-Tooltip-popup`, `.base-Dialog-popup`, `.base-Switch-root`; y las
  variables `--primary`, `--success`, `--border-color`, `--text-main`, `--text-muted`,
  `--text-dim`, `--font-sans`, `--font-display`, `--font-mono`.

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
  - `codeSnippet`: Fragmento representativo del código fuente para copiar.

### 4. Verificación de Compilación
- Ejecutar `npm run build` para asegurar 0 errores de TypeScript y empaquetado Vite limpio.

### 5. Git & Despliegue Automático (CD)
- Hacer commit siguiendo *Conventional Commits*:
  - `feat: add <id> mockup` o `feat: iterate <id> mockup`
- Hacer `git push origin main`.
- GitHub Actions valida el build y luego ejecuta `deploy.sh` por SSH en la VPS OCI,
  que recompila y deja el bundle estático servido por Nginx en:
  `https://sandbox.shocker.cl`
