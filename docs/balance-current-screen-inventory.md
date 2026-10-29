# Balance · revisión integral Orgánico (UDS-017)

Estado: diseño aceptado por el usuario el 29 oct 2026 para comenzar BAL-041; sin adaptación nativa en este repositorio.
Fuente Balance inspeccionada: `64eddd6abcc69fe48b2f3eccb77fe56b9aef77ad`
(`origin/main`, fetch 27 oct 2026). El checkout local estaba 19 commits atrasado;
no se usa como evidencia del estado integrado. Diseño base aprobado:
`0f13affa256a68c00c1219323f9b157aa69de095` (UDS-012/PR13), publicado por UDS-013.
La release pública consultada ahora identifica `24e579dc4f7d86af223ef7d6be25350c196685b8`;
sus archivos Balance no tienen diferencias respecto de la base aprobada.

## Descubrimiento de navegación real

`apps/mobile/src/app/index.tsx` resuelve sesión hacia login o `(tabs)/logs`.
`(tabs)/index.android.tsx` redirige a logs. `logs.tsx` exporta daily-log-screen y
la resolución `.android.tsx` elige `native/native-daily-log-screen.tsx`, no su
exportación genérica legacy. `(tabs)/_layout.android.tsx` es Stack; Compose
conserva las cuatro vistas y el +. `BalanceDailyLogView.kt` y `WireframeScreens.kt`
son la autoridad de los destinos primarios y diálogos. Sus eventos se resuelven
en `native-daily-log-screen.tsx`; la búsqueda Android selecciona
`food-search.android.tsx` -> `native-food-entry-screen.tsx` -> `BalanceFoodEntryView.kt`.
Los siguientes paths se entienden relativos a `apps/mobile/` en ese SHA.

## Matriz de pantallas y estados

Cada fila identifica su entrada real, cobertura previa y diseño revisable.
Los destinos secundarios se abren desde Perfil o desde el selector externo
«Destino secundario» del mismo `/m/balance-style-studies`. No hay otro prototipo.

