# Sin Cuentos: diseño del MVP

Fecha: 2026-11-13. Reemplaza al borrador `docs/sin-cuentos-brief.md` en todo lo que se contradigan.

Leyenda: **(S)** lo decidió Sergio. **(C)** es criterio de Claude, corregible.

## Intención

Sin Cuentos es un ranking histórico de clubes del fútbol argentino. Quiere terminar la discusión de "mi club es más grande que el tuyo" con datos, sin imponer una opinión: el usuario decide cuánto vale cada título **antes** de ver el resultado, y la página calcula y anima el ranking. (S)

El éxito se mide en dos cosas: que la experiencia sea visualmente memorable, y que el resultado se comparta. La estética es la prioridad número uno del proyecto. (S)

## Objetivos, no objetivos y anti objetivos

**Objetivos del MVP**

- Camino canchero: tres preguntas, pocos clics, para el que entra una sola vez. (S)
- Camino nerd: una calculadora con números enteros por grupo de torneos. (S)
- Animación del cálculo y gráfico de puntos acumulados en el tiempo. (S)
- Ranking final con desglose, interruptor de amateurismo y filtro de años. (S)
- Compartir el resultado con un link. (S)

**No objetivos del MVP**

- Goles, puntos y partidos: solo títulos. (S)
- Servidor, cuentas, base de datos. (S)
- Imagen de vista previa personalizada al compartir (necesita servidor). (C)
- Valorar cada trofeo por separado en modo nerd: se valora por grupo. (S, a propuesta de C)

**Anti objetivos**

- Que el ranking parezca armado a favor de un club. Toda regla histórica es mecánica y se aplica igual a todos; cada título muestra su fuente.
- Animación decorativa. Cada movimiento tiene que explicar algo del cálculo. (S)
- Una estética de plantilla. Si parece un dashboard genérico, falló.

## Reglas de puntaje

### Grupos de torneos

| Grupo (`category`) | Qué incluye | Valor canchero |
|---|---|---|
| `liga_anual` | Título de Primera cuando fue el único del año o temporada | 2 |
| `liga_corta` | Título de Primera cuando hubo más de uno en el año o temporada | 1 |
| `copa_nacional` | Copa Argentina y Copa de la Liga | 1 |
| `tier_b` | Copa Sudamericana, Copa CONMEBOL, Supercopa Sudamericana, Copa Mercosur | sale de la pregunta 1 |
| `tier_a` | Copa Libertadores | sale de la pregunta 2 |
| `mundo` | Copa Intercontinental y Mundial de Clubes | sale de la pregunta 3 |
| `vitrina_nacional` | Resto de copas nacionales de cualquier era (Supercopa Argentina, Trofeo de Campeones, copas de la era amateur, etc.) | 0, solo desempate |
| `tier_c` | Recopa Sudamericana, Interamericana, Suruga, copas rioplatenses y similares | 0, solo desempate |

La agrupación en tiers y que nada valga más que el título mundial son decisiones de Sergio. La asignación de cada torneo a su grupo es (C).

### Regla de liga (C)

- Es título de liga lo que la AFA lista hoy como campeonato de Primera División, incluida la era amateur y los años 1931 a 1934 organizados por la Liga Argentina de Football.
- Si el año o temporada tuvo **un solo** título de liga, es `liga_anual`. Si tuvo **más de uno**, cada uno es `liga_corta`. Sin excepciones por club ni por formato.
- La cuenta se hace por era: entre 1931 y 1934 conviven la liga profesional y la amateur, y ninguna le resta valor a la otra.
- La temporada es la unidad que usa la AFA. Un Apertura 1991 y un Clausura 1992 pertenecen a la misma temporada 1991/92.
- Cada título se fecha en el año en que se definió.
- Finales entre campeones de torneos paralelos: no suman, salvo que la AFA las liste como título, en cuyo caso entran según su categoría.

### Camino canchero

Tres preguntas en cadena. Todos los resultados son enteros.

1. "Un Clausura vale 1 punto y la liga anual vale 2. ¿Cuántas ligas anuales vale una Sudamericana?" Opciones: **la mitad, una, dos, tres**. `tier_b` = 1, 2, 4 o 6.
2. "¿Cuántas Sudamericanas vale una Libertadores?" Opciones: **lo mismo, el doble, el triple**. `tier_a` = `tier_b` × 1, 2 o 3.
3. "¿Cuántas Libertadores vale ser campeón del mundo?" Opciones: **lo mismo, el doble, el triple**. `mundo` = `tier_a` × 1, 2 o 3.

"Menos" existe solo en la pregunta 1, porque es una opinión real que una liga vale más que una Sudamericana. Las preguntas 2 y 3 nunca bajan, así el orden de los tiers se mantiene. El título mundial queda entre 1 y 54 puntos. (C, sobre la idea de cadena de S)

Los textos exactos son tentativos; el tono es canchero y directo.

### Camino nerd

Una sola pantalla con seis campos enteros de 0 a 99: `liga_corta`, `liga_anual`, `copa_nacional`, `tier_b`, `tier_a`, `mundo`. Cada campo lista a la vista qué torneos incluye. Arranca con los valores del canchero por defecto (1, 2, 1, 2, 4, 8). No valida el orden entre tiers: el nerd puede hacer lo que quiera.

Se llega al modo nerd desde el inicio o desde el resultado del canchero ("¿querés más control?"), con los valores del canchero ya cargados.

### Ranking

