import { CLUBS, YEAR_BOUNDS } from '../data';
import { useStore } from './store';

const s = () => useStore.getState();
beforeEach(() => s().reset());

test('estado inicial', () => {
  expect(s().step).toBe('inicio');
  expect(s().filters).toEqual({ includeAmateur: true, from: YEAR_BOUNDS.min, to: YEAR_BOUNDS.max });
});
test('responder las tres preguntas fija los pesos', () => {
  s().start('c');
  expect(s().step).toBe('canchero');
  s().answer(0, 3);
  s().answer(1, 2);
  s().answer(2, 2);
  expect(s().weights).toMatchObject({ tier_b: 6, tier_a: 18, mundo: 54 });
});
test('pasar a nerd conserva los pesos del canchero', () => {
  s().start('c');
  s().answer(0, 3);
  s().answer(1, 2);
  s().answer(2, 2);
  s().start('n');
  expect(s().step).toBe('nerd');
  expect(s().mode).toBe('n');
  expect(s().weights.mundo).toBe(54);
});
test('setWeight recorta a enteros de 0 a 99', () => {
  s().setWeight('mundo', 250);
  expect(s().weights.mundo).toBe(99);
  s().setWeight('mundo', -3);
  expect(s().weights.mundo).toBe(0);
  s().setWeight('mundo', 2.7);
  expect(s().weights.mundo).toBe(2);
  s().setWeight('mundo', Number.NaN);
  expect(s().weights.mundo).toBe(0);
});
test('setFilters mantiene from <= to y respeta los límites', () => {
  s().setFilters({ from: 2000, to: 1990 });
  expect(s().filters.from).toBeLessThanOrEqual(s().filters.to);
  s().setFilters({ from: 1500, to: 3000 });
  expect(s().filters).toMatchObject({ from: YEAR_BOUNDS.min, to: YEAR_BOUNDS.max });
});
test('link válido va a la carrera', () => {
  s().loadFromUrl('?v=1&m=c&q=102&a=0&d=1931-2000');
  expect(s().step).toBe('carrera');
  expect(s().filters).toEqual({ includeAmateur: false, from: 1931, to: 2000 });
  expect(s().weights.mundo).toBe(6);
  expect(s().answers).toEqual([1, 0, 2]);
});
test('link nerd válido carga los pesos', () => {
  s().loadFromUrl('?v=1&m=n&w=3.5.1.7.9.40&a=1&d=1931-2000');
  expect(s().mode).toBe('n');
  expect(s().weights).toEqual({ liga_corta: 3, liga_anual: 5, copa_nacional: 1, tier_b: 7, tier_a: 9, mundo: 40 });
});
test('link inválido va al inicio', () => {
  s().loadFromUrl('?v=1&m=c&q=999');
  expect(s().step).toBe('inicio');
});

describe('clubes elegidos', () => {
  test('por defecto no hay selección y reset la borra', () => {
    expect(s().selected).toBeNull();
    s().setSelected(['boca', 'river']);
    expect(s().selected).toEqual(['boca', 'river']);
    s().reset();
    expect(s().selected).toBeNull();
  });
  test('sin repetidos, hasta ocho, y vacío vuelve a automático', () => {
    s().setSelected(['a', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    expect(s().selected).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
    s().setSelected([]);
    expect(s().selected).toBeNull();
  });
  test('un link trae la selección por código corto y descarta los desconocidos', () => {
    const [one, two] = CLUBS;
    s().loadFromUrl(`?v=1&m=c&q=000&a=1&d=1891-2026&e=${two.shortName}.ZZZZ.${one.shortName}`);
    expect(s().step).toBe('carrera');
    expect(s().selected).toEqual([two.id, one.id]);
    s().loadFromUrl('?v=1&m=c&q=000&a=1&d=1891-2026');
    expect(s().selected).toBeNull();
    s().loadFromUrl('?v=1&m=c&q=000&a=1&d=1891-2026&e=ZZZZ');
    expect(s().selected).toBeNull();
  });
});
