# Previews automáticos por rama

Montar cada rama en una URL pública, para revisar mockups sin mergear a `main`.

**Estado: forma decidida.** El contexto de infraestructura se resolvió en la
discusión del PR #4; lo que queda es implementar.

> **Qué está verificado y qué no.** Lo que se afirma sobre la aplicación (base de
> Vite, rutas de wouter, ausencia de rutas absolutas, contenido de `ci.yml` y
> `deploy.sh`) está comprobado contra este repositorio. Los bloques de Nginx, el
> DNS y los certificados **no** están probados: se escribieron sin acceso a la
> máquina ni al panel de Cloudflare, y van marcados uno por uno.

---

## 1. Contexto

| Pieza | Dónde | Qué hace |
| --- | --- | --- |
| CI/CD | `.github/workflows/ci.yml` | Compila en `push`/`pull_request` a `main`. El job `deploy` corre sólo con `github.ref == 'refs/heads/main'`. |
| Despliegue | `deploy.sh` (en el VPS) | `git reset --hard origin/main`, `npm ci`, `npm run build`, `systemctl reload nginx`. |
| Servidor | Nginx en VPS OCI | Recursos **compartidos**. Configuración de Nginx y red gestionada y versionada declarativamente. |
| DNS / TLS | **Cloudflare** | Proxy activo, modo SSL **`Full (Strict)`**. |
| Secretos | GitHub Actions | `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` — **ya configurados y funcionando**. |

Por qué esto es barato: el sitio es una **SPA estática**, sin backend, sin base
de datos y sin variables de entorno por ambiente. Un preview no es un ambiente,
es **una carpeta de archivos estáticos**.

---

## 2. La forma: `<rama>-sandbox.shocker.cl`

Subdominio **plano de primer nivel**, no anidado bajo `sandbox`. La aplicación
sigue viviendo en `/`, así que **no requiere ningún cambio de código**: `base` de
Vite se queda por defecto y las rutas `/` y `/m/:id` de wouter no se tocan.

### 2.1 Por qué plano y no `<rama>.sandbox.shocker.cl`

El *Universal SSL* de Cloudflare cubre **un solo nivel** de subdominio:
`*.shocker.cl` sirve para `algo.shocker.cl`, pero **no** para
`algo.sandbox.shocker.cl`. Dos niveles exigen Advanced Certificate Manager. Con
nombre plano el certificado del edge alcanza sin planes extra.

### 2.2 El registro DNS tiene que ser `*.shocker.cl`

> ⚠️ **Corrección respecto de lo discutido en el PR.** No sirve crear un registro
> comodín `*-sandbox`. Los comodines de DNS (RFC 4592) sólo hacen match cuando el
> `*` es la etiqueta izquierda **completa**; un registro llamado literalmente
> `*-sandbox.shocker.cl` matchea sólo esa cadena literal, no `mi-rama-sandbox`.
> No existe el comodín parcial de etiqueta.
>
> Lo que hay que crear es un comodín de etiqueta completa:
>
> ```
> *.shocker.cl   A (o CNAME)   → origen, proxied
> ```
>
> Ese comodín cubre `mi-rama-sandbox.shocker.cl` y lo cubre Universal SSL.
> **Consecuencia a decidir a propósito:** un `*.shocker.cl` captura *todos* los
> subdominios de primer nivel que no tengan registro explícito. Si el dominio se
> usa para otras cosas, conviene revisar que no se pise nada.

También conviene **confirmar en el panel** que el comodín queda efectivamente
`proxied`. Cloudflare habilitó el proxy de registros comodín más allá de los
planes empresariales, pero verlo activo antes de depender de ello cuesta un
minuto y ahorra una tarde.

### 2.3 Los dos tramos de TLS resuelven cosas distintas

Esto conviene tenerlo separado en la cabeza, porque se confunde fácil:

| Tramo | Certificado | Qué resuelve |
| --- | --- | --- |
| Navegador ↔ edge de Cloudflare | **Universal SSL** (automático) | Es acá donde muerde el límite de un nivel. Por eso el nombre plano. |
| Cloudflare ↔ origen (VPS) | **Cloudflare Origin CA** | Hasta 15 años, sin cron de renovación ni credenciales de API en la máquina. Confiable porque el modo es `Full (Strict)`. |