- Puntaje del club = suma de (títulos del grupo × valor del grupo), dentro del rango de años y respetando el interruptor de amateurismo.
- Desempate: 1) más trofeos de vitrina (`vitrina_nacional` + `tier_c`) con los mismos filtros, 2) orden alfabético. (S para la vitrina)
- La vitrina se muestra siempre al lado del puntaje, aunque no haya empate. (C)
- **Amateurismo:** incluido por defecto. En el resultado hay un interruptor para sacarlo; al cambiarlo se recalcula todo. (S)
- **Rango de años:** doble slider entre el primer y el último año con datos. (S)

## Datos

Tres archivos JSON estáticos dentro del repo. Los investiga y arma Claude. (S)

- `clubs.json`: `{ id, name, shortName, colors: [primario, secundario] }`.
- `competitions.json`: `{ id, name, category, organizer }`.
- `titles.json`: `{ year, competitionId, clubId, era: "amateur" | "profesional", season?, source, note? }`.

Reglas:

- Fuente primaria: listados oficiales de AFA, CONMEBOL y FIFA. RSSSF como verificación cruzada. Cada fila lleva la URL de su fuente.
- `category` vive en la competencia, salvo la liga: `liga_anual` o `liga_corta` se **calcula** con la regla de liga a partir de cuántos títulos de liga tiene la temporada. No se escribe a mano.
- Casos discutidos (1936, superfinales 2012/13 y 2013/14, título por tabla anual 2025, asociaciones paralelas del amateurismo) se resuelven siguiendo el listado de la AFA y se anotan en `note`.
- Un archivo `expected-totals.json` guarda, con su fuente, el total oficial de ligas y copas por club. Un test compara esos totales con `titles.json`.

**Escudos:** los escudos reales son marcas registradas. El MVP usa insignias SVG propias: forma de escudo con los colores del club y sus iniciales. (C)

## Experiencia

Pantallas, en orden:

1. **Inicio.** Explica la idea en una frase y ofrece los dos caminos.
2. **Preguntas** (canchero) o **calculadora** (nerd).
3. **Cálculo.** Animación corta que muestra qué se está sumando, y remata con el "gol al ángulo".
4. **Carrera.** Gráfico SVG: eje X años, eje Y puntos acumulados. Las líneas se trazan año por año y la insignia de cada club viaja en la punta de su línea. Los primeros ocho van destacados; el resto, atenuado.
5. **Resultado.** Ranking con puntaje, vitrina y desglose por grupo de cada club ("quién ganó qué"). Controles: amateurismo, rango de años, compartir, pasar a modo nerd, volver a empezar.

Un link compartido abre directo en la carrera, con los valores de quien lo compartió.

### Dirección visual (C, a validar con maquetas)

Propuesta de partida: **noche de cancha**. Fondo verde casi negro, trazos blancos de cal que se dibujan solos como las líneas del campo, tipografía condensada y pesada de tribuna, papelitos como único adorno. La dirección definitiva se elige entre dos o tres maquetas estáticas antes de construir pantallas; esa elección es de Sergio.

Requisitos que no dependen de la dirección elegida:

- Todo lo gráfico es SVG: insignias, cancha, gráfico, pelota. Nada de imágenes de mapa de bits.
- Pensado primero para celular (360 px de ancho), porque el link va a circular por WhatsApp.
- Con `prefers-reduced-motion`, las animaciones saltan al estado final.
- Las animaciones se pueden saltear con un toque.

## Arquitectura

Solo front, sitio estático. (S)

- **Vite + React + TypeScript.** (C)
- **Zustand** para el estado: paso actual, respuestas, pesos, filtros. (S)
- **GSAP** para las secuencias (trazado de líneas, trayectoria de la pelota, entrada del ranking). **d3-scale** y **d3-shape** para la geometría del gráfico. (C)
- **CSS propio** con variables; sin framework de componentes, para no heredar una estética ajena. (C)
- **Vitest** para el núcleo y los datos. (C)

El cálculo vive en un núcleo de funciones puras sin React (`src/core`), que recibe títulos y pesos y devuelve la serie por año y el ranking. La interfaz solo dibuja lo que el núcleo devuelve.

### Link para compartir

Parámetros en la URL, versionados:

- `v=1`
- `m=c` con `q=` tres índices de respuesta (ejemplo `q=102`), o `m=n` con `w=` seis enteros separados por punto en el orden de los campos del modo nerd.
- `a=1|0` amateurismo.
- `d=desde-hasta` rango de años.

Un link inválido o incompleto lleva al inicio sin romper nada.

### Enfoques considerados

1. **Solo front con JSON estático y estado en la URL.** Elegido: cero costo, cero mantenimiento, y los datos son chicos y casi no cambian.
2. **Front más funciones de servidor** para generar la imagen de vista previa. Mejora el compartir, pero agrega infraestructura; queda para después del MVP.
3. **Canvas o WebGL para el gráfico.** Más rendimiento del que hace falta para unas decenas de líneas, y se pierde la nitidez y el control fino del SVG.

## Fuera del MVP

- Imagen de vista previa personalizada y descarga del ranking como imagen.
- Goles, puntos, partidos.
- Valoración por trofeo individual.
- Escudos oficiales (requiere permisos).

## Queda a criterio de quien construye

- Textos finales de cada pantalla, dentro del tono canchero.
- Curvas, duraciones y detalles de cada animación.
- Estructura interna de componentes.
