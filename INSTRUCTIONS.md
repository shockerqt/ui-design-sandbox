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

### 2. Registro Central (`src/mockups/registry.ts`)
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

### 3. Verificación de Compilación
- Ejecutar `npm run build` para asegurar 0 errores de TypeScript y empaquetado Vite limpio.

### 4. Git & Despliegue Automático (CD)
- Hacer commit siguiendo *Conventional Commits*:
  - `feat: add <id> mockup` o `feat: iterate <id> mockup`
- Hacer `git push origin main`.
- GitHub Actions desplegará automáticamente la nueva versión en:
  `http://oci2.shocker.cl:8082`

### 5. Actualización de Gobernanza
- Registrar el avance en el hito correspondiente dentro de `governance/milestones/`.
