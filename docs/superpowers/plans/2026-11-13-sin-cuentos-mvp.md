# Sin Cuentos MVP: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sitio estático donde el usuario valora los títulos del fútbol argentino (camino canchero o nerd) y ve un ranking histórico animado y compartible por link.

**Architecture:** Un núcleo de funciones puras (`src/core`) recibe títulos, pesos y filtros y devuelve ranking y serie temporal. Los datos son JSON estáticos en `src/data`. React dibuja lo que devuelve el núcleo; Zustand guarda el paso actual, los pesos y los filtros; la URL transporta el resultado compartido.

**Tech Stack:** Vite, React, TypeScript, Zustand, GSAP (`gsap`, `@gsap/react`), `d3-scale`, `d3-shape`, CSS propio con variables, Vitest, Testing Library. Node 26, npm.

**Spec:** `docs/superpowers/specs/2026-11-13-sin-cuentos-design.md`

## Global Constraints

- Solo front. Sin servidor, sin llamadas de red en tiempo de ejecución.
- Todo lo gráfico es SVG. Ninguna imagen de mapa de bits. Ningún escudo oficial: insignias propias con colores e iniciales.
- Diseño primero para 360 px de ancho.
- Con `prefers-reduced-motion: reduce`, toda animación salta al estado final. Toda animación se puede saltear con un toque.
- `src/core` no importa React, Zustand ni GSAP.
- `liga_anual` y `liga_corta` nunca se escriben a mano en los datos: las calcula `resolveTitles`.
- Pesos: enteros de 0 a 99. Valores por defecto: `liga_corta` 1, `liga_anual` 2, `copa_nacional` 1, `tier_b` 2, `tier_a` 4, `mundo` 8.
- Textos de interfaz en español rioplatense, tono canchero y directo.
- Sin framework de componentes ni Tailwind.
- Para todo trabajo visual (tareas 6 a 10) se usa la skill `frontend-design:frontend-design`.

## Review Focus

1. **Link malformado o viejo** (`q=902`, `w` con cinco valores, `v=2`, `d=2000-1990`): la página abre en el inicio, sin error. Test en la tarea 4.
2. **Todos los pesos en cero** (modo nerd): no hay ranking; el resultado muestra un mensaje en vez de una tabla vacía o un gráfico roto. Tests en las tareas 3 y 10.
3. **Rango de un solo año o sin títulos** (`from === to`): la serie tiene un punto y el gráfico no divide por cero. Tests en las tareas 3 y 8.
4. **Amateurismo destildado**: los clubes que solo tienen títulos amateurs desaparecen del ranking y del gráfico. Test en la tarea 3.
5. **Movimiento reducido**: la carrera y el cálculo muestran el estado final de inmediato. Test en la tarea 8.

## Estructura de archivos

```
src/
  core/
    types.ts          tipos compartidos
    weights.ts        pesos por defecto y cadena del canchero
    resolve.ts        regla de liga: filas crudas a títulos con categoría
    score.ts          ranking y serie temporal
    share.ts          codificar y decodificar el link
    fixture.ts        datos mínimos para tests
    *.test.ts
  data/
    clubs.json  competitions.json  titles.json  expected-totals.json
    index.ts          exporta los datos tipados y ya resueltos
    data.test.ts      integridad y totales oficiales
  state/
    store.ts          Zustand: paso, modo, respuestas, pesos, filtros
  ui/
    App.tsx           elige pantalla según el paso
    screens/          Inicio, Canchero, Nerd, Calculo, Carrera, Resultado
    chart/            geometry.ts (pura), RaceChart.tsx
    Badge.tsx         insignia SVG
    motion.ts         usePrefersReducedMotion
  styles/
    tokens.css  base.css
docs/design/direccion-visual.md
```

---

### Task 1: Proyecto base, tipos y pesos

