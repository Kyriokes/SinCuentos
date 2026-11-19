import { FIXTURE_CLUBS, FIXTURE_COMPETITIONS, FIXTURE_ROWS } from '../../core/fixture';
import { resolveTitles } from '../../core/resolve';
import { computeTimeline } from '../../core/score';
import type { Filters } from '../../core/types';
import { DEFAULT_WEIGHTS } from '../../core/weights';
import { layoutChart, niceTicks, stackBadges } from './geometry';

const T = resolveTitles(FIXTURE_ROWS, FIXTURE_COMPETITIONS);
const ALL: Filters = { includeAmateur: true, from: 1920, to: 2015 };
const SIZE = { width: 360, height: 240, pad: 20 };
const L = layoutChart(computeTimeline(T, DEFAULT_WEIGHTS, ALL, FIXTURE_CLUBS), SIZE);

test('un path por club, en orden de ranking', () => {
  expect(L.paths.map((p) => p.clubId)).toEqual(['beta', 'zeta', 'alfa']);
});
test('escalas', () => {
  expect(L.xOf(1920)).toBe(20);
  expect(L.xOf(2015)).toBe(340);
  expect(L.yOf(0)).toBe(220);
  expect(L.yOf(14)).toBe(20);
});
test('la punta está en el último año', () => {
  expect(L.paths[0].end).toEqual({ x: 340, y: 20 });
});
test('un solo año no rompe', () => {
  const one = layoutChart(computeTimeline(T, DEFAULT_WEIGHTS, { ...ALL, from: 2000, to: 2000 }, FIXTURE_CLUBS), SIZE);
  expect(Number.isFinite(one.paths[0].end.x)).toBe(true);
  expect(one.paths[0].d).not.toMatch(/NaN/);
});
test('serie vacía no rompe', () => {
  const empty = layoutChart({ years: [2000], series: [] }, SIZE);
  expect(empty.paths).toEqual([]);
  expect(Number.isFinite(empty.yOf(0))).toBe(true);
});

test('las insignias sin puntos no empujan a las demás', () => {
  const placed = stackBadges(
    [
      { id: 'sin', points: 0, y: 384 },
      { id: 'otro', points: 0, y: 384 },
      { id: 'alumni', points: 2, y: 384 },
    ],
    26,
  );
  expect(placed.get('alumni')).toBe(384);
  expect(placed.has('sin')).toBe(false);
});
test('las insignias que se pisan se apilan hacia arriba', () => {
  const placed = stackBadges(
    [
      { id: 'a', points: 5, y: 100 },
      { id: 'b', points: 5, y: 100 },
      { id: 'c', points: 9, y: 40 },
    ],
    26,
  );
  expect([placed.get('a'), placed.get('b'), placed.get('c')].sort((x, y) => x! - y!)).toEqual([40, 74, 100]);
});

test('la escalera solo tiene un escalón por año en que cambian los puntos', () => {
  const d = L.paths.find((p) => p.clubId === 'zeta')!.d;
  // Zeta suma en 1920, 1950, 1970, 1992 y 2005: arranca en 1920 con puntos y tiene cuatro escalones más.
  expect(d.match(/V/g)).toHaveLength(4);
  expect(d.startsWith(`M20,`)).toBe(true);
  expect(d.endsWith('H340')).toBe(true);
});

test('las marcas del eje vertical son enteras y redondas', () => {
  expect(niceTicks(14, 5)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
  expect(niceTicks(112, 5)).toEqual([0, 20, 40, 60, 80, 100]);
  expect(niceTicks(1, 5)).toEqual([0, 1]);
  expect(niceTicks(0, 5)).toEqual([0]);
});

test('con escala ajustada, el máximo de los elegidos toca el borde de arriba', () => {
  const tl = computeTimeline(T, DEFAULT_WEIGHTS, ALL, FIXTURE_CLUBS);
  const alfa = tl.series.find((s) => s.clubId === 'alfa')!;
  const scaled = layoutChart(tl, SIZE, ['alfa']);
  expect(scaled.yOf(alfa.cumulative[alfa.cumulative.length - 1])).toBe(20);
});
