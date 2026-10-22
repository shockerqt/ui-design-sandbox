# Referencias del plano del departamento

Estado vigente documentado el **22 de octubre de 2026**, a partir del [código integrado 24e579dc](https://github.com/shockerqt/ui-design-sandbox/blob/24e579dc4f7d86af223ef7d6be25350c196685b8/src/mockups/ApartmentFloorPlan.tsx). El dibujo está en [ApartmentFloorPlan.tsx](../src/mockups/ApartmentFloorPlan.tsx) y se puede ver en [el Sandbox](https://sandbox.shocker.cl/m/apartment-floor-plan).

Este archivo reúne las decisiones actuales para continuar en otra sesión. Al modificar medidas o posiciones, actualizar también este documento. Las constantes y las figuras del componente determinan lo que se dibuja. El historial de alternativas descartadas queda en [UDS-011](https://github.com/shockerqt/workspace-governance/blob/master/tasks/UDS-011-apartment-floor-plan.md); esta consolidación corresponde a [UDS-014](https://github.com/shockerqt/workspace-governance/blob/master/tasks/UDS-014-document-apartment-references.md).

## Convenciones y calidad de las medidas

Todas las medidas y coordenadas están en **centímetros**. El origen `(0,0)` es la esquina izquierda del ventanal; `x` aumenta hacia la derecha y `y` hacia la cocina inferior. El ventanal recorre `x=0..350`, en `y=0`.

- **Usuario:** medida o decisión aportada por el usuario; se conserva su carácter aproximado cuando corresponde.
- **Publicada:** dimensión tomada de las referencias de producto usadas en el desarrollo; no implica una nueva verificación comercial en esta fecha.
- **Derivada:** resultado de las medidas o posiciones del modelo.
- **Estimada:** proporción visual, ubicación de prueba o silueta sin medida real confirmada.

Las imágenes privadas del departamento, incluida la anotación **depa2.png** de Google Drive, sirvieron como referencia de la cocina. No están incluidas en el repositorio y no se dispone aquí de un enlace compartible. Si se necesita reinterpretar esa imagen, recuperarla de Drive; no reconstruir detalles ausentes desde este archivo.

## Departamento y remodelación

Los intervalos indican la envolvente en planta, sin añadir espesores de muro ni tolerancias.

| Elemento | Medida vigente y posición | Procedencia / límite |
| --- | --- | --- |
| Recinto | 350 de ancho × ≈388 de fondo | Ancho del usuario; fondo derivado de la cocina anotada. Los ≈300 iniciales describían el sector principal, no el fondo total. |
| Puerta izquierda | Borde cercano al ventanal en `y=210`; abertura provisional `y=210..290` | 210 del usuario hasta el borde del marco más cercano; ancho 80 estimado. No se dibuja una hoja medida. |
| Paso inferior izquierdo | `x=0..115` | Referencia de la anotación privada; confirmar en terreno. |
| Tabique inferior | `x=115`, desde `y=322` | Empieza 13 antes del mesón en `y=335`; espesor no medido. |
| Lavaplatos / tramo verde | 53 × 88; `x=297..350`, `y=247..335` | Referencia de la anotación. Cubeta interior 39 × 46 ilustrativa. |
| Resto cocina / celeste | 235 × 53; `x=115..350`, `y=335..388` | 235 = 350 − 115. |
| Quemadores / rojo | 28 × 43; `x=262..290`, `y=338..381` | Silueta estimada, no ficha de una encimera. |
| Refrigerador | 70 × 70; `x=275..345`, `y=70..140` | 70 × 70 y separación de 5 de la pared derecha aportadas por usuario. Distancia al ventanal ≈70 estimada por usuario. Frente supuesto en `x=275`. |
| Mesa nueva | 70 de profundidad × 107 de largo; `x=280..350`, `y=140..247` | Profundidad solicitada; largo derivado entre refri y lavaplatos. La isla se elimina. |
| TV sobre mesa | 32″; panel 16:9 ≈71 × 40 | Vista de canto en `x=340..343`, `y=158..229`; centro `(341,5; 193,5)`. Modelo, soporte y altura pendientes. |
| Arenero | Silueta 60 × 45; `x=280..340`, `y=12..57` | Estimada dentro del sector entre ventanal y refri. |
| Gatificación | Dos plataformas de 30 × 25 en `(275,4)` y `(310,40)` | Tamaños y ubicaciones esquemáticos, a distintas alturas aún sin definir, para subir al refri. |

La isla retirada medía 140 × 57; no forma parte de la remodelación vigente. El punto de arranque `y=247` del lavaplatos conserva la referencia del croquis original.

## Productos y fuentes reunidas

| Referencia | Fuente usada |
| --- | --- |
| SID-SRHSRHD | [Ficha SDMED](https://sdmed.cl/productos/jaula-rack-ws-barbell-stack-rowing-sid-srhsrhd/), [foto general](https://sdmed.cl/wp-content/uploads/2023/02/1-8.jpg), [foto lateral para refinar portadiscos](https://sdmed.cl/wp-content/uploads/2023/02/4-8.jpg) |
| Force USA G3 V1 | [Manual F-G3-B.pdf](https://force-manuals.nmg.io/F-G3-B.pdf), página 7 para conjunto y páginas 17–19 para anatomía |
| Banca TT1001 | [Banco doble regulación y soporte SDMED](https://sdmed.cl/productos/banco-doble-regulacion-y-soporte-serie-tts-tt1001/) |
| Bici P900 | [Ultimate Fitness P900 Premium](https://ultimatefitness.cl/producto/bicicleta-spinning-magnetica-p900-premium?id=3386) |
| Sofá GLOSTAD | [IKEA 50489012, Knisa gris oscuro](https://www.ikea.com/cl/es/p/glostad-sofa-2-cuerpos-knisa-gris-oscuro-50489012/) |

El segundo rack actual es el **G3 V1**, que reemplazó al MyRack Folding. No aplicar dimensiones de otras generaciones de G3 ni de los racks comparados anteriormente.

## Anatomía de los racks

Las coordenadas de esta sección son **locales al rack**, antes de moverlo y rotarlo con `LAYOUTS`: `x=0` es su eje central; `y` negativo apunta hacia atrás y positivo hacia delante.

### SID-SRHSRHD — figuras A/B

La ficha daba **221,8 × 138,9 × 165,8 sin identificar ejes**. Se interpretó provisionalmente como altura 221,8, fondo 138,9 y ancho 165,8. Confirmar esa interpretación antes de usarla como una medida del equipo real.

| Parte | Geometría dibujada | Calidad |
| --- | --- | --- |
| Postes laterales | Centros `x=±54,4`; traseros `y=−51,45`, delanteros `y=14,45` | Estimada desde fotos. |
| Bases longitudinales | Ancho 7; `y=−64,45..69,45`; patas delanteras de 10 × 7 | Geometría esquemática dentro del fondo interpretado. |
| Seguros delanteros | Largo 48 desde `y=14,45` | Estimado; no son los 44 confirmados para G3. |
| Portadiscos traseros | Aproximadamente 25 hacia los costados; dibujo de soporte de 28,5 | Estimado. Varios niveles se superponen en planta. |
| Discos almacenados | Diámetro supuesto 45; pila de ≈20 | Estimado; no se midieron los discos del usuario. |
| Saliente trasera de discos | ≈4,5 = 22,5 de radio − ≈18 de retranqueo | Inferencia visual de la foto lateral, no una medición. |
| Barra libre | **220**, en `y=−37,45` | Montaje interior propuesto: 14 por delante del poste trasero. |
| Banca interior | `y=−62,45..74,55`, ancho 57 | Derivada con desfase de cabeza de 25. |

Los J-hooks interiores traseros se muestran propuestos en trazo discontinuo. Perforaciones, compatibilidad y altura del travesaño están sin comprobar; los seguros delanteros dibujados **no protegen esa posición trasera**. `RACK.barY=28,45` conserva la referencia del antiguo asiento delantero; la barra actual de A/B se coloca mediante `insideBarY=rearY+14`.

En B, los discos supuestos dejan ≈1,05 a la pared izquierda (`75 − 51,45 − 22,5`); es una separación geométrica muy pequeña, no espacio para manipularlos.

### Force USA G3 V1 — figuras C/D

Envolvente publicada del conjunto: **203 de ancho × 142 de fondo × 219,5 de alto**. Los **203 incluyen la barra Smith**; el bastidor se modela con ≈122 de ancho según el usuario. Los brazos de **44**, confirmados por el usuario, están **incluidos en los 142 de fondo**.

| Parte / referencia del manual | Posición o medida usada | Calidad |
| --- | --- | --- |
| Centros laterales del bastidor | `x=±58,5` | Estimados dentro del ancho ≈122. |
| Envolvente longitudinal | `y=−71..71` | Fondo 142 publicado. |
| Postes traseros | `y=−50` | Estimación proporcional. |
| Guías redondas Smith, pieza 38 | `y=−9`, en `x=±58,5` | Posición estimada; anatomía del manual. |
| Barra Smith, pieza 42 | Ancho total 203, eje `y=−9` | Ancho publicado; ≈36 detrás de postes frontales. |
| Mangas Smith, pieza 97 | 33,5 cada una | Dimensión del manual; pertenecen a la Smith, no al storage trasero. |
| Postes intermedios / cargadores, piezas 7/8 | `y=7`; cuernos de carga laterales dibujados de 20 | Posición y saliente esquemáticos. |
| Postes delanteros de poleas, pieza 6 | `y=27` | Estimación proporcional. |
| Safety / spotter arms | `y=27..71`, largo **44**, ancho dibujado 6 | Largo confirmado; ancho esquemático. |
| J-hooks para barra libre | Asiento en `y=35`, ≈8 delante del poste frontal | Estimado. |
| Barra libre | **200**, eje `y=35` | Variante solicitada; independiente de la Smith 203. |
| Portadiscos traseros, piezas 15/51 | Seis varillas de 24,5 con mangas de 21; tres alturas por lado | Manual. Proyección hacia atrás hasta `y=−71` estimada. |
| Discos traseros | Dos siluetas de 45 × 12, centradas en `x=±58,5`, `y=−67..−55` | Diámetro y espesor de pila asumidos. Se ven de canto en planta. |
| Espacio adicional trasero | 15, fuera del equipo, `y=−86..−71` | Propuesta de acceso, sin confirmación de uso real. |
| Rieles en el suelo | Dos de 7 × 140, `y=−71..69`; pies de 10 × 5 en `y=−71` y `64` | Estimación de forma y apoyos. |

El bastidor tiene unión trasera y miembros superiores laterales/frontales; los superiores son discontinuos. No hay un travesaño dibujado en el suelo cerrando el frente. Las distancias internas son inferencias de las imágenes, aunque el ancho/fondo exterior y algunos largos provengan del manual.

La barra libre se dibuja con tramo central de 138 y mangas de 31 por lado para sumar 200; en SID, las mangas esquemáticas de 41 suman 220. **138 no es una medida verificada entre mangas del producto que se comprará**: falta comprobar que la barra de 2 m apoye correctamente en los J-hooks.

## Banca, bici y sofá

| Elemento | Envolvente vigente | Posición / limitación |
| --- | --- | --- |
| Banca TT1001 | **137 × 57**, publicada | Cabezal supuesto 25 detrás del eje de barra. Cojines, patas y postura plana son ilustrativos. |
| Banca G3 para barra libre | Local `y=10..147`; patas `25..32` y `132..139` | Usa base fija y extensión V1. |
| Banca G3 para Smith | Alternativa local `y=−34..103` | Contorno discontinuo de la misma banca; no es una segunda banca ni modifica la asignación de caucho del modo en uso. |
| Banca G3 guardada | Horizontal, local `y=−54..83`; patas `−39..−32` y `68..75` | Patas modeladas dentro de la base fija. No se supone plegado ni almacenamiento vertical. |
| P900 | **131 de largo × 53,5 de ancho**, publicada | Silueta sin espacio adicional del usuario al pedalear o subir/bajar. La altura publicada como 1295 cm parecía errónea: no se deduce una altura real. |
| GLOSTAD | **121 de ancho × 78 de fondo**, publicada | Frente hacia la derecha/TV; `x=90..168`, `y=175..296`. Solo aparece en C con banca guardada y sin bici. |

Posiciones de la bici, expresadas en coordenadas del departamento:

| Estado | Cuerpo | Caucho cuando está asignado a la bici |
| --- | --- | --- |
| Normal / en uso | `x=90..221`, `y=272,25..325,75` | `x=88..238`, `y=269..329`, módulo 150 × 60 |
| Guardada junto al G3 C | `x=210..263,5`, `y=40..171` | `x=206,75..266,75`, `y=38..188`, módulo girado 60 × 150 |
| Guardada junto al G3 D | `x=90..221`, `y=215..268,5` | `x=88..238`, `y=211,75..271,75` |

En posición normal, el caucho de la bici termina 6 antes de la cocina. En C, la extensión de banca llega hasta `y=261`: hay 8 hasta la posición prevista del caucho de bici, pero V1 se comparte y ambos módulos no están instalados a la vez.

En C, el sofá deja **39 hasta la cocina** (estrecho), **112 hasta la mesa** y **6 hasta la cola de la banca guardada**. El ojo sentado supuesto `(120;235,5)` queda a ≈225 del centro dibujado de la TV, con ≈11° de desalineación. Son cálculos del plano, no medidas de comodidad ni alturas reales.

## Las cuatro distribuciones

Cada conjunto usa la transformación SVG `translate(x y) rotate(ángulo)`. A 0° la espalda mira al ventanal; a 270° mira a la pared izquierda de la puerta, con el frente hacia la derecha.

| Plano | Rack | Centro `(x;y)` | Giro | Base fija en coordenadas del departamento |
| --- | --- | --- | --- | --- |
| A | SID | `(125;105)` | 0° | `x=57,5..197,5`, `y=30..180` |
| B | SID | `(75;130)` | 270° | `x=0..150`, `y=57,5..197,5` |
| C | G3 V1 | **`(111,5;86)`** | 0° | **`x=44..184`, `y=11..161`** |
| D | G3 V1 | **`(86;121,5)`** | 270° | **`x=11..161`, `y=49..189`** |

La base fija local es `x=−67,5..72,5`, `y=−75..75` (140 × 150). Quedó asimétrica al añadir 5 a R2 y R4 conservando el borde izquierdo. La extensión V1 local ocupa `x=−30..30`, `y=75..175`.

Separaciones relevantes vigentes:

- B: punta de barra libre a **20 del ventanal**.
- C: punta izquierda de Smith a **10 de la pared**; extremo derecho en `x=213`, a **62 del frente supuesto del refri**. Extremo de barra libre en `x=211,5`, a **63,5 del refri**. Equipo posterior en `y=15`, dejando los 15 propuestos hacia el ventanal.
- D: punta de Smith a **20 del ventanal**; barra libre a **21,5**. Conjunto desplazado 8,5 hacia el ventanal respecto de la iteración anterior.

Son separaciones de proyecciones. Los 10 laterales y 15 traseros no acreditan espacio suficiente para cargar discos.

### Selectores actuales

Los selectores afectan al G3 C/D; A/B conservan su comparación SID con bici.

| Modo G3 | Banca | Bici y caucho | Sofá C |
| --- | --- | --- | --- |
| Banca guardada, sin bici (**inicial**) | Horizontal al fondo | Bici en la pieza; V1/V2 fuera de este plano | Visible |
| En uso, sin bici | Bajo barra libre; V1 como extensión | Bici ausente; V2 guardado | Ausente |
| En uso, con bici | Bajo barra libre; V1 como extensión | Bici normal **sin caucho**, porque V1 está en la banca | Ausente |
| Banca guardada, con bici | Horizontal al fondo | Bici normal sobre V1 + V2 | Ausente |
| Banca y bici guardadas | Horizontal al fondo | Bici junto al rack sobre V1 + V2; barras elevadas discontinuas | Ausente |

El último modo requiere bici en el living. Al ocultarla, cambia a banca guardada. Las barras elevadas conservan la proyección completa 203/200; sus alturas sobre asiento, manubrio o tablet no están comprobadas.

## Apertura del refrigerador en C

El usuario confirmó bisagras **a la derecha mirando el refri de frente**. Con el frente supuesto hacia la izquierda del plano, se ubican en `(275;140)`.

Se representa una hoja hipotética de 70: cerrada entre `(275;70)` y la bisagra; a 90° su extremo llega a `(205;140)`. Su barrido cruza la punta de barra libre `(211,5;121)` y la bici guardada en C. La punta Smith `(213;77)` queda fuera de ese sector supuesto.

Los **62/63,5 de distancia horizontal no garantizan abrir a 90°**. Faltan modelo del refri, ancho real de hoja, posición de bisagra, grosor, manilla y alturas relativas con las barras y bici.

## Caucho: tres planchetas y V1 compartida

Se asumen **tres planchetas nominales de 100 × 100**, total 3 m². No se descuenta encastre ni ancho de corte.

| Plancheta | Pieza | Corte `(ancho × largo)` | Origen dentro de la plancheta `(x;y)` |
| --- | --- | --- | --- |
| P1 | R1 | 100 × 100 | `(0;0)` |
| P2 | R2 | **40 × 100** | `(0;0)` |
| P2 | V1 | **60 × 100**, todo el resto de P2 | `(40;0)` |
| P3 | R3 | 100 × 50 | `(0;0)` |
| P3 | R4 | **40 × 50** | `(0;50)` |
| P3 | V2 | **60 × 50**, todo el resto de P3 | `(40;50)` |

Armado de base fija **140 × 150 = 2,1 m²**, con origen propio en su esquina superior izquierda:

| Pieza | Posición en la base | Medida |
| --- | --- | --- |
| R3 | `(0;0)` | 100 × 50 |
| R4 | `(100;0)` | 40 × 50 |
| R1 | `(0;50)` | 100 × 100 |
| R2 | `(100;50)` | 40 × 100 |

**V1 se usa una sola vez en cada configuración:**

- Para banca G3: V1 de **60 × 100** prolonga la base fija; V2 queda guardado. La unión local `y=75` está entre las patas dibujadas de la banca en uso.
- Para bici: V1 girada a **100 × 60** más V2 girada a **50 × 60** forman **150 × 60 = 0,9 m²**. La banca queda guardada. En SID la banca interior cabe en la base fija, dejando V1/V2 disponibles para bici.

La partición nominal consume los 3 m² sin retazos. Las alternativas del diagrama inferior reutilizan la misma V1; no son piezas duplicadas. Comprobar lado útil, encastres, espesor de corte y apoyos reales antes de cortar.

## Pendientes que deben seguir visibles en otra iteración

1. Medir fondo real del recinto, puerta, paso y cocina; confirmar las cotas interpretadas de la anotación privada.
2. Confirmar ejes exteriores del SID y compatibilidad/protección del montaje de banca en sus postes traseros.
3. Medir offsets de postes, guías, mangas, portadiscos, pies y travesaños del G3; los offsets internos estimados no son cotas de fábrica.
4. Comprobar carga y extracción de los discos reales con 15 atrás y 10 al costado en C, considerando manos y conjunto completo. El tamaño y grosor de pila de discos siguen asumidos.
5. Confirmar largo entre mangas y compatibilidad de la barra libre de 2 m con el rack.
6. Comprobar posición real de banca, apoyo de patas, travesaño trasero, rango Smith, seguros y alturas. El plano no verifica una configuración de press banca.
7. Medir hoja y apertura del refri; revisar los cruces con barra libre y bici a sus alturas reales.
8. Definir altura de TV, plataformas y acceso de gatos; comprobar ergonomía del sofá y paso de cocina de 39.
9. Confirmar altura y acceso operativo de P900 y barras elevadas; medir dimensiones útiles de las planchetas antes de cortar.

Para iterar rápido, editar las constantes `ROOM`, `KITCHEN`, `FRIDGE`, `TABLE`, `RACK`, `G3`, `BENCH`, `G3_FREE_BAR`, `BIKE`, `LAYOUTS`, `CUT_TILES` y `RACK_FLOOR_PARTS`; las siluetas de cocina, gatos, TV, sofá y apertura se definen en sus funciones. Mantener este archivo sincronizado y evitar convertir una estimación en medida confirmada al copiarla.
