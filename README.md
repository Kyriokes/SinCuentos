# Sin Cuentos

Ranking histórico de clubes del fútbol argentino en el que cada persona decide cuánto vale cada título antes de ver el resultado. Sitio estático, sin servidor.

- **Canchero:** tres preguntas en cadena y sale el ranking.
- **Nerd de la pelota:** seis valores enteros, uno por tipo de título.
- El resultado se anima año por año y se comparte con un link.

## Cómo correrlo

Requiere Node 20 o superior.

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

```bash
npm run build
```

## Cómo está armado

| Carpeta | Qué hay |
|---|---|
| `src/core` | Funciones puras: pesos, regla de liga, ranking, serie temporal y link para compartir. No depende de React. |
| `src/data` | Títulos, competencias y clubes en JSON, más los totales oficiales que usa el test de control. |
| `src/state` | Estado de la aplicación (Zustand). |
| `src/ui` | Pantallas, gráfico e insignias. |
| `docs` | Diseño, plan y dirección visual. |

## De dónde salen los datos

- **Ligas y copas nacionales:** listado oficial de la AFA.
- **Copas internacionales:** RSSSF, porque los sitios de CONMEBOL y FIFA no publican sus listados en un formato legible.
- Cada fila de `src/data/titles.json` lleva la URL de su fuente, y los casos discutidos llevan una nota con el criterio.

Reglas que se aplican igual a todos los clubes:

- Es título de liga lo que la AFA lista como campeonato de Primera División.
- Si el año o la temporada tuvo un solo título de liga, es liga anual. Si tuvo más de uno, cada uno es torneo corto. La cuenta se hace por separado para el amateurismo y el profesionalismo.
- Supercopas, recopas y copas menores van a la vitrina: no suman puntos y solo desempatan.

Las insignias son propias (colores e iniciales), no los escudos oficiales. Los colores de los clubes todavía no están verificados contra una fuente.

## Reportar un error en un título

Abrí un issue con el año, la competencia, el club y una fuente oficial. Para corregirlo, se edita la fila en `src/data/titles.json` y, si cambia un total, `src/data/expected-totals.json` con su fuente. `npm test` compara ambos.