| Pantalla / flujo | Fuente conectada | Cobertura previa | Diseño y estados UDS-017 |
| --- | --- | --- | --- |
| Arranque / acceso | `src/app/index.tsx`, `login.tsx` | Faltaba | Acceso; invitado, cuenta recordada, otra cuenta, olvidar, ocupado y error. Las acciones solo simulan navegación. |
| Retorno de acceso | `auth-callback.tsx` | Faltaba | Retorno de acceso; espera, error de acceso en revisión, regreso al diario. No se rediseña Google ni se procesa un token. |
| Retorno de salida | `logout-callback.tsx`, `settings.tsx` | Faltaba | Salida -> acceso, estado no confirmado; el callback real redirige y el aviso proviene de Configuración. |
| Diario / fecha / semana | `BalanceDailyLogView.kt`, `WireframeDiary.kt` | Sí | Conserva cabecera compacta fecha/totales/semana, lista plegada/expandida, selección, vacío y nutrición parcial/desconocida. |
| Navegación / + | `WireframeScreens.kt`, `BalanceDailyLogView.kt` | Sí, incluía fixtures | Cuatro destinos + central sin texto; selector Alimento/Peso, peso desactivado. Excluye circunferencias. |
| Fecha diaria | `BalanceDailyLogView.kt` | Sí | Campo de fecha con selector nativo web, semana y regreso al día de referencia. No reproduce el DatePicker Android. |
| Detalle nutricional | `WireframeDiary.kt` | Sí | Consumo/meta, valores desconocidos y parciales; los objetivos numéricos del ejemplo siguen siendo ilustrativos. |
| Edición de consumo | `WireframeDiary.kt` + evento `edit-save`; también `src/app/food-edit.tsx` desde evento `edit` | Sí | Cantidad/unidad/hora, snapshot nutricional, selección múltiple; no editar identidad histórica. Estado no disponible se revisa externamente. |
| Selección / cambiar hora / borrar | `BalanceDailyLogView.kt` | Sí | Barra contextual, mover dentro del día, confirmación y cancelación, sin alterar otras fechas. |
| Buscar alimento | `BalanceFoodEntryView.kt` | Sí | Bibliotecas, personal/oficial, búsqueda sin coincidencias, selección y porción, estados carga/error/guardando revisables. |
| Registro desde etiqueta | `BalanceFoodEntryView.kt`, `food-entry-contract.ts` | Parcial | Base 100 g/ml o porción separada del consumo, nutrientes principales y sección opcional; selector de nutrientes adicionales representativos, no todo el catálogo nutricional nativo. |
| Salir de registro con borrador | `BalanceFoodEntryView.kt` | Faltaba | Descartar / seguir editando; diálogo con foco contenido y retorno al formulario. Cambiar tema/paleta conserva borrador. |
| Calendario de peso | `WireframeScreens.kt` | Sí, mezclaba circunferencias | Solo peso. Mes/año, fecha con/sin registro; fecha compartida al volver al diario. Seguimiento desactivado lleva a Perfil. |
| Registrar / editar / eliminar peso | `WireWeightDialog`, `src/app/weight-entry.tsx` | Faltaba borrado | Fecha, 1–500 kg en pasos 0,1, validación de fecha Santiago y confirmación de eliminación. |
| Resumen alimentación | `WireframeSummary.kt` | Sí | 7/30/90 días, fecha final, inspección y abrir registros; días sin datos distintos de cero. |
| Resumen cuerpo | `WireframeSummary.kt` | Parcial, mezclaba fixtures | Solo evolución de peso, inspección -> Mediciones. No incluye zonas corporales. |
| Perfil | `WireframeScreens.kt` | Anatomía sintética | Identidad de ejemplo, seguimiento de peso, unidades de lectura y herramientas. Sin editar nombre ni programar recordatorios. |
| Biblioteca | `src/app/(tabs)/library.tsx` | Faltaba | Buscar, filtrar personal/oficial, crear y abrir ficha; vacíos, carga y error. Clasificación de fixtures solo ilustrativa. |
| Ficha personal / nueva | `src/app/food-library-food.tsx` | Faltaba | Identidad/porción/hora/categoría, kcal/P/C/G, fibra/sodio/colesterol opcionales, sellos, validación, guardar y eliminar con confirmación. |
| Ficha oficial | Mismo componente con `isOfficial` | Faltaba | Lectura, campos inhabilitados, sin guardar ni eliminar. Se abre desde las filas oficiales. |
| Ficha ausente | Mismo componente, ID sin alimento | Faltaba | Estado «Registro no disponible» y regreso; no formulario editable para dato inexistente. |
| Cuenta / configuración | `src/app/settings.tsx` | Faltaba | Seguimiento, importación, invitado/autenticado y cerrar sesión; confirmación es una mejora propuesta de diseño. |
| Importar MacroFactor | `src/app/macro-factor-import.tsx` | Faltaba | Inicio, lectura, previsualización de cambios, filas inválidas, progreso, resultado y error recuperable; ejemplo explícito sin selección ni envío de archivos reales. |
| Errores de preferencias / peso | `WireframeScreens.kt`, proyección TS | Faltaba | Estado de error legible y recuperación de revisión; no se agrega un endpoint de reintento. |

## Exclusiones verificadas y sesiones

- `daily-log-screen.tsx` genérico exporta legacy; Android resuelve el archivo
  `.android.tsx`. No usar el nombre del archivo para inferir que legacy esté activo.
- `food-search.tsx` genérico enlaza `create-food` -> `food-portion`. Android
  resuelve `food-search.android.tsx`, que reemplaza ese camino con Compose.
- `date-picker.tsx` y `batch-move.tsx` siguen declaradas en Stack, pero sus entradas
  proceden de `date-strip-header` y `legacy-daily-log-screen`. Android usa sus
  diálogos Compose. No duplicar esas pantallas como destinos vigentes Android.
- La biblioteca sigue siendo una herramienta Expo activa, no el destino Alimentos.
- Los callbacks conservan compatibilidad heredada guardada en código; no son una
  nueva base de autenticación. Las tareas BAL-033/INF de identidad conservan ownership.
