import { decodeShare, encodeShare, type ShareState } from './share';
import type { Filters } from './types';
import { DEFAULT_WEIGHTS } from './weights';

const B = { min: 1891, max: 2025 };
const F: Filters = { includeAmateur: true, from: 1891, to: 2025 };

test('canchero', () => {
  expect(encodeShare({ mode: 'c', answers: [1, 0, 2], filters: F })).toBe('v=1&m=c&q=102&a=1&d=1891-2025');
});
test('nerd', () => {
  expect(encodeShare({ mode: 'n', weights: DEFAULT_WEIGHTS, filters: { includeAmateur: false, from: 1931, to: 2025 } })).toBe(
    'v=1&m=n&w=1.2.1.2.4.8&a=0&d=1931-2025',
  );
});
test('ida y vuelta nerd', () => {
  const s: ShareState = { mode: 'n', weights: { ...DEFAULT_WEIGHTS, mundo: 99 }, filters: F };
  expect(decodeShare('?' + encodeShare(s), B)).toEqual(s);
});
test('ida y vuelta canchero', () => {
  const s: ShareState = { mode: 'c', answers: [3, 2, 0], filters: { includeAmateur: false, from: 1950, to: 2000 } };
  expect(decodeShare(encodeShare(s), B)).toEqual(s);
});
test.each([
  '',
  'v=2&m=c&q=102&a=1&d=1891-2025',
  'v=1&m=c&q=902&a=1&d=1891-2025',
  'v=1&m=c&q=132&a=1&d=1891-2025',
  'v=1&m=c&q=10&a=1&d=1891-2025',
  'v=1&m=n&w=1.2.1.2.4&a=1&d=1891-2025',
  'v=1&m=n&w=1.2.1.2.4.100&a=1&d=1891-2025',
  'v=1&m=n&w=1.2.x.2.4.8&a=1&d=1891-2025',
  'v=1&m=n&w=1.2.-1.2.4.8&a=1&d=1891-2025',
  'v=1&m=c&q=102&a=7&d=1891-2025',
  'v=1&m=c&q=102&a=1&d=2000-1990',
  'v=1&m=c&q=102&a=1&d=2000',
  'v=1&m=x&q=102&a=1&d=1891-2025',
  'v=1&m=c&q=102&a=1&d=1000-1200',
  'v=1&m=c&q=102&a=1&d=2100-2200',
])('inválido: %s', (s) => {
  expect(decodeShare(s, B)).toBeNull();
});
test('rango fuera de límites se recorta', () => {
  expect(decodeShare('v=1&m=c&q=000&a=1&d=1800-2100', B)!.filters).toMatchObject({ from: 1891, to: 2025 });
});
