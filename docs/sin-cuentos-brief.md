# Sin Cuentos: brief de diseño (borrador para revisión)

## Idea general

Sin Cuentos es un ranking histórico del fútbol argentino profesional. El usuario entra a la página y la página le explica de qué se trata: terminar con la discusión de "mi club es más grande que el tuyo" con datos. Antes de ver el ranking, el usuario asigna valor a cada título. Después, la página calcula y anima el resultado.

Tono: canchero, directo, visual. La experiencia es muy visual y la animación tiene que tener sentido, no ser decoración.

## Alcance de los datos

- Solo cuentan los **títulos del fútbol profesional**. La era amateur queda afuera.
- Un título cuenta si lo reconocen **AFA, CONMEBOL o FIFA**. Nombre tentativo: **"títulos oficiales"**.
- Pendiente: confirmar si en todos los años del profesionalismo la AFA organizó la liga, o si hubo otro organismo a cargo en algún período.
- Si hay demasiados huecos en goles, puntos o partidos, el alcance se limita a títulos.

### Vitrina (nivel aparte)

- Las copas secundarias (Copa Argentina, Supercopa, Recopa, Trofeo de Campeones, Copa de la Liga, etc.) forman una categoría aparte llamada **"vitrina"**.
- La vitrina **no suma puntos**. Solo sirve para desempatar: si dos equipos tienen el mismo puntaje, gana el que tenga más copas en la vitrina.

## Dos caminos

Los dos caminos son el punto de partida del usuario. Nombres tentativos:

- **Canchero**: rápido, pensado para terminar en pocos clics.
- **Nerd de la pelota**: largo, con puntajes asignados a mano a cada torneo.

### Camino canchero (decidido en lo general)

Cada pregunta tiene cuatro botones con opciones concretas (los números son ejemplos a ajustar):

- **Menos** (por ejemplo, ½)
- **Igual** (1)
- **El doble** (2)
- **Cinco veces** (5)

El orden de las preguntas construye una cadena. El valor de cada torneo sale de multiplicar lo anterior, así que las respuestas quedan coherentes entre sí:

1. ¿Cuántas ligas locales vale una Sudamericana?
2. ¿Cuántas Sudamericanas vale una Libertadores?
3. ¿Cuántas Libertadores vale una Intercontinental?

Al terminar, un botón dispara la animación del ranking.

## Valores de base (propuesta del usuario)

- Torneo anual (Liga): **2 puntos**.
- Torneo semestral (Apertura, Clausura, Metropolitano, Nacional): **1 punto** cada uno.
- Copa Argentina: **1 punto**.

Esta regla de semestres ya se aplica a la era Metropolitano/Nacional (1967 a 1985). Cada uno de esos dos torneos vale 1 punto, y un año con dos campeones suma 2, igual que un anual.

## Eras y formatos (investigación resumida)

Fuentes consultadas: [Wikipedia (inglés), Metropolitano](https://en.wikipedia.org/wiki/Metropolitano_championship), [Wikipedia (inglés), Nacional](https://en.wikipedia.org/wiki/Nacional_championship), [Wikipedia (inglés), Torneo Regional](https://en.wikipedia.org/wiki/Torneo_Regional_(1967%E2%80%931986)), [La Capital (Mar del Plata)](https://www.lacapitalmdp.com/a-35-anos-del-ultimo-partido-en-la-ciudad-del-viejo-nacional/), [Cadena 3](https://www.cadena3.com/noticia/la-previa/el-argentinos-mas-bicho_270313), [RSSSF, campeones del Nacional](https://rsssf.org/tablesa/argnacchamp.html).

- **1931 a 1966:** un solo campeonato anual de Primera.
- **1967 a 1985:** Metropolitano y Nacional en paralelo.
  - Metropolitano: clubes de Buenos Aires y alrededores, primer semestre (hasta 1980, según Wikipedia en inglés).
  - Nacional: incluía equipos del interior que llegaban por el Torneo Regional o por sus ligas. Segundo semestre.
  - Dos campeones por año. Cada uno vale 1 punto.
  - Fuentes contradictorias o incompletas: no hay confirmación de una final entre el campeón del Metropolitano y el del Nacional. **Decisión: no se toma en cuenta.**
- **1985:** se eliminan el Metropolitano y el Nacional. El campeón fue Argentinos Juniors.
- **1990 a 2015:** Apertura y Clausura. Una sola tabla por año, cada uno vale 1 punto.
- **Huecos a verificar:** la duración exacta de cada torneo en cada año, y la composición del Metropolitano año por año.

## Partidos entre campeones

Decisión: **no suman puntos.** No hay evidencia confiable de que existieran finales entre campeones de torneos paralelos. Solo cuentan los títulos.

## Ranking y animación (todavía sin decidir)

- Al terminar el cálculo, una animación con sentido: "cargando", "calculando", y una línea de tiempo con todos los clubes que participan.
- Gráfico de eje X = tiempo, eje Y = puntos acumulados. Las líneas se trazan y los escudos se mueven según avanzan los años.
- Al final: ranking de puntajes y quién ganó qué.
- Filtro de fecha mínima y máxima (doble slider) para recalcular en un período.
- Una animación de "gol al ángulo" puede servir como cierre del cálculo. Pendiente de diseño.

## Preguntas abiertas

1. Confirmar la organización de la liga por AFA en todos los años del profesionalismo (¿hubo otro organismo a cargo en algún período?).
2. Definir el alcance de datos: títulos solamente, o también goles, puntos y partidos. Depende de la cantidad de huecos.
3. Confirmar los valores numéricos de las opciones del canchero (menos = ½, etc.).
4. Confirmar nombres de los caminos: "canchero" y "nerd de la pelota" son tentativos.
5. Diseño de la animación final.
6. Eras y formatos: confirmar año por año en RSSSF o en fuentes oficiales de la AFA.