- Los diseños antiguos Vim/terminal y otros estudios registrados son referencias
  históricas; no se copian como navegación vigente del móvil.
- No había sesiones de documentos conectadas ni leases de preview activos al
  comenzar. Existía una sesión Zellij `code`; no se cerró ni alteró. Los worktrees
  UDS-015/016 y sus PRs son otros encargos, conservados.
- Los registros UDS-012/013 completados y BAL-040/ADR-007 prevalecen sobre hilos
  antiguos o worktrees retenidos. No se dispone de acceso a transcripts de otros
  hilos: no se afirma haberlos leído ni haber inspeccionado un teléfono conectado.

## Diagramación y variantes

El diario mantiene su estructura aprobada. La mejora se concentra en las
herramientas secundarias: un encabezado con regreso y título; contenido en grupos
con identidad/porción antes de nutrición; acción de guardado al pie sin tapar el
área desplazable. Separa editar la biblioteca de registrar consumo y cerrar sesión
de las preferencias cotidianas. La ficha oficial conserva el mismo orden en lectura.
La importación presenta primero archivo y cambios, luego acción/progreso/resultado.
Acceso prioriza la elección de cuenta o invitado y conserva errores junto a acciones.

«Superficies suaves» es la propuesta inicial: favorece orientación en formularios largos.
«Secciones abiertas» reduce contenedores para comparar densidad. Cambiar esta
variante no remonta formulario ni cambia sus datos. El riesgo expresivo sigue en
las cabeceras y acciones degradadas; las filas y campos sólidos mantienen lectura.
Outfit/Inter y roles de las cuatro paletas se reutilizan, sin una segunda identidad.

## Tema nativo y pendientes separados

| Preferencia objetivo Android | Diseño / límite |
| --- | --- |
| Apariencia: Sistema / Claro / Oscuro | Elección independiente de la fuente de color; el comparador ofrece claro/oscuro manual. |
| Colores: Sistema / Bosque / Laguna / Lavanda / Durazno | Cuatro parejas de roles existentes; Sistema nativo con Bosque de fallback. La web no lee el wallpaper ni la paleta Android. |

BAL-041 espera revisión de UDS-017 antes de refinar su plan y adaptar Compose en
Expo. Persistencia de preferencias, dynamic colors, TalkBack, IME/insets y aceptación
física pertenecen a esa tarea. No se inicia código, build, Metro, APK ni OTA Balance.
No se modifica backend, auth ni datos. Circunferencias, recordatorios, editar identidad
y cambiar unidades siguen siendo producto/backend aparte, sin autorizarlos desde
fixtures. Un estado de revisión no prueba que exista esa recuperación en producción.
La selección de nutrientes adicionales es representativa para diseñar el patrón;
la lista completa y sus unidades deben proceder del contrato nativo durante adopción.

## Verificación y revisión

La evidencia concreta de navegador, validadores, fuente/CI y plan de preview se
registra en el run UDS-017. El diseño completo sigue pendiente de revisión humana.
La preview pública temporal requiere aprobar su plan exacto; no es una release.

## Revisión de superficies y biblioteca — feedback del usuario

La primera extensión UDS-017 fue rechazada por sus marcos y la biblioteca como
tarjetas de botón repetidas. La nueva propuesta elimina bordes de las superficies
de contenido y fieldsets. Las secciones se separan por tono, espaciado y títulos;
los campos permanecen sólidos y el foco de teclado conserva su contorno visible.

Biblioteca ahora presenta búsqueda compacta, filtros Todas/Personal/Oficial,
creación mediante + en cabecera y una única lista continua. Cada fila alinea
nombre/porción/origen con energía por esa porción; no son valores por 100 g ni
una meta. No se añaden fotos o iconos genéricos repetidos. Los separadores son
secundarios. Los datos, clasificación y navegación reutilizan el modelo existente.
Se conserva la alternativa de secciones abiertas, también sin marcos exteriores.
El usuario acepta esta revisión el 29 oct 2026 y solicita comenzar la adaptación en Balance.
