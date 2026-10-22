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
| SID | Interpretación provisional165,8 ancho ×138,9 fondo ×221,8 alto; ejes comerciales ambiguos y anatomía interna estimada |
| Barra libre | **220**; eje local28,45 sobre ganchos delanteros, ≈14 delante de postes locales14,45 |
| Banca TT1001 | **137 × 57**, visible inicialmente, cabeza25 detrás del eje de barra; local`y=3,45..140,45` |

No se suministró clóset ni altura de recinto/equipos. La altura de J-hooks, seguros y alineación real de press están por comprobar. No se hizo una auditoría nueva de fichas comerciales.

## Dos orientaciones del rack

Cada una se compara con ambas camas, a igual escala.

| Orientación | Centro / giro | Caucho en la pieza | Banca en la pieza |
| --- | --- | --- | --- |
| Espalda al ventanal | **(140;95),0°** | `x=40..240`, `y=0..200` | `x=111,5..168,5`, `y=98,45..235,45` |
| Espalda a pared izquierda | **(95;120),270°** | `x=0..200`, `y=20..220` | `x=98,45..235,45`, `y=91,5..148,5` |

En ambos casos, discos traseros supuestos dejan≈21,05 a la pared trasera correspondiente; no certifica acceso de carga. Se conservan diámetro supuesto45 y geometría SID previa.

- Ventanal: barra en`y=123,45`, extremos`x=30..250`: **30 hasta cada pared lateral**.
- Pared izquierda: barra en`x=123,45`, extremos`y=10..230`: **10 hasta ventanal**. El caucho se apega a pared izquierda y empieza20 después del ventanal.

La banca sale**35,45 del caucho** en ambas orientaciones: hacia abajo en ventanal; hacia derecha en pared izquierda. Sus apoyos delanteros dibujados quedan totalmente fuera del caucho: ventanal`y=220,45..227,45`; izquierda`x=220,45..227,45`. Se marca esa zona; no se supone que los apoyos queden nivelados.

## Camas atravesadas, estado inicial

Se proponen con el lado largo200 contra pared opuesta al ventanal y **desplazadas a izquierda**, en`x=0..200`, para evitar el pilar. Ya no están centradas. Hay20 horizontales hasta el pilar y10 hasta el límite izquierdo del barrido supuesto de puerta. Son separaciones geométricas, sin certificar acceso operativo.

| Cama | Intervalo y | Rack | Hasta caucho | Hasta banca | Hasta punta de barra |
| --- | --- | --- | --- | --- | --- |
| 200 × 110 | `240..350` | Ventanal | **40** | **4,55** | Eje de barra lejos de cama |
| 200 × 90 | `260..350` | Ventanal | **60** | **24,55** | Eje de barra lejos de cama |
| 200 × 110 | `240..350` | Izquierda | **20** | **91,5** | **10** |
| 200 × 90 | `260..350` | Izquierda | **40** | **111,5** | **30** |

## Giro de camas90°

Selector común: cabecera en pared inferior, largo200 hacia ventanal. Cama110 en`x=85..195`, cama90 en`x=95..185`; ambas`y=150..350`. No invaden pilar ni el barrido supuesto de puerta.

- Rack al ventanal: **50 de solape cama/caucho**, **85,45 de solape con envolvente de banca**.
- Rack a izquierda: **70 de solape cama/caucho**, banca termina`y=148,5`, dejando**1,5 hasta cama**. La proyección de la barra larga cruza ambas camas: comprobar alturas, sin asumir compatibilidad por el hueco de banca.

El selector de banca puede ocultarla; barra y ganchos delanteros se conservan. Los solapes se representan sin cortar ni encoger el caucho. Los intervalos de envolvente no prueban por sí solos choques de miembros concretos.

## Pendientes

Confirmar giro y bisagra real de puerta, tamaño exterior de camas, clóset, cortinas/ventanal, altura de recinto/rack, espacio para cargar discos, pies reales de banca, nivel de ambos apoyos, altura de barra y seguros. El living conserva sus diagramas y su plan de cortes de tres planchetas; esta simulación usa **cuatro enteras**.
