# Balance · Diseño visual aceptado

UDS-012 · Aceptado el 20 de octubre de 2026 para pasar a planificación en Balance.
Referencia interactiva: `/m/balance-style-studies`, dirección **Orgánico**.
La documentación de [estilos y paletas](balance-style-studies.md) contiene los
valores; sus implementaciones están en `BalanceStyleStudies.css` y
`BalanceMaterialExpressive.css`.

## Decisiones cerradas

- Estilo Orgánico: superficies tonales, títulos Outfit y texto Inter, formas
  suaves relacionadas y degradados discretos. Material, Instrumental y Editorial
  quedan disponibles como exploraciones anteriores.
- Cabecera compacta: fecha, resumen diario y semana forman una sola unidad.
  El resumen se abre para consultar información completa; la lista conserva la
  mayor proporción de pantalla. La referencia web mide aproximadamente 164 px de
  cabecera y 588 px de lista dentro de un teléfono de 840 px. Estas medidas
  documentan la proporción, no fijan alturas en dp que impidan escalar el texto.
- Navegación Alimentos / Mediciones / + / Resumen / Perfil. La acción central
  muestra únicamente el icono +, con nombre accesible para lector de pantalla.
- Degradados en cabecera y acciones principales. Filas, campos y contenido de
  diálogos usan superficies sólidas; el color no representa valores nutricionales.
- Paletas Bosque, Laguna, Lavanda y Durazno, cada una con variantes clara/oscura.
  Bosque conserva la propuesta original y es el valor inicial del comparador.
- Cambiar estilo, paleta o apariencia conserva los registros, formularios,
  selección y filtros de análisis de la instancia actual.

## Preferencias para implementar en Android

La apariencia y la fuente del color son independientes:

| Preferencia | Opciones | Comportamiento objetivo |
| --- | --- | --- |
| Apariencia | Sistema / Claro / Oscuro | Seguir el modo del dispositivo o elegir uno explícitamente. |
| Colores | Sistema / Bosque / Laguna / Lavanda / Durazno | Usar Material You o una de las paletas propias. |

El punto de partida para el plan es Sistema en ambas preferencias y Bosque como
fallback cuando el dispositivo no ofrece color dinámico. Android 12+ permite
obtener el esquema dinámico; Android anterior conserva un esquema propio.
Los colores personalizados se mantienen independientes del fondo del dispositivo.

La preview web implementa los cuatro esquemas propios y el cambio manual
claro/oscuro. **No lee la paleta de Android ni implementa todavía las opciones
Sistema.** Son requisitos de la siguiente implementación nativa.

El modo Sistema debe resolver roles semánticos para superficies, texto, acciones,
selecciones, campos y diálogos. Los degradados también se derivan de ese esquema,
con contraste verificado sobre toda su extensión. Las paletas propias tienen
varios colores deliberadamente elegidos: generar un esquema desde una única
semilla no garantiza reproducirlas. La adaptación debe preservar su intención y
sus parejas de primer plano/fondo.

## Destino de implementación

Mantener la arquitectura de Balance BAL-040 / ADR-007: **Kotlin y Jetpack Compose
dentro de la aplicación Expo existente**. Compose controla la presentación,
gestos, listas, navegación principal y estados temporales de interacción.
TypeScript conserva los stores, identidad, persistencia, dominio y sincronización
existentes. Los eventos entre ambos siguen pasando por los adaptadores actuales.

Los puntos de entrada revisados para la planificación son:

- `apps/mobile/modules/balance-daily-log/android/src/main/java/expo/modules/balancedailylog/WireframeTheme.kt`:
  hoy crea un `darkColorScheme` desde colores fijos; será el primer lugar que
  revisar para una autoridad de tema común.
- `BalanceDailyLogView.kt`, `WireframeDiary.kt`, `WireframeSummary.kt` y las
  pantallas nativas relacionadas: adaptar composición, formas y roles sin
  trasladar el trabajo de gestos por frame a JavaScript.
- `apps/mobile/src/components/meal/native/interface-contract.ts` y los adaptadores
  de las vistas: evitar que el fondo del contenedor Expo y el tema nativo tengan
  paletas contradictorias; conservar contratos de datos y guardas de sesión.

## Entrada para el siguiente plan

1. Resolver el tema y dónde se guardan las dos preferencias mediante los contratos
   existentes; determinar si requieren una extensión de preferencias compartidas.
2. Aplicar la cabecera compacta, el + y los roles Orgánico en el módulo actual.
3. Incorporar colores del sistema, las cuatro paletas y sus degradados coherentes
   en todas las vistas, diálogos, barras y contenedores.
4. Validar en dispositivo: listas densas, texto ampliado, TalkBack, teclado,
   insets, contraste dinámico, conservación del estado y cambio de tema en vivo.
   Los cambios Kotlin requieren una nueva APK y su flujo de entrega verificado.

La tarea de Balance y su alcance se definirán al empezar esa planificación.
Este cierre no crea una migración completa a Kotlin ni nuevas capas de datos.
Las mediciones corporales, recordatorios y controles sintéticos que no tengan
contrato real requieren su propio análisis; no se convierten en funcionalidades
de producción por aparecer en un mockup.

## Evidencia y límites

La iteración visual comprobó los cuatro estilos y cuatro paletas en claro/oscuro
a 375/390 px, más escritorio, navegación, registro, diálogos, continuidad del
estado, teclado, reducción de movimiento y zoom al 200 %. El mínimo medido para
texto secundario sobre los degradados propios fue 4,77:1; para las acciones,
6,14:1. Los resultados detallados pertenecen al run UDS-012.

Estos controles corresponden al prototipo web. La aceptación visual permite
cerrar el diseño y planificar su implementación; no sustituye la validación
nativa ni afirma que Balance ya contenga estos estilos o colores dinámicos.

## Iteración integral pendiente — UDS-017

La aprobación anterior se conserva como base visual. UDS-017 extiende el mismo
comparador a las pantallas realmente conectadas de Balance Android; consultar
[inventario y decisiones de diagramación](balance-current-screen-inventory.md).
Esta extensión requiere revisión antes de refinar el plan BAL-041; no modifica
su arquitectura Compose/Expo ni autoriza implementar fixtures en producción.
