import { FIXTURE_COMPETITIONS, FIXTURE_ROWS } from './fixture';
import { resolveTitles } from './resolve';

const titles = resolveTitles(FIXTURE_ROWS, FIXTURE_COMPETITIONS);
const cat = (year: number, clubId: string) => titles.find((t) => t.year === year && t.clubId === clubId)!.category;

test('única liga del año es anual', () => {
  expect(cat(1920, 'zeta')).toBe('liga_anual');
  expect(cat(1950, 'zeta')).toBe('liga_anual');
});
test('dos ligas en el mismo año son cortas', () => {
  expect(cat(1970, 'zeta')).toBe('liga_corta');
  expect(cat(1970, 'beta')).toBe('liga_corta');
});
test('la temporada agrupa años distintos', () => {
  expect(cat(1991, 'beta')).toBe('liga_corta');
  expect(cat(1992, 'zeta')).toBe('liga_corta');
});
test('el resto hereda la categoría de la competencia', () => {
  expect(cat(2005, 'zeta')).toBe('tier_b');
  expect(cat(2015, 'alfa')).toBe('vitrina_nacional');
});
test('amateur y profesional del mismo año no se restan valor', () => {
  const rows = [
    { ...FIXTURE_ROWS[0], year: 1931, clubId: 'alfa' },
    { ...FIXTURE_ROWS[1], year: 1931, clubId: 'beta' },
  ];
  expect(resolveTitles(rows, FIXTURE_COMPETITIONS).map((t) => t.category)).toEqual(['liga_anual', 'liga_anual']);
});
test('competencia desconocida lanza error', () => {
  expect(() => resolveTitles([{ ...FIXTURE_ROWS[0], competitionId: 'nope' }], FIXTURE_COMPETITIONS)).toThrow(/nope/);
});
