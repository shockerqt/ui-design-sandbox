# Pieza: SID, press banca, caucho entero y camas

Simulación `/m/bedroom-floor-plan`, UDS-015, 22 de octubre de 2026. Código: [BedroomFloorPlan.tsx](../src/mockups/BedroomFloorPlan.tsx). Reutiliza SID/Ruler/BENCH de [ApartmentFloorPlan.tsx](../src/mockups/ApartmentFloorPlan.tsx); sus defaults mantienen el estudio trasero A/B del living. Fuentes de productos y limitaciones de anatomía: [referencias del departamento](apartment-floor-plan.md#productos-y-fuentes-reunidas).

Todas las cotas en cm. Origen en esquina izquierda del ventanal, `x` derecha, `y` hacia pared opuesta.

## Datos del usuario y supuestos

| Elemento | Dimensión / posición |
| --- | --- |
| Pieza | **280 × 350**, ventanal sobre pared de 280 en `y=0` |
| Pilar inferior derecho | **60 × 60**, `x=220..280`, `y=290..350` |
| Puerta | **70** confirmado, pared derecha justo encima del pilar: `y=220..290` |
| Giro de puerta | Usuario indica hacia pilar; bisagra supuesta `(280;290)`, extremo abierto a90° `(210;290)`. Confirmar sentido exacto/offset; no se asume grosor ni manilla. |
| Camas alternativas | **200 × 110** y **200 × 90**, usadas como envolventes exteriores; confirmar si las medidas corresponden solo al colchón |
| Caucho | **200 × 200**: cuatro planchetas100×100 enteras, sin cortes |
| TV izquierda | **42″**, saliente **7**, a **95** del ventanal según usuario;95 se interpreta hasta borde cercano. Panel16:9 aproximado93 de ancho: `x=0..7`, `y=95..188`. Marco y altura pendientes. |
| SID | Interpretación provisional165,8 ancho ×138,9 fondo ×221,8 alto; ejes comerciales ambiguos y anatomía interna estimada |
| Barra libre | **220**; eje local28,45 sobre ganchos delanteros, ≈14 delante de postes locales14,45 |
| Banca TT1001 | **137 × 57**, siempre visible, cabeza25 detrás del eje de barra; local`y=3,45..140,45` |

No se suministró clóset ni altura de recinto/equipos. La altura de J-hooks, seguros y alineación real de press están por comprobar. No se hizo una auditoría nueva de fichas comerciales.

## Dos orientaciones del rack

Cada una se compara con ambas camas, a igual escala.

| Orientación | Centro / giro | Caucho en la pieza | Banca en la pieza |
| --- | --- | --- | --- |
| Espalda al ventanal, desplazamiento inicial3 | **(137;83,95),0°** | `x=37..237`, `y=0..200` | `x=108,5..165,5`, `y=87,4..224,4` |
| Espalda a pared izquierda | **(95;120),270°** | `x=0..200`, `y=20..220` | `x=98,45..235,45`, `y=91,5..148,5` |

En ventanal, los discos traseros supuestos dejan**10 hasta el vidrio**, tras acercar rack/barra/banca11,05 respecto de la posición anterior. En pared izquierda, siguen dejando≈21,05 a esa pared. No certifica acceso de carga ni despeje real de cortinas/ventanal. Se conservan diámetro supuesto45 y geometría SID previa.

- Ventanal: barra en**`y=112,4`**, extremos iniciales**`x=27..247`**: **27 hasta pared izquierda,33 hasta derecha,20 hasta TV**; paralela al vidrio a112,4.
- Pared izquierda: barra en`x=123,45`, extremos`y=10..230`: **10 hasta ventanal**. El caucho se apega a pared izquierda y empieza20 después del ventanal.

La banca sale**24,4 del caucho** hacia abajo en ventanal, y**35,45** hacia derecha en pared izquierda. Sus apoyos delanteros dibujados quedan totalmente fuera del caucho: ventanal**`y=209,4..216,4`**; izquierda`x=220,45..227,45`. Se marca esa zona; no se supone que los apoyos queden nivelados.

## Camas atravesadas, orientación fija

Se proponen con el lado largo200 contra pared opuesta al ventanal y **desplazadas a izquierda**, en`x=0..200`, para evitar el pilar. Ya no están centradas. Hay20 horizontales hasta el pilar y10 hasta el límite izquierdo del barrido supuesto de puerta. Son separaciones geométricas, sin certificar acceso operativo.

| Cama | Intervalo y | Rack | Hasta caucho | Hasta banca | Hasta punta de barra |
| --- | --- | --- | --- | --- | --- |
| 200 × 110 | `240..350` | Ventanal | **40** | **15,6** | Eje de barra lejos de cama |
| 200 × 90 | `260..350` | Ventanal | **60** | **35,6** | Eje de barra lejos de cama |
| 200 × 110 | `240..350` | Izquierda | **20** | **91,5** | **10** |
| 200 × 90 | `260..350` | Izquierda | **40** | **111,5** | **30** |

## Control único: desplazamiento lateral del rack al ventanal

El usuario retiró los controles de giro de cama y visibilidad de banca. Las camas quedan siempre atravesadas y la banca siempre visible en ganchos delanteros.

Un rango de **0..25cm hacia izquierda** mueve solo rack, banca, barra y caucho entero de los dos planos al ventanal; conserva intactos los dos planos de espalda a pared izquierda. Valor inicial**3cm**, para comparar con20 de separación en planta hasta TV. El valor0 recupera rack centrado.

Para desplazamiento`d`:

- Centro rack`x=140−d`, caucho`x=40−d..240−d`.
- Punta izquierda de barra`x=30−d`; TV sobresale hasta`x=7`.
- **Separación TV/barra=23−d**. A0 deja23; a3 deja20; a10 deja13; a23 toca proyección; a25 se superpone2.
- Barra sigue en`y=112,4`, dentro del tramo supuesto de TV95..188.

Se muestran cota y separación; contacto/solape se señala en rojo. Son proyecciones estáticas, **no una distancia certificada para maniobrar o cargar discos**: faltan altura de TV/barra, movimiento de barra, discos, manos y marco real. El ancho aproximado93 proviene de42×2,54×16/√(16²+9²), sin asegurar dimensiones exteriores de un modelo específico.

## Pendientes

Confirmar si95cm se mide al borde cercano de TV, sus dimensiones exteriores y altura, giro y bisagra real de puerta, tamaño exterior de camas, clóset, cortinas/ventanal, altura de recinto/rack, espacio para cargar discos, pies reales de banca, nivel de ambos apoyos, altura de barra y seguros. El living conserva sus diagramas y su plan de cortes de tres planchetas; esta simulación usa **cuatro enteras**.
