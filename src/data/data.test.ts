import expected from './expected-totals.json';
import { CLUBS, COMPETITIONS, TITLE_ROWS, TITLES, YEAR_BOUNDS } from './index';

const clubIds = new Set(CLUBS.map((c) => c.id));
const competitionById = new Map(COMPETITIONS.map((c) => [c.id, c]));

test('hay datos', () => {
  expect(TITLE_ROWS.length).toBeGreaterThan(200);
  expect(YEAR_BOUNDS.min).toBeLessThan(1900);
  expect(YEAR_BOUNDS.max).toBeGreaterThanOrEqual(2024);
});

test('toda fila referencia un club y una competencia existentes', () => {
  const broken = TITLE_ROWS.filter((r) => !clubIds.has(r.clubId) || !competitionById.has(r.competitionId));
  expect(broken).toEqual([]);
});

test('todo club aparece en algún título y no hay ids repetidos', () => {
  const used = new Set(TITLE_ROWS.map((r) => r.clubId));
  expect(CLUBS.filter((c) => !used.has(c.id))).toEqual([]);
  expect(clubIds.size).toBe(CLUBS.length);
  expect(competitionById.size).toBe(COMPETITIONS.length);
});

test('toda fila tiene una fuente https', () => {
  expect(TITLE_ROWS.filter((r) => !r.source?.startsWith('https://'))).toEqual([]);
});

test('la era amateur termina en 1934 y no incluye torneos de CONMEBOL ni FIFA', () => {
  const wrong = TITLE_ROWS.filter((r) => {
    if (r.era !== 'amateur') return false;
    const organizer = competitionById.get(r.competitionId)!.organizer;
    return r.year > 1934 || organizer === 'CONMEBOL' || organizer === 'FIFA';
  });
  expect(wrong).toEqual([]);
});

test('ninguna fila anterior a 1931 es profesional', () => {
  expect(TITLE_ROWS.filter((r) => r.era === 'profesional' && r.year < 1931)).toEqual([]);
});

test('no hay títulos duplicados sin nota', () => {
  const seen = new Map<string, number>();
  for (const r of TITLE_ROWS) {
    const key = [r.year, r.competitionId, r.era, r.edition ?? ''].join('|');
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const duplicated = TITLE_ROWS.filter((r) => seen.get([r.year, r.competitionId, r.era, r.edition ?? ''].join('|'))! > 1 && !r.note);
  expect(duplicated).toEqual([]);
});

test('los colores son dos hex y el nombre corto tiene hasta 4 letras', () => {
  const hex = /^#[0-9a-f]{6}$/i;
  expect(CLUBS.filter((c) => c.colors.length !== 2 || !c.colors.every((x) => hex.test(x)))).toEqual([]);
  expect(CLUBS.filter((c) => c.shortName.length < 2 || c.shortName.length > 4)).toEqual([]);
});

test('los totales coinciden con los listados oficiales', () => {
  const count = (clubId: string, categories: string[]) => TITLES.filter((t) => t.clubId === clubId && categories.includes(t.category)).length;
  const actual = {
    liga: Object.fromEntries(Object.keys(expected.liga).map((id) => [id, count(id, ['liga_anual', 'liga_corta'])])),
    tier_a: Object.fromEntries(Object.keys(expected.tier_a).map((id) => [id, count(id, ['tier_a'])])),
    mundo: Object.fromEntries(Object.keys(expected.mundo).map((id) => [id, count(id, ['mundo'])])),
  };
  expect(actual).toEqual({ liga: expected.liga, tier_a: expected.tier_a, mundo: expected.mundo });
  expect(expected.source).toMatch(/^https:\/\//);
  expect(Object.keys(expected.liga).length).toBeGreaterThanOrEqual(10);
});