Origin CA **no** rescata el nombre anidado: sólo cubre el tramo interno. El
nombre plano de 2.1 sigue siendo necesario.

Usar Origin CA en vez de `certbot` con DNS-01 elimina las renovaciones
periódicas y no deja tokens de API viviendo en el VPS. Se emite desde el panel de
Cloudflare.

---

## 3. Nginx

```nginx
# NO PROBADO — validar en el VPS
server {
    listen 443 ssl;
    http2 on;                     # `listen ... http2` quedó deprecado en nginx 1.25.1
    server_name ~^(?<rama>[a-z0-9-]+)-sandbox\.shocker\.cl$;

    ssl_certificate     /etc/ssl/certs/cloudflare-origin.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare-origin.key;

    root /var/www/previews/$rama;
    index index.html;

    add_header X-Robots-Tag "noindex, nofollow" always;

    location / {
        # Rama inexistente o ya borrada: 404 determinista en vez de que
        # try_files falle buscando un index.html que no existe.
        #
        # `if` dentro de `location` tiene mala fama, pero `return` es una de las
        # dos únicas directivas que la documentación de nginx declara seguras
        # ahí (la otra es `rewrite ... last`). Este uso es correcto.
        if (!-d /var/www/previews/$rama) {
            return 404;
        }
        try_files $uri $uri/ /index.html;
    }

    # Los assets de Vite van con hash en el nombre, así que se cachean sin
    # riesgo. El index.html NO: si se cachea, el preview sigue mostrando el
    # build anterior después del rsync y parece que el despliegue falló.
    location = /index.html {
        add_header Cache-Control "no-store" always;
        add_header X-Robots-Tag "noindex, nofollow" always;
    }
}
```

### 3.1 Caché de Cloudflare

Con el proxy activo, lo de arriba no basta por sí solo: conviene una **Cache
Rule** en Cloudflare que haga *bypass* de caché para el patrón de host de
previews (`*-sandbox.shocker.cl`). Sin eso el edge puede seguir sirviendo el
`index.html` viejo aunque el origen ya tenga el nuevo. Es el falso positivo más
probable de todo este montaje.

### 3.2 Endurecer el origen

Dado que ahora hay un comodín proxied apuntando al VPS, vale cerrar el origen
para que no se pueda entrar salteándose Cloudflare: restringir a los rangos IP de
Cloudflare o activar **Authenticated Origin Pulls**, y configurar `real_ip` para
que los logs muestren la IP real del visitante y no la del edge. Encaja bien con
que la configuración de Nginx se gestione declarativamente.

---

## 4. Compilar en Actions, no en el VPS

El VPS es de recursos compartidos, así que disparar `npm ci` + `npm run build`
por cada commit de cada rama activa puede saturar CPU y RAM. Actions ya compila
para validar: lo que falta es que **mande el `dist/`** en vez de que el VPS lo
reconstruya. `rsync` es rápido, liviano e idempotente.

De paso acelera el despliegue de `main`, que se puede migrar al mismo mecanismo
después. No es requisito para arrancar.

### 4.1 Slug de la rama

Las ramas traen `/` — por ejemplo `claude/composite-surface-diagnosis-8rnabl`.
Hay que normalizar a algo válido como etiqueta DNS: minúsculas, sólo `[a-z0-9-]`,
sin guion al principio ni al final.

> **Tope real: 55 caracteres, no 63.** El slug termina dentro de la etiqueta
> `<slug>-sandbox`, y una etiqueta DNS no pasa de 63. Con `-sandbox` ocupando 8,
> al slug le quedan 55. El ejemplo de arriba queda en
> `claude-composite-surface-diagnosis-8rnabl` (41), así que entra holgado.

### 4.2 Workflow de preview

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
            | cut -c1-55 | sed -E 's/-+$//')
          echo "slug=$slug" >> "$GITHUB_OUTPUT"
          echo "URL: https://$slug-sandbox.shocker.cl" >> "$GITHUB_STEP_SUMMARY"

      - uses: actions/setup-node@v4
        with:
          node-version-file: '.node-version'
          cache: 'npm'

      - run: npm ci
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

### 4.3 Preparación en el VPS