**Files:**
- Create: proyecto Vite en la raíz (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`)
- Create: `src/core/types.ts`, `src/core/weights.ts`
- Test: `src/core/weights.test.ts`

**Interfaces:**
- Produces:

```ts
// types.ts
export type ScoredCategory = 'liga_corta' | 'liga_anual' | 'copa_nacional' | 'tier_b' | 'tier_a' | 'mundo';
export type VitrinaCategory = 'vitrina_nacional' | 'tier_c';
export type Category = ScoredCategory | VitrinaCategory;
export type Era = 'amateur' | 'profesional';
export type Weights = Record<ScoredCategory, number>;
export interface Club { id: string; name: string; shortName: string; colors: [string, string]; }
export interface Competition {
  id: string; name: string; organizer: string;
  category: 'liga' | Exclude<Category, 'liga_anual' | 'liga_corta'>;
}
export interface TitleRow {
  year: number; competitionId: string; clubId: string; era: Era;
  season?: string; source: string; note?: string;
}
export interface Title { year: number; competitionId: string; clubId: string; era: Era; category: Category; }
export interface Filters { includeAmateur: boolean; from: number; to: number; }
export type CancheroAnswers = [0 | 1 | 2 | 3, 0 | 1 | 2, 0 | 1 | 2];

// weights.ts
export const SCORED_ORDER: ScoredCategory[]; // liga_corta, liga_anual, copa_nacional, tier_b, tier_a, mundo
export const DEFAULT_WEIGHTS: Weights;
export function cancheroWeights(answers: CancheroAnswers): Weights;
```

- [ ] **Step 1: Crear el proyecto**

Run: `npm create vite@latest . -- --template react-ts` (conservar `README.md` y `docs/`), luego `npm install zustand gsap @gsap/react d3-scale d3-shape` y `npm install -D vitest @testing-library/react @testing-library/user-event jsdom @types/d3-scale @types/d3-shape`. Configurar Vitest con `environment: 'jsdom'` en `vite.config.ts` y agregar el script `"test": "vitest run"`. Borrar el contenido de ejemplo de Vite.

- [ ] **Step 2: Escribir el test que falla**

```ts
import { cancheroWeights, DEFAULT_WEIGHTS } from './weights';

test('pesos por defecto', () => {
  expect(DEFAULT_WEIGHTS).toEqual({ liga_corta: 1, liga_anual: 2, copa_nacional: 1, tier_b: 2, tier_a: 4, mundo: 8 });
});
test('cadena mínima: media liga, lo mismo, lo mismo', () => {
  expect(cancheroWeights([0, 0, 0])).toMatchObject({ tier_b: 1, tier_a: 1, mundo: 1 });
});
test('cadena máxima: tres ligas, el triple, el triple', () => {
  expect(cancheroWeights([3, 2, 2])).toMatchObject({ tier_b: 6, tier_a: 18, mundo: 54 });
});
test('cadena intermedia y base fija', () => {
  expect(cancheroWeights([1, 1, 2])).toEqual({ liga_corta: 1, liga_anual: 2, copa_nacional: 1, tier_b: 2, tier_a: 4, mundo: 12 });
});
```

- [ ] **Step 3: Verificar que falla.** Run: `npm test -- weights`. Expected: FAIL, módulo inexistente.
- [ ] **Step 4: Implementar `types.ts` y `weights.ts`.** Pregunta 1 mapea a `[1, 2, 4, 6]`; preguntas 2 y 3 multiplican por `[1, 2, 3]`.
- [ ] **Step 5: Verificar que pasa.** Run: `npm test -- weights` y `npm run build`. Expected: PASS y build sin errores.
- [ ] **Step 6: Commit.** `git commit -m "feat: proyecto base, tipos y pesos del canchero"`

---

### Task 2: Regla de liga (`resolveTitles`)

**Files:**
- Create: `src/core/resolve.ts`, `src/core/fixture.ts`
- Test: `src/core/resolve.test.ts`

**Interfaces:**
- Consumes: tipos de la tarea 1.
- Produces: `resolveTitles(rows: TitleRow[], competitions: Competition[]): Title[]` y el fixture `FIXTURE_CLUBS`, `FIXTURE_COMPETITIONS`, `FIXTURE_ROWS`.

Fixture (todas las fuentes `"test"`). Competencias: `liga` (`liga`), `copa_argentina` (`copa_nacional`), `sudamericana` (`tier_b`), `libertadores` (`tier_a`), `intercontinental` (`mundo`), `recopa` (`tier_c`), `supercopa_arg` (`vitrina_nacional`). Clubes: `zeta`, `beta`, `alfa` (el nombre es el id con mayúscula inicial). Filas:

| year | competitionId | clubId | era | season |
|---|---|---|---|---|
| 1920 | liga | zeta | amateur | |
| 1950 | liga | zeta | profesional | |
| 1970 | liga | zeta | profesional | 1970 |
| 1970 | liga | beta | profesional | 1970 |
| 1991 | liga | beta | profesional | 1991/92 |
| 1992 | liga | zeta | profesional | 1991/92 |
| 2000 | libertadores | beta | profesional | |
| 2000 | intercontinental | beta | profesional | |
| 2005 | sudamericana | zeta | profesional | |
| 2010 | recopa | zeta | profesional | |
| 2012 | copa_argentina | alfa | profesional | |
| 2015 | supercopa_arg | alfa | profesional | |

- [ ] **Step 1: Escribir el test que falla**

```ts
const titles = resolveTitles(FIXTURE_ROWS, FIXTURE_COMPETITIONS);
const cat = (year: number, clubId: string) => titles.find(t => t.year === year && t.clubId === clubId)!.category;

test('única liga del año es anual', () => { expect(cat(1920, 'zeta')).toBe('liga_anual'); expect(cat(1950, 'zeta')).toBe('liga_anual'); });
test('dos ligas en el mismo año son cortas', () => { expect(cat(1970, 'zeta')).toBe('liga_corta'); expect(cat(1970, 'beta')).toBe('liga_corta'); });
test('la temporada agrupa años distintos', () => { expect(cat(1991, 'beta')).toBe('liga_corta'); expect(cat(1992, 'zeta')).toBe('liga_corta'); });
test('el resto hereda la categoría de la competencia', () => { expect(cat(2005, 'zeta')).toBe('tier_b'); expect(cat(2015, 'alfa')).toBe('vitrina_nacional'); });
test('amateur y profesional del mismo año no se restan valor', () => {
  const rows = [{ ...FIXTURE_ROWS[0], year: 1931, clubId: 'alfa' }, { ...FIXTURE_ROWS[1], year: 1931, clubId: 'beta' }];
  expect(resolveTitles(rows, FIXTURE_COMPETITIONS).map(t => t.category)).toEqual(['liga_anual', 'liga_anual']);
});
test('competencia desconocida lanza error', () => {
  expect(() => resolveTitles([{ ...FIXTURE_ROWS[0], competitionId: 'nope' }], FIXTURE_COMPETITIONS)).toThrow(/nope/);
});
```

- [ ] **Step 2: Verificar que falla.** Run: `npm test -- resolve`. Expected: FAIL.
- [ ] **Step 3: Implementar `resolveTitles`.** La clave de agrupación de las ligas es `era` más `season ?? String(year)`; grupo de tamaño 1 es `liga_anual`, mayor es `liga_corta`.
- [ ] **Step 4: Verificar que pasa.** Run: `npm test -- resolve`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: regla de liga anual y corta"`

---

### Task 3: Ranking y serie temporal

**Files:**
- Create: `src/core/score.ts`
- Test: `src/core/score.test.ts`

**Interfaces:**
- Consumes: `Title`, `Weights`, `Filters`, `resolveTitles`, fixture.
- Produces:

```ts
export interface ClubResult {
  clubId: string; rank: number; points: number; vitrina: number;
  counts: Record<Category, number>;
}
export interface Timeline { years: number[]; series: { clubId: string; cumulative: number[] }[]; }
export function computeRanking(titles: Title[], weights: Weights, filters: Filters, clubs: Club[]): ClubResult[];
export function computeTimeline(titles: Title[], weights: Weights, filters: Filters, clubs: Club[]): Timeline;
```

Reglas: un título cuenta si `from <= year <= to` y (`includeAmateur` o `era === 'profesional'`). El ranking incluye solo clubes con `points > 0`. Orden: puntos descendente, vitrina descendente, `name` ascendente con `localeCompare('es')`. `rank` empieza en 1 y no repite. `years` va de `from` a `to` inclusive; `series` sigue el orden del ranking y `cumulative[i]` es el puntaje acumulado hasta `years[i]`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
const T = resolveTitles(FIXTURE_ROWS, FIXTURE_COMPETITIONS);
const ALL: Filters = { includeAmateur: true, from: 1920, to: 2015 };
const rank = (w = DEFAULT_WEIGHTS, f = ALL) => computeRanking(T, w, f, FIXTURE_CLUBS).map(r => [r.clubId, r.points, r.vitrina]);

test('ranking completo', () => { expect(rank()).toEqual([['beta', 14, 0], ['zeta', 8, 1], ['alfa', 1, 1]]); });
test('sin amateurismo', () => { expect(rank(DEFAULT_WEIGHTS, { ...ALL, includeAmateur: false })[1]).toEqual(['zeta', 6, 1]); });
test('club solo amateur desaparece', () => {
  const soloAmateur = T.filter(t => t.year === 1920);
  expect(computeRanking(soloAmateur, DEFAULT_WEIGHTS, { ...ALL, includeAmateur: false }, FIXTURE_CLUBS)).toEqual([]);
});
test('rango de años', () => { expect(rank(DEFAULT_WEIGHTS, { ...ALL, from: 2000 })).toEqual([['beta', 12, 0], ['zeta', 2, 1], ['alfa', 1, 1]]); });
const TIE: Weights = { liga_corta: 0, liga_anual: 0, copa_nacional: 2, tier_b: 2, tier_a: 0, mundo: 0 };
test('empate total: alfabético', () => { expect(rank(TIE).map(r => r[0])).toEqual(['alfa', 'zeta']); });
test('empate: gana la vitrina', () => { expect(rank(TIE, { ...ALL, from: 2005, to: 2012 }).map(r => r[0])).toEqual(['zeta', 'alfa']); });
test('todos los pesos en cero: ranking vacío', () => {
  const zero: Weights = { liga_corta: 0, liga_anual: 0, copa_nacional: 0, tier_b: 0, tier_a: 0, mundo: 0 };
  expect(rank(zero)).toEqual([]);
  expect(computeTimeline(T, zero, ALL, FIXTURE_CLUBS).series).toEqual([]);
});
test('counts por categoría', () => {
  const zeta = computeRanking(T, DEFAULT_WEIGHTS, ALL, FIXTURE_CLUBS).find(r => r.clubId === 'zeta')!;
  expect(zeta.counts).toMatchObject({ liga_anual: 2, liga_corta: 2, tier_b: 1, tier_c: 1 });
});
test('serie temporal', () => {
  const tl = computeTimeline(T, DEFAULT_WEIGHTS, ALL, FIXTURE_CLUBS);
  expect(tl.years[0]).toBe(1920); expect(tl.years.at(-1)).toBe(2015); expect(tl.years).toHaveLength(96);
  const beta = tl.series[0]; const at = (y: number) => beta.cumulative[y - 1920];
  expect(beta.clubId).toBe('beta');
  expect([at(1969), at(1970), at(1991), at(1999), at(2000), at(2015)]).toEqual([0, 1, 2, 2, 14, 14]);
});
test('rango de un solo año', () => {
  const tl = computeTimeline(T, DEFAULT_WEIGHTS, { ...ALL, from: 2000, to: 2000 }, FIXTURE_CLUBS);
  expect(tl.years).toEqual([2000]); expect(tl.series[0]).toEqual({ clubId: 'beta', cumulative: [12] });
});
```

- [ ] **Step 2: Verificar que fallan.** Run: `npm test -- score`. Expected: FAIL.
- [ ] **Step 3: Implementar `computeRanking` y `computeTimeline`.** `computeTimeline` reutiliza `computeRanking` para el orden y el filtro de clubes.
- [ ] **Step 4: Verificar que pasan.** Run: `npm test -- score`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: ranking y serie temporal"`

---

### Task 4: Link para compartir

**Files:**
- Create: `src/core/share.ts`
- Test: `src/core/share.test.ts`

**Interfaces:**
- Produces:

```ts
export type ShareState =
  | { mode: 'c'; answers: CancheroAnswers; filters: Filters }
  | { mode: 'n'; weights: Weights; filters: Filters };
export function encodeShare(state: ShareState): string;              // sin "?" inicial
export function decodeShare(search: string, bounds: { min: number; max: number }): ShareState | null;
```

`decodeShare` acepta el string con o sin `?`. Devuelve `null` ante cualquier parámetro faltante o inválido, salvo el rango: años fuera de `bounds` se recortan a `bounds`; `desde > hasta` es `null`.

- [ ] **Step 1: Escribir los tests que fallan**

```ts
const B = { min: 1891, max: 2025 };
const F: Filters = { includeAmateur: true, from: 1891, to: 2025 };

test('canchero', () => { expect(encodeShare({ mode: 'c', answers: [1, 0, 2], filters: F })).toBe('v=1&m=c&q=102&a=1&d=1891-2025'); });
test('nerd', () => {
  expect(encodeShare({ mode: 'n', weights: DEFAULT_WEIGHTS, filters: { includeAmateur: false, from: 1931, to: 2025 } }))
    .toBe('v=1&m=n&w=1.2.1.2.4.8&a=0&d=1931-2025');
});
test('ida y vuelta', () => {
  const s: ShareState = { mode: 'n', weights: { ...DEFAULT_WEIGHTS, mundo: 99 }, filters: F };
  expect(decodeShare('?' + encodeShare(s), B)).toEqual(s);
});
test.each(['', 'v=2&m=c&q=102&a=1&d=1891-2025', 'v=1&m=c&q=902&a=1&d=1891-2025', 'v=1&m=c&q=10&a=1&d=1891-2025',
  'v=1&m=n&w=1.2.1.2.4&a=1&d=1891-2025', 'v=1&m=n&w=1.2.1.2.4.100&a=1&d=1891-2025', 'v=1&m=n&w=1.2.x.2.4.8&a=1&d=1891-2025',
  'v=1&m=c&q=102&a=7&d=1891-2025', 'v=1&m=c&q=102&a=1&d=2000-1990', 'v=1&m=x&q=102&a=1&d=1891-2025'])(
  'inválido: %s', s => { expect(decodeShare(s, B)).toBeNull(); });
test('rango fuera de límites se recorta', () => {
  expect(decodeShare('v=1&m=c&q=000&a=1&d=1800-2100', B)!.filters).toMatchObject({ from: 1891, to: 2025 });
});
```

- [ ] **Step 2: Verificar que fallan.** Run: `npm test -- share`. Expected: FAIL.
- [ ] **Step 3: Implementar con `URLSearchParams`.** El orden de `w` es `SCORED_ORDER`.
- [ ] **Step 4: Verificar que pasan.** Run: `npm test -- share`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: link para compartir"`

---

### Task 5: Datos históricos

Tarea de investigación. No depende de las tareas 2 a 4 más que por los tipos; puede hacerse en paralelo.

**Files:**
- Create: `src/data/clubs.json`, `src/data/competitions.json`, `src/data/titles.json`, `src/data/expected-totals.json`, `src/data/index.ts`
- Test: `src/data/data.test.ts`

**Interfaces:**
- Consumes: `Club`, `Competition`, `TitleRow`, `resolveTitles`.
- Produces: `export const CLUBS: Club[]`, `COMPETITIONS: Competition[]`, `TITLES: Title[]` (ya resueltos), `YEAR_BOUNDS: { min: number; max: number }` (mínimo y máximo de `TITLES`).

Formato de `expected-totals.json`: `{ "source": "<url>", "retrieved": "YYYY-MM-DD", "liga": { "<clubId>": n }, "tier_a": { "<clubId>": n }, "mundo": { "<clubId>": n } }`.

- [ ] **Step 1: Escribir los tests de integridad (fallan por falta de datos)**

Assertions de `data.test.ts`:
- toda fila referencia un `clubId` y un `competitionId` existentes;
- toda fila tiene `source` que empieza con `https://`;
- `era === 'amateur'` solo en filas con `year <= 1934`; ninguna fila de competencia internacional de CONMEBOL o FIFA es amateur;
- no hay dos filas con el mismo `year` + `competitionId` + `season`, salvo que ambas lleven `note`;
- toda fila de liga posterior a 1985 que comparta temporada con otra tiene `season`;
- `colors` son dos hex de 7 caracteres;
- por cada club en `expected-totals.json`, la cantidad de filas en `TITLES` coincide para liga (`liga_anual` + `liga_corta`), `tier_a` y `mundo`.

- [ ] **Step 2: Investigar y cargar las competencias.** Lista mínima y su categoría, según el spec: Primera División (`liga`); Copa Argentina y Copa de la Liga (`copa_nacional`); Sudamericana, Copa CONMEBOL, Supercopa Sudamericana, Mercosur (`tier_b`); Libertadores (`tier_a`); Intercontinental y Mundial de Clubes (`mundo`); Recopa, Interamericana, Suruga, copas rioplatenses y similares (`tier_c`); demás copas nacionales oficiales de cualquier era (`vitrina_nacional`).
- [ ] **Step 3: Investigar y cargar los títulos.** Fuente primaria: listados oficiales de AFA, CONMEBOL y FIFA; RSSSF como verificación cruzada. Solo títulos de clubes argentinos. Casos a anotar en `note` siguiendo el listado de la AFA: 1931 a 1934 (Liga Argentina de Football), 1936, asociaciones paralelas del amateurismo, 1985/86 a 1990/91 (un campeón por temporada), superfinales 2012/13 y 2013/14, Transición 2014, título por tabla anual 2025. Si dos fuentes se contradicen, vale la AFA y se anota.
- [ ] **Step 4: Cargar `expected-totals.json`** con los totales del listado oficial y su URL, sin derivarlos de `titles.json`.
- [ ] **Step 5: Cargar `clubs.json`** con todo club que aparezca en `titles.json`, sus dos colores y un `shortName` de hasta 4 letras.
- [ ] **Step 6: Verificar.** Run: `npm test -- data`. Expected: PASS. Una diferencia de totales se resuelve corrigiendo los datos, nunca el test.
- [ ] **Step 7: Commit.** `git commit -m "feat: datos históricos de títulos"`

---

### Task 6: Dirección visual (requiere aprobación de Sergio)

**Files:**
- Create: `docs/design/direccion-visual.md`, `src/styles/tokens.css`, `src/styles/base.css`
- Create: maquetas en `docs/design/maquetas/*.html`

- [ ] **Step 1: Invocar la skill `frontend-design:frontend-design`.**
- [ ] **Step 2: Hacer tres maquetas estáticas** (HTML y SVG, a 360 px y a escritorio) de dos pantallas cada una: una pregunta del canchero y la carrera. Una sigue la propuesta "noche de cancha" del spec; las otras dos son direcciones distintas entre sí.
- [ ] **Step 3: Mostrárselas a Sergio y esperar su elección.** No avanzar a la tarea 7 sin ella.
- [ ] **Step 4: Escribir `direccion-visual.md`** con la dirección elegida: paleta, tipografías, trazos, grilla, y el vocabulario de movimiento (qué se dibuja, qué entra, cuánto dura).
- [ ] **Step 5: Volcarla a `tokens.css` y `base.css`** como variables CSS. Las tipografías se sirven desde el propio sitio.
- [ ] **Step 6: Commit.** `git commit -m "design: dirección visual y tokens"`

---

### Task 7: Estado y pantallas de entrada

**Files:**
- Create: `src/state/store.ts`, `src/ui/App.tsx`, `src/ui/screens/Inicio.tsx`, `src/ui/screens/Canchero.tsx`, `src/ui/screens/Nerd.tsx`
- Modify: `src/main.tsx`
- Test: `src/state/store.test.ts`, `src/ui/screens/Canchero.test.tsx`, `src/ui/screens/Nerd.test.tsx`

**Interfaces:**
- Consumes: `cancheroWeights`, `DEFAULT_WEIGHTS`, `decodeShare`, `YEAR_BOUNDS`.
- Produces:

```ts
export type Step = 'inicio' | 'canchero' | 'nerd' | 'calculo' | 'carrera' | 'resultado';
export interface AppState {
  step: Step; mode: 'c' | 'n';
  answers: (number | null)[];          // tres posiciones
  weights: Weights; filters: Filters;
  start(mode: 'c' | 'n'): void;        // nerd conserva los pesos actuales
  answer(index: 0 | 1 | 2, value: number): void;
  setWeight(cat: ScoredCategory, value: number): void;   // recorta a 0..99, entero
  setFilters(patch: Partial<Filters>): void;             // garantiza from <= to dentro de YEAR_BOUNDS
  go(step: Step): void;
  reset(): void;
  loadFromUrl(search: string): void;   // link válido: carga y va a 'carrera'; inválido: 'inicio'
}
export const useStore: UseBoundStore<StoreApi<AppState>>;
```

- [ ] **Step 1: Tests del store que fallan**

```ts
test('responder las tres preguntas fija los pesos', () => {
  const s = useStore.getState(); s.reset(); s.start('c'); s.answer(0, 3); s.answer(1, 2); s.answer(2, 2);
  expect(useStore.getState().weights).toMatchObject({ tier_b: 6, tier_a: 18, mundo: 54 });
});
test('pasar a nerd conserva los pesos del canchero', () => { /* tras lo anterior */ useStore.getState().start('n'); expect(useStore.getState().weights.mundo).toBe(54); });
test('setWeight recorta', () => { const s = useStore.getState(); s.setWeight('mundo', 250); expect(useStore.getState().weights.mundo).toBe(99); s.setWeight('mundo', -3); expect(useStore.getState().weights.mundo).toBe(0); s.setWeight('mundo', 2.7); expect(useStore.getState().weights.mundo).toBe(2); });
test('setFilters mantiene from <= to', () => { const s = useStore.getState(); s.setFilters({ from: 2000, to: 1990 }); const f = useStore.getState().filters; expect(f.from).toBeLessThanOrEqual(f.to); });
test('link válido va a la carrera', () => { useStore.getState().loadFromUrl('?v=1&m=c&q=102&a=0&d=1931-2000'); const s = useStore.getState(); expect(s.step).toBe('carrera'); expect(s.filters).toEqual({ includeAmateur: false, from: 1931, to: 2000 }); expect(s.weights.mundo).toBe(6); });
test('link inválido va al inicio', () => { useStore.getState().loadFromUrl('?v=1&m=c&q=999'); expect(useStore.getState().step).toBe('inicio'); });
```

- [ ] **Step 2: Tests de pantalla que fallan.** `Canchero`: muestra una pregunta por vez; la primera tiene cuatro botones y las otras tres; al responder la tercera aparece el botón "Calcular", que lleva a `calculo`. `Nerd`: seis campos numéricos con los valores del store; cada uno lista los torneos que incluye (nombres tomados de `COMPETITIONS`); "Calcular" lleva a `calculo`.
- [ ] **Step 3: Verificar que fallan.** Run: `npm test -- store Canchero Nerd`. Expected: FAIL.
- [ ] **Step 4: Implementar store, `App` y las tres pantallas** con los tokens de la tarea 6. `main.tsx` llama a `loadFromUrl(location.search)` antes de montar.
- [ ] **Step 5: Verificar.** Run: `npm test`. Expected: PASS. Run: `npm run dev` y recorrer ambos caminos a 360 px.
- [ ] **Step 6: Commit.** `git commit -m "feat: estado, inicio, canchero y nerd"`

---

### Task 8: Insignias y carrera

**Files:**
- Create: `src/ui/Badge.tsx`, `src/ui/motion.ts`, `src/ui/chart/geometry.ts`, `src/ui/chart/RaceChart.tsx`, `src/ui/screens/Carrera.tsx`
- Test: `src/ui/chart/geometry.test.ts`, `src/ui/chart/RaceChart.test.tsx`

**Interfaces:**
- Consumes: `Timeline`, `Club`, store.
- Produces:

```ts
// geometry.ts (pura, sin React)
export interface ChartLayout {
  paths: { clubId: string; d: string; end: { x: number; y: number } }[];
  xOf(year: number): number; yOf(points: number): number;
  ticksX: number[]; ticksY: number[];
}
export function layoutChart(tl: Timeline, size: { width: number; height: number; pad: number }): ChartLayout;

// Badge.tsx
export function Badge(props: { club: Club; size: number }): JSX.Element;   // <g> SVG, sin imágenes
// motion.ts
export function usePrefersReducedMotion(): boolean;
// RaceChart.tsx
export function RaceChart(props: { timeline: Timeline; clubs: Club[]; highlight: number; onDone(): void }): JSX.Element;
```

Comportamiento: las líneas son escalonadas (`curveStepAfter`), porque los puntos se ganan de golpe. La animación avanza un cursor de año de `from` a `to`; cada línea se revela hasta el cursor y la insignia viaja en su punta; un contador grande muestra el año. Los primeros `highlight` (8) clubes van a pleno color; el resto atenuado y sin insignia. Un toque en cualquier parte salta al final. `onDone` se llama al terminar o al saltear.

- [ ] **Step 1: Tests de geometría que fallan**

```ts
const tl = computeTimeline(T, DEFAULT_WEIGHTS, ALL, FIXTURE_CLUBS);
const L = layoutChart(tl, { width: 360, height: 240, pad: 20 });
test('un path por club, en orden de ranking', () => { expect(L.paths.map(p => p.clubId)).toEqual(['beta', 'zeta', 'alfa']); });
test('escalas', () => { expect(L.xOf(1920)).toBe(20); expect(L.xOf(2015)).toBe(340); expect(L.yOf(0)).toBe(220); expect(L.yOf(14)).toBe(20); });
test('la punta está en el último año', () => { expect(L.paths[0].end).toEqual({ x: 340, y: 20 }); });
test('un solo año no rompe', () => {
  const one = layoutChart(computeTimeline(T, DEFAULT_WEIGHTS, { ...ALL, from: 2000, to: 2000 }, FIXTURE_CLUBS), { width: 360, height: 240, pad: 20 });
  expect(Number.isFinite(one.paths[0].end.x)).toBe(true); expect(one.paths[0].d).not.toMatch(/NaN/);
});
test('serie vacía no rompe', () => { expect(layoutChart({ years: [2000], series: [] }, { width: 360, height: 240, pad: 20 }).paths).toEqual([]); });
```

- [ ] **Step 2: Test de componente que falla.** Con `matchMedia` simulando `prefers-reduced-motion: reduce`, `RaceChart` renderiza todos los paths completos, muestra el año final y llama a `onDone` sin esperar.
- [ ] **Step 3: Verificar que fallan.** Run: `npm test -- geometry RaceChart`. Expected: FAIL.
- [ ] **Step 4: Implementar.** `layoutChart` con `scaleLinear` y `line().curve(curveStepAfter)`. `RaceChart` usa `useGSAP` con una sola timeline que anima el cursor; el recorte de las líneas se hace con un `clipPath` cuyo ancho sigue al cursor, y la posición de cada insignia se calcula desde `cumulative` en el año del cursor. `Badge` dibuja un escudo con `colors` y `shortName`. `Carrera` calcula la timeline desde el store y al terminar pasa a `resultado`.
- [ ] **Step 5: Verificar.** Run: `npm test`. Expected: PASS. Run: `npm run dev`, abrir `/?v=1&m=c&q=111&a=1&d=1891-2025` y comprobar a 360 px: 60 cuadros por segundo, insignias sin superponerse en la llegada, salto con un toque.
- [ ] **Step 6: Commit.** `git commit -m "feat: insignias y carrera animada"`

---

### Task 9: Animación de cálculo

**Files:**
- Create: `src/ui/screens/Calculo.tsx`
- Test: `src/ui/screens/Calculo.test.tsx`

**Interfaces:**
- Consumes: store, `usePrefersReducedMotion`, `SCORED_ORDER`.
- Produces: pantalla `Calculo` que al terminar llama a `go('carrera')`.

Secuencia, según `direccion-visual.md`: las líneas de la cancha se dibujan; aparecen los seis grupos con el valor que eligió el usuario, de menor a mayor; la pelota sale y entra al ángulo siguiendo un path SVG; corte a la carrera. Duración total máxima: 4 segundos. Se saltea con un toque.

- [ ] **Step 1: Test que falla.** Con movimiento reducido, `Calculo` muestra los seis valores del store y pasa a `carrera` de inmediato. Sin movimiento reducido, un click pasa a `carrera`.
- [ ] **Step 2: Verificar que falla.** Run: `npm test -- Calculo`. Expected: FAIL.
- [ ] **Step 3: Implementar** con una timeline de GSAP. El trazo de las líneas usa `stroke-dasharray` y `stroke-dashoffset`; la pelota usa `MotionPathPlugin`.
- [ ] **Step 4: Verificar.** Run: `npm test`. Expected: PASS. Revisión visual en `npm run dev`.
- [ ] **Step 5: Commit.** `git commit -m "feat: animación de cálculo"`

---

### Task 10: Resultado

**Files:**
- Create: `src/ui/screens/Resultado.tsx`, `src/ui/RangeSlider.tsx`
- Test: `src/ui/screens/Resultado.test.tsx`

**Interfaces:**
- Consumes: `computeRanking`, `computeTimeline`, `encodeShare`, `RaceChart`, `Badge`, store, `CLUBS`, `TITLES`, `YEAR_BOUNDS`.
- Produces: `RangeSlider(props: { min: number; max: number; from: number; to: number; onChange(from: number, to: number): void })`.

Contenido: podio de los tres primeros; tabla con puesto, insignia, club, puntos y vitrina; al tocar un club se abre su desglose por grupo (cantidad × valor = subtotal) y la lista de sus títulos con año y link a la fuente. Controles: interruptor "Contar el amateurismo" (encendido por defecto), doble slider de años, "Compartir" (copia `location.origin + location.pathname + '?' + encodeShare(...)` y lo confirma en pantalla), "Quiero más control" (va a `nerd`, visible solo en modo canchero), "Empezar de nuevo". Al cambiar un filtro, el ranking y el gráfico se actualizan sin repetir la animación completa. La URL del navegador se mantiene sincronizada con `history.replaceState`.

- [ ] **Step 1: Tests que fallan**

Con el fixture inyectado y pesos por defecto:
- la tabla lista `Beta 14`, `Zeta 8`, `Alfa 1` en ese orden;
- al apagar el amateurismo, Zeta muestra `6`;
- al mover el rango a 2000–2015, Beta muestra `12`;
- el desglose de Beta muestra `1 × 8 = 8` para `mundo`;
- "Compartir" escribe en `navigator.clipboard` un link que `decodeShare` devuelve igual al estado actual;
- con todos los pesos en cero se muestra el mensaje "Con todo en cero no hay ranking" y un botón para volver a la calculadora, sin tabla ni gráfico;
- "Quiero más control" no aparece en modo nerd.

- [ ] **Step 2: Verificar que fallan.** Run: `npm test -- Resultado`. Expected: FAIL.
- [ ] **Step 3: Implementar.** `Resultado` recibe datos por props con los reales como valor por defecto, para poder inyectar el fixture. `RangeSlider` son dos `input type="range"` superpuestos con etiquetas accesibles.
- [ ] **Step 4: Verificar.** Run: `npm test`. Expected: PASS.
- [ ] **Step 5: Commit.** `git commit -m "feat: resultado, filtros y compartir"`

---

### Task 11: Verificación final

**Files:**
- Modify: `README.md`, `index.html` (título, descripción, etiquetas Open Graph estáticas, favicon SVG)

- [ ] **Step 1:** Run: `npm test` y `npm run build`. Expected: todo PASS, build sin advertencias de tipos.
- [ ] **Step 2:** Run: `npm run preview` y recorrer en el navegador, a 360 px y a escritorio: canchero completo, nerd completo, canchero a nerd, link compartido abierto en pestaña nueva, link roto, pesos en cero, rango de un año, amateurismo apagado.
- [ ] **Step 3:** Repetir el recorrido con movimiento reducido activado.
- [ ] **Step 4:** Comparar contra el spec, sección por sección, y contra `direccion-visual.md`. Anotar y corregir diferencias.
- [ ] **Step 5:** Actualizar `README.md`: qué es, cómo correrlo, de dónde salen los datos y cómo reportar un error en un título.
- [ ] **Step 6: Commit.** `git commit -m "chore: verificación final y README"`
