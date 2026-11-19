# Sin Cuentos

Ranking histórico de clubes del fútbol argentino en el que cada persona decide cuánto vale cada título antes de ver el resultado. Sitio estático, sin servidor.

- **Canchero:** tres preguntas en cadena y sale el ranking.
- **Nerd de la pelota:** seis valores enteros, uno por tipo de título.
- El resultado se anima año por año y se comparte con un link (en el celular, con el menú de compartir del sistema).
- Se pueden elegir hasta 8 clubes para comparar en el gráfico; la selección viaja en el link.
- Quien abre un link compartido ve con qué reglas se armó ese ranking y puede armar el suyo.
- Una barra arriba permite volver al inicio desde cualquier pantalla.

## Cómo correrlo

Requiere Node 22.22, 24.15 o 26 en adelante (lo piden vitest y jsdom). La versión de referencia está en `.nvmrc`.

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

`npm run check` corre todo lo que corre la integración continua (`.github/workflows/ci.yml`): tipos, tests y build.

## Publicarlo

- Definí `VITE_SITE_URL` con la dirección del sitio (por ejemplo `https://sincuentos.com.ar`) en el entorno del build. Con eso la imagen para compartir (`public/og.png`) va con URL absoluta, que es lo que exigen WhatsApp, X y Facebook, y se agregan `og:url` y `canonical`.
- El HTML publicado lleva una política de seguridad de contenido (CSP) como `<meta>`. `public/_headers` suma las cabeceras que una `<meta>` no puede dar (anti-iframe, `nosniff`) y el caché largo de `/assets`; lo leen Netlify y Cloudflare Pages. En Vercel van en `vercel.json`.
- `npm run preview` sirve el build para probarlo antes de publicar.

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

El nombre corto de cada club (`shortName`) es su código en los links compartidos (`e=BOC.RIV`): no hay que cambiarlo ni repetirlo, porque rompería los links que ya circulan. `npm test` lo controla.

## Reportar un error en un título

Abrí un issue con el año, la competencia, el club y una fuente oficial. Para corregirlo, se edita la fila en `src/data/titles.json` y, si cambia un total, `src/data/expected-totals.json` con su fuente. `npm test` compara ambos.
