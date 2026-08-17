# Propuesta: previews automáticos por rama

Montar cada rama en una URL pública, para revisar mockups sin mergear a `main`.

> **Qué está verificado y qué no.** Todo lo que se afirma sobre la aplicación
> (base de Vite, rutas de wouter, ausencia de rutas absolutas, contenido de
> `ci.yml` y `deploy.sh`) está comprobado contra este repositorio. Los bloques
> de Nginx, el DNS y el certificado **no** están probados: se escribieron sin
> acceso a la máquina y hay que validarlos en el VPS. Están marcados uno por uno
> más abajo.

---

## 1. Situación actual

| Pieza | Dónde | Qué hace |
| --- | --- | --- |
| CI/CD | `.github/workflows/ci.yml` | Compila en `push`/`pull_request` a `main`. El job `deploy` corre sólo con `github.ref == 'refs/heads/main'`. |
| Despliegue | `deploy.sh` (en el VPS) | `git reset --hard origin/main`, `npm ci`, `npm run build`, `systemctl reload nginx`. |
| Servidor | Nginx en VPS OCI | Sirve `dist/` de un único directorio de trabajo, con fallback a `index.html`. |
| Secretos | GitHub Actions | `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` — **ya configurados y funcionando**. |

## 2. Por qué esto es barato

El sitio es una **SPA estática**: sin backend, sin base de datos y sin variables
de entorno por ambiente. Un preview no es un ambiente, es **una carpeta de
archivos estáticos**. Eso es lo que separa este caso de un proyecto de
plataforma, y es la razón de que la estimación sea de horas y no de días.

Que los secretos SSH ya existan y funcionen elimina la parte que suele consumir
más tiempo.

## 3. La decisión que gobierna todo lo demás

**¿Quién administra el DNS de `shocker.cl`?**

- Proveedor con plugin de certbot (Cloudflare, Route53, DigitalOcean, …)
  → **Opción A (subdominio)**. Media hora para el certificado comodín.
- Panel sin API para DNS-01 → **Opción B (subcarpeta)**. El comodín se vuelve
  renovación manual cada 90 días, que no se sostiene.

Todo lo de la sección 5 es común a ambas y se puede empezar sin haber decidido.

---

## 4. Las dos opciones

### Opción A — subdominio: `<rama>.sandbox.shocker.cl` *(recomendada)*

**Cambios en la aplicación: ninguno.** El sitio sigue en `/`, `base` de Vite se
queda por defecto y las rutas `/` y `/m/:id` de wouter no se tocan.

```nginx
# NO PROBADO — validar en el VPS
server {
  listen 443 ssl;
  server_name ~^(?<rama>[a-z0-9-]+)\.sandbox\.shocker\.cl$;

  root /var/www/previews/$rama;

  ssl_certificate     /etc/letsencrypt/live/sandbox.shocker.cl-wildcard/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/sandbox.shocker.cl-wildcard/privkey.pem;

  # Los previews no se indexan
  add_header X-Robots-Tag "noindex, nofollow" always;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Certificado comodín (Let's Encrypt **no** emite comodines por HTTP-01, tiene que
ser DNS-01):

```bash
# NO PROBADO — el plugin depende del proveedor DNS
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  -d '*.sandbox.shocker.cl' \
  --cert-name sandbox.shocker.cl-wildcard
```

Más un registro DNS `A` comodín: `*.sandbox` → IP del VPS.

**La propiedad que lo hace barato de mantener:** con `root` variable, Nginx se
configura **una sola vez**. Cada rama nueva aparece como carpeta y su URL
funciona sin tocar el servidor ni recargar nada.

- ✅ Cero cambios de código; Nginx limpio; ninguna acción por rama.
- ⚠️ Requiere DNS comodín y certificado por DNS-01.

### Opción B — subcarpeta: `sandbox.shocker.cl/p/<rama>/`

Parece la barata, pero el costo se mueve de sitio en vez de desaparecer.

**Sí requiere cambios en la aplicación.** Dos, ambos chicos:

1. Compilar con base por rama: `npm run build -- --base=/p/<slug>/`
2. Enseñarle la base al router, en `src/App.tsx`:

```diff
-import { Link, Route, Switch } from 'wouter';
+import { Link, Route, Router, Switch } from 'wouter';

 export const App: React.FC = () => (
+  <Router base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
     <Switch>
       <Route path="/" component={Index} />
       <Route path="/m/:id">{params => <MockupRoute id={params.id} />}</Route>
       <Route>{() => <NotFound />}</Route>
     </Switch>
+  </Router>
 );
```

Verificado en este repo: no hay `fetch` a rutas absolutas ni `src` absolutos, y
los `Link href="/"` de `App.tsx` y `MockupViewer.tsx` los reescribe wouter solo
al declarar la base. No hay nada más que ajustar.

```nginx
# NO PROBADO — y ESTA es la parte delicada de esta opción.
# `alias` combinado con `try_files` es un footgun conocido de Nginx:
# el fallback de SPA falla de formas silenciosas. Probar bien.
location ~ ^/p/(?<rama>[^/]+)(?<resto>/.*)?$ {
  alias /var/www/previews/$rama/;
  add_header X-Robots-Tag "noindex, nofollow" always;
  try_files $resto $resto/ /p/$rama/index.html;
}
```

- ✅ Sin DNS ni certificado nuevo; el certificado actual sirve.
- ⚠️ Cambios en la app, y el Nginx es **más** frágil que el de la opción A, no menos.

---

## 5. Trabajo común a las dos opciones

### 5.1 Compilar en Actions, no en el VPS

Hoy `deploy.sh` hace `npm ci` y `npm run build` **en la máquina**. Con varias
ramas activas eso satura un VPS chico. Actions ya compila para validar: lo que
falta es que mande el `dist/` en vez de que el VPS lo reconstruya.

De paso acelera el despliegue de `main`. Se puede migrar `main` a este mismo
mecanismo después; no es requisito para arrancar.

### 5.2 Slug de la rama

Las ramas traen `/` — por ejemplo `claude/composite-surface-diagnosis-8rnabl`.
Hay que normalizar a algo válido como etiqueta DNS y como nombre de carpeta:
minúsculas, sólo `[a-z0-9-]`, sin guion al principio ni al final, máximo 63
caracteres. El ejemplo queda en `claude-composite-surface-diagnosis-8rnabl`.

### 5.3 Disparar en cualquier rama

En `ci.yml`, hoy:

```yaml
on:
  push:
    branches: [ main ]
