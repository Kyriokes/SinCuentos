# Dirección visual: noche de cancha

Elegida por Sergio el 2026-11-14 entre tres maquetas (`docs/design/maquetas/index.html`). Los valores viven en `src/styles/tokens.css`.

## Idea

El campo es la página. No hay tarjetas, paneles ni sombras: todo lo que aparece está pintado sobre el césped con cal, como las líneas de la cancha.

## Paleta

| Nombre | Valor | Uso |
|---|---|---|
| Césped | `#14553a` | Fondo, franja oscura |
| Césped claro | `#175f41` | Franja de corte clara |
| Cal | `#f4f1e4` | Texto, trazos, líneas del gráfico, botón principal |
| Cal suave | cal al 72 % | Texto secundario |
| Cal tenue | cal al 22 % | Grilla, separadores punteados, líneas de clubes no destacados |
| Tinta | `#12372a` | Texto sobre cal |

El único color fuera de esta paleta es el de las insignias de los clubes. No hay color de acento: el énfasis se da invirtiendo cal y césped.

## Tipografía

- **Big Shoulders Display 900**, en mayúsculas, para títulos, números y botones. Es letra de cartel de estadio: condensada y pesada.
- **Archivo 400 y 600** para el texto corrido y las etiquetas.
- Los números van con cifras tabulares cuando cambian en pantalla (año de la carrera, puntos).
- Las dos familias se sirven desde el propio sitio.

## Trazo y forma

- Trazo de cal de 3 px con puntas redondeadas. Radio de 4 px en botones y campos.
- Los separadores son líneas punteadas, como la cal gastada. La línea llena se reserva para bordes de botones y ejes.
- Elegido: fondo de cal con texto en tinta. No elegido: borde de cal sobre césped.
- Las insignias son un escudo con el diseño de la camiseta del club (lisa, bastones, aros, banda, franja, mitades o V) y las iniciales sobre una placa de tinta. No son los escudos oficiales.

## Disposición

- Una sola columna, alineada a la izquierda, pensada para 360 px. En escritorio la columna crece hasta 760 px y no se parte en dos.
- La pregunta va arriba y las opciones abajo, al alcance del pulgar.
- Las franjas de corte del césped quedan fijas al hacer scroll.

## Movimiento

Cada animación explica algo. No hay entradas decorativas ni efectos al pasar el cursor más allá de invertir el color.

| Momento | Qué se mueve | Duración |
|---|---|---|
| Inicio | Las líneas de cal del círculo central se dibujan | 1,1 s, una sola vez |
| Cálculo | Se dibuja el arco, aparecen los seis valores de menor a mayor, la pelota entra al ángulo y la red se sacude | Menos de 4 s |
| Carrera | Un cursor recorre los años; cada línea se revela hasta el cursor, la insignia viaja en la punta y una tabla en vivo muestra a los cinco primeros | 10 s |
| Resultado | Al cambiar un filtro el gráfico y la tabla se actualizan sin repetir la carrera | Inmediato |

Reglas:

- Toda animación se saltea con un toque o con el botón "Saltar".
- Con movimiento reducido activado, el inicio y el cálculo muestran directamente su estado final. La carrera corre igual: es el contenido, la dispara el usuario y se puede saltear. (Pedido de Sergio, 2026-11-14.)
- Las líneas del gráfico son escaleras: los puntos se ganan de golpe, no de a poco.
- Hasta ocho clubes llevan línea a pleno e insignia; el resto queda en cal tenue. Por defecto son los ocho primeros; con "Elegir clubes para comparar" los elige el usuario tocando filas de la tabla, la escala vertical se ajusta a los elegidos y la selección viaja en el link. Más de ocho no se ofrecen: los colores dejan de distinguirse. (Pedido de Sergio, 2026-11-15.)
- Cada línea destacada lleva un color del club, repartido de arriba a abajo en el ranking: primero el color principal, si está tomado el secundario, si no la mezcla de ambos y, como último recurso, un color libre. Nunca verde, porque se pierde en el césped, y los colores oscuros se aclaran. Al cambiar el ranking se reparten de nuevo. (Pedido de Sergio, 2026-11-14.)
