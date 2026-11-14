import { FIXTURE_CLUBS, FIXTURE_COMPETITIONS, FIXTURE_ROWS } from '../../core/fixture';
import { resolveTitles } from '../../core/resolve';
import { computeTimeline } from '../../core/score';
import type { Filters } from '../../core/types';
import { DEFAULT_WEIGHTS } from '../../core/weights';
import { layoutChart } from './geometry';

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
