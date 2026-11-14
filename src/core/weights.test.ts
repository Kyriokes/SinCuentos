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