```bash
# NO PROBADO
sudo mkdir -p /var/www/previews
sudo chown -R "$USER":www-data /var/www/previews
```

El usuario de `SSH_USER` tiene que poder escribir ahí **sin `sudo`**: el rsync
desde Actions no es interactivo.

---

## 5. Limpieza

Dos mecanismos, porque uno solo no cubre todos los casos.

### 5.1 Al borrar la rama

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
            | cut -c1-55 | sed -E 's/-+$//')
          echo "slug=$slug" >> "$GITHUB_OUTPUT"

      - uses: webfactory/ssh-agent@v0.9.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}

      - run: |
          ssh -o StrictHostKeyChecking=accept-new \
            "${{ secrets.SSH_USER }}@${{ secrets.SSH_HOST }}" \
            "rm -rf --one-file-system /var/www/previews/${{ steps.slug.outputs.slug }}"
```

> **Detalle que muerde:** un workflow con `on: delete` sólo corre si el archivo
> existe **en la rama por defecto**. Hay que mergearlo a `main` para que
> funcione; no basta con tenerlo en la rama de trabajo.

### 5.2 Retención por antigüedad

Cubre lo que el anterior no ve: ramas abandonadas sin borrar, o borradas de forma
que el evento no llega.

```bash
# NO PROBADO — cron semanal en el VPS
find /var/www/previews -mindepth 1 -maxdepth 1 -type d -mtime +14 -exec rm -rf {} +
```

Se usa `-mindepth 1 -maxdepth 1` sobre el directorio en vez de `previews/*` con
`-maxdepth 0`: el glob falla si no hay nada y puede topar con `ARG_MAX` cuando
hay muchas carpetas. El `-mtime` de la carpeta lo refresca el rsync en cada
despliegue, así que mide bien la última actividad.

---

## 6. Alternativa descartada: subcarpeta `/p/<rama>/`

Se evaluó y se descartó. Queda anotado el porqué:

- Obliga a compilar con base dinámica (`--base=/p/<slug>/`) y a envolver el
  router en `<Router base={import.meta.env.BASE_URL…}>`, o sea deuda técnica en
  `wouter` a cambio de nada.
- Arrastra la fragilidad conocida de `alias` + `try_files` en Nginx para el
  fallback de SPA, que falla de formas silenciosas.
- Su única ventaja era evitar el certificado comodín, y Origin CA ya lo vuelve
  un trámite de una vez sin renovaciones.

---

## 7. Advertencias

- **Todo lo que se empuje a una rama queda públicamente legible.** Es un sandbox
  de diseño, así que probablemente da igual, pero conviene decidirlo a propósito
  y no por omisión. Si no da igual: `auth_basic` en el bloque de previews son
  tres líneas, o Cloudflare Access si se prefiere sin contraseñas compartidas.
- El `X-Robots-Tag` evita que Google indexe los previews.
- **El `sudo systemctl reload nginx` de `deploy.sh` sobra.** Nginx toma los
  estáticos nuevos al instante; recargar sólo hace falta si cambia la
  configuración.

---

## 8. Checklist

- [ ] Registro DNS `*.shocker.cl` → origen, **proxied** (verificar que el proxy quede activo)
- [ ] Revisar que el comodín no pise subdominios existentes de `shocker.cl`
- [ ] Emitir certificado **Cloudflare Origin CA** e instalarlo en el VPS
- [ ] Crear `/var/www/previews` con escritura para `SSH_USER` sin `sudo`
- [ ] Agregar el `server` block de Nginx (con el guard `-d` y el `no-store` del index)
- [ ] Cache Rule en Cloudflare: bypass de caché para `*-sandbox.shocker.cl`
- [ ] Cerrar el origen: rangos IP de Cloudflare o Authenticated Origin Pulls, y `real_ip`
- [ ] Agregar el workflow de preview
- [ ] Agregar el workflow de limpieza **y mergearlo a `main`**
- [ ] Cron semanal de retención por `-mtime`
- [ ] Probar: rama nueva → URL viva; recargar en duro una ruta `/m/<id>`; borrar rama → carpeta borrada
- [ ] Probar que un segundo push a la misma rama se ve reflejado (valida el bypass de caché)
- [ ] Opcional: migrar `main` al mismo rsync y simplificar `deploy.sh`
