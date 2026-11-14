import { FIXTURE_CLUBS, FIXTURE_COMPETITIONS, FIXTURE_ROWS } from './fixture';
import { resolveTitles } from './resolve';
import { computeRanking, computeTimeline } from './score';
import type { Filters, Weights } from './types';
import { DEFAULT_WEIGHTS } from './weights';

const T = resolveTitles(FIXTURE_ROWS, FIXTURE_COMPETITIONS);
const ALL: Filters = { includeAmateur: true, from: 1920, to: 2015 };
const rank = (w = DEFAULT_WEIGHTS, f = ALL) => computeRanking(T, w, f, FIXTURE_CLUBS).map((r) => [r.clubId, r.points, r.vitrina]);

test('ranking completo', () => {
  expect(rank()).toEqual([
    ['beta', 14, 0],
    ['zeta', 8, 1],
    ['alfa', 1, 1],
  ]);
});
test('rank numera desde 1', () => {
  expect(computeRanking(T, DEFAULT_WEIGHTS, ALL, FIXTURE_CLUBS).map((r) => r.rank)).toEqual([1, 2, 3]);
});
test('sin amateurismo', () => {
  expect(rank(DEFAULT_WEIGHTS, { ...ALL, includeAmateur: false })[1]).toEqual(['zeta', 6, 1]);
});
test('club solo amateur desaparece', () => {
  const soloAmateur = T.filter((t) => t.year === 1920);
  expect(computeRanking(soloAmateur, DEFAULT_WEIGHTS, { ...ALL, includeAmateur: false }, FIXTURE_CLUBS)).toEqual([]);
});
test('rango de años', () => {
  expect(rank(DEFAULT_WEIGHTS, { ...ALL, from: 2000 })).toEqual([
    ['beta', 12, 0],
    ['zeta', 2, 1],
    ['alfa', 1, 1],
  ]);
});
const TIE: Weights = { liga_corta: 0, liga_anual: 0, copa_nacional: 2, tier_b: 2, tier_a: 0, mundo: 0 };
test('empate total: alfabético', () => {
  expect(rank(TIE).map((r) => r[0])).toEqual(['alfa', 'zeta']);
});
test('empate: gana la vitrina', () => {
  expect(rank(TIE, { ...ALL, from: 2005, to: 2012 }).map((r) => r[0])).toEqual(['zeta', 'alfa']);
});
test('todos los pesos en cero: ranking vacío', () => {
  const zero: Weights = { liga_corta: 0, liga_anual: 0, copa_nacional: 0, tier_b: 0, tier_a: 0, mundo: 0 };
  expect(rank(zero)).toEqual([]);
  expect(computeTimeline(T, zero, ALL, FIXTURE_CLUBS).series).toEqual([]);
});
test('counts por categoría', () => {
  const zeta = computeRanking(T, DEFAULT_WEIGHTS, ALL, FIXTURE_CLUBS).find((r) => r.clubId === 'zeta')!;
  expect(zeta.counts).toMatchObject({ liga_anual: 2, liga_corta: 2, tier_b: 1, tier_c: 1 });
});
test('serie temporal', () => {
  const tl = computeTimeline(T, DEFAULT_WEIGHTS, ALL, FIXTURE_CLUBS);
  expect(tl.years[0]).toBe(1920);
  expect(tl.years.at(-1)).toBe(2015);
  expect(tl.years).toHaveLength(96);
  const beta = tl.series[0];
  const at = (y: number) => beta.cumulative[y - 1920];
  expect(beta.clubId).toBe('beta');
  expect([at(1969), at(1970), at(1991), at(1999), at(2000), at(2015)]).toEqual([0, 1, 2, 2, 14, 14]);
});
test('rango de un solo año', () => {
  const tl = computeTimeline(T, DEFAULT_WEIGHTS, { ...ALL, from: 2000, to: 2000 }, FIXTURE_CLUBS);
  expect(tl.years).toEqual([2000]);
  expect(tl.series[0]).toEqual({ clubId: 'beta', cumulative: [12] });
});