```

y el job de deploy con `if: github.ref == 'refs/heads/main'`. Ambos se abren.

### 5.4 Borrar el preview cuando se borra la rama

Sin esto el disco se llena solo.

> **Detalle que muerde:** un workflow con `on: delete` sólo corre si el archivo
> existe **en la rama por defecto**. Hay que mergearlo a `main` para que
> funcione; no basta con tenerlo en la rama de trabajo.

### 5.5 Preparación en el VPS

```bash
# NO PROBADO
sudo mkdir -p /var/www/previews
sudo chown -R "$USER":www-data /var/www/previews
```

El usuario de `SSH_USER` tiene que poder escribir ahí sin `sudo`, porque el
rsync desde Actions no es interactivo.

### 5.6 Esqueleto del workflow

```yaml
# NO PROBADO — la sintaxis de Actions está bien; falta validar rsync y permisos
name: Preview por rama

on:
  push:
    branches-ignore: [ main ]

concurrency:
  group: preview-${{ github.ref }}
  cancel-in-progress: true

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - id: slug
        run: |
          slug=$(echo "${GITHUB_REF_NAME}" \
            | tr '[:upper:]' '[:lower:]' \
            | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' \
            | cut -c1-63 | sed -E 's/-+$//')
          echo "slug=$slug" >> "$GITHUB_OUTPUT"

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'npm'

      - run: npm ci

      # Opción A: sin --base. Opción B: --base=/p/${{ steps.slug.outputs.slug }}/
      - run: npm run build

      - uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - run: |
          ssh -o StrictHostKeyChecking=accept-new \
            "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" \
            "mkdir -p /var/www/previews/${{ steps.slug.outputs.slug }}"
          rsync -az --delete dist/ \
            "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}:/var/www/previews/${{ steps.slug.outputs.slug }}/"
```

Y la limpieza, que **debe vivir en `main`**:

```yaml
# NO PROBADO
name: Limpiar preview
on: delete

jobs:
  cleanup:
    if: github.event.ref_type == 'branch'
    runs-on: ubuntu-latest
    steps:
      - id: slug
        run: |
          slug=$(echo "${{ github.event.ref }}" \
            | tr '[:upper:]' '[:lower:]' \
            | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g' \
            | cut -c1-63 | sed -E 's/-+$//')
          echo "slug=$slug" >> "$GITHUB_OUTPUT"

      - uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - run: |
          ssh -o StrictHostKeyChecking=accept-new \
            "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" \
            "rm -rf --one-file-system /var/www/previews/${{ steps.slug.outputs.slug }}"
```

---

## 6. Estimación

**Media jornada** en cualquiera de las dos. Cambia dónde se va el tiempo:

| | Opción A (subdominio) | Opción B (subcarpeta) |
| --- | --- | --- |
| DNS + certificado | ~30 min con plugin; inviable sin API | 0 |
| Nginx | Trivial | La parte frágil: `alias` + `try_files` |
| Cambios en la app | Ninguno | 2 (base de Vite + `Router base`) |
| Mantención por rama | Ninguna | Ninguna |

## 7. Advertencias

- **Todo lo que se empuje a una rama queda públicamente legible.** Es un sandbox
  de diseño, así que probablemente da igual, pero conviene decidirlo a
  propósito y no por omisión. Si no da igual: `auth_basic` en el bloque de
  previews resuelve, y son tres líneas.
- El `X-Robots-Tag` de los ejemplos evita que Google indexe los previews.
- **El `sudo systemctl reload nginx` de `deploy.sh` sobra.** Nginx toma los
  estáticos nuevos al instante; recargar sólo hace falta si cambia la
  configuración. No es urgente, pero es ruido que conviene sacar.
- Vale la pena poner un tope de retención (borrar previews sin actividad en
  N días) además del borrado por rama, para las ramas que se abandonan sin
  eliminarse.

## 8. Checklist

- [ ] Confirmar el proveedor DNS de `shocker.cl` → decide A o B
- [ ] Crear `/var/www/previews` con permisos de escritura para `SSH_USER`
- [ ] **A:** registro `A` comodín `*.sandbox` + certificado por DNS-01
- [ ] **B:** aplicar el diff de `App.tsx` y compilar con `--base`
- [ ] Agregar el bloque de Nginx y validar el fallback de SPA con una ruta `/m/<id>` recargada en duro
- [ ] Agregar el workflow de preview
- [ ] Agregar el workflow de limpieza **y mergearlo a `main`**
- [ ] Probar: rama nueva → URL viva; borrar rama → carpeta borrada
- [ ] Opcional: migrar `main` al mismo mecanismo de rsync y simplificar `deploy.sh`
