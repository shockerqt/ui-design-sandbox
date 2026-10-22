# Pieza: SID, caucho entero y dos camas

Simulación independiente en `/m/bedroom-floor-plan`, creada el 22 de octubre de 2026 bajo UDS-015. Componente: [BedroomFloorPlan.tsx](../src/mockups/BedroomFloorPlan.tsx). Reutiliza la figura SID del [plano del departamento](apartment-floor-plan.md), sin cambiar las distribuciones A–D.

Todas las cotas están en cm, con origen en la esquina izquierda del ventanal; `x` hacia la derecha y `y` hacia la pared opuesta. Las medidas de pieza y camas vienen del usuario. No hay medidas de puerta, clóset ni altura; no se inventan sus ubicaciones.

| Elemento | Dimensiones y posición |
| --- | --- |
| Pieza | **280 × 350**; ventanal en pared de 280, `y=0` |
| Caucho | **200 × 200**, `x=40..240`, `y=0..200`; cuatro planchetas enteras de 100 × 100, sin cortes |
| SID | Centro **(140;95)**, giro 0°, espalda al ventanal |
| Envolvente SID | Ancho ≈165,8; fondo ≈138,9; altura interpretada ≈221,8. Ejes publicados ambiguos y offsets internos estimados; véase documento del departamento. |
| Barra libre | **220**, extremos `x=30..250`, eje **`y=123,45`**, sobre ganchos delanteros; separación lateral 30 por lado |
| Discos traseros | Diámetro supuesto 45; borde posterior en `y=21,05`. Esa separación no certifica acceso de carga. |
| Banca, inicialmente visible | TT1001 **137 × 57**, envolvente `x=111,5..168,5`, **`y=98,45..235,45`**, alineada con ganchos delanteros |

Las dos camas dadas son **200 × 110** y **200 × 90**. Se usan como dimensiones exteriores; si se trata de colchones, sumar la estructura cuando se mida.

## Orientación inicial

Se eligió el lado largo de 200 contra la pared opuesta al ventanal. Es una propuesta de ubicación, no una orientación confirmada por el usuario. Las camas quedan centradas en `x=40..240`.

| Cama | Intervalo en y | Hasta caucho | Hasta fondo de envolvente SID | Hasta banca opcional |
| --- | --- | --- | --- | --- |
| 200 × 110 | `240..350` | **40** | ≈75,6 | **≈4,6** |
| 200 × 90 | `260..350` | **60** | ≈95,6 | **≈24,6** |

Quedan 40 a cada lado del largo de la cama. El límite frontal usado para la envolvente del SID es `y=164,45`; son distancias geométricas, no una evaluación de circulación ni acceso a la puerta desconocida.

## Giro de 90°

El selector gira ambas camas, colocando cabecera en la pared `y=350`, largo de 200 hacia el ventanal:

- Cama 110: `x=85..195`, `y=150..350`.
- Cama 90: `x=95..185`, `y=150..350`.
- Ambas **se superponen 50 con el caucho** y entran ≈14,5 en la envolvente frontal del SID.
- Con banca visible, su envolvente se superpone **≈85,5** con la cama. Verificar apoyos y alturas; no deducir choques de miembros concretos solo desde una envolvente rectangular.

La simulación marca el área de solape sin cortar, encoger ni desplazar el caucho. La banca está inicialmente visible y puede ocultarse mediante su selector. La barra siempre queda en ganchos delanteros.

## Press banca en ganchos delanteros

El usuario especificó esta posición, que reemplaza solo en la pieza el montaje interior previo. Se usa `RACK.barY=28,45` local, aproximadamente14 delante del poste frontal local14,45. Conservando centro95 y desfase de cabeza25, el eje de barra queda123,45, cabeza98,45 y cola235,45. La forma de J-hooks y el asiento siguen siendo aproximados.

La banca **sale35,45 del caucho**, que termina200. Apoyo posterior dibujado en113,45..120,45; apoyo delantero en**220,45..227,45**, completamente fuera del caucho. Se señala en el dibujo; no se afirma que los apoyos queden nivelados. Los4,55/24,55 hasta las camas son distancias geométricas, sin afirmar circulación suficiente. Altura de barra, seguros y alineación real del usuario siguen por comprobar.

## Referencias y pendientes

Las fuentes de SID, fotos laterales y TT1001 están reunidas en [el documento del departamento](apartment-floor-plan.md#productos-y-fuentes-reunidas). No se hizo una auditoría nueva de fichas comerciales para esta simulación.

Confirmar puerta/clóset, tamaño exterior real de camas, zona de cortinas/ventanal, altura del rack, acceso para discos y apoyos reales. La banca del living A/B conserva su propuesta interior trasera; aquí se estudian ganchos delanteros. Este estudio no modifica el plan de tres planchetas cortadas del living: aquí se usan **cuatro enteras**.
