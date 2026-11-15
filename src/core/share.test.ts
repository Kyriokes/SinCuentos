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

describe('clubes elegidos para comparar', () => {
  const base = { mode: 'n' as const, weights: DEFAULT_WEIGHTS, filters: { includeAmateur: true, from: 1900, to: 2000 } };
  const BOUNDS = { min: 1891, max: 2026 };

  test('ida y vuelta con selección', () => {
    const query = encodeShare({ ...base, selected: ['BOC', 'RIV', 'CASI'] });
    expect(query).toMatch(/&e=BOC\.RIV\.CASI$/);
    expect(decodeShare(query, BOUNDS)).toEqual({ ...base, selected: ['BOC', 'RIV', 'CASI'] });
  });

  test('sin selección el link queda igual que antes', () => {
    const query = encodeShare(base);
    expect(query).not.toContain('e=');
    expect(encodeShare({ ...base, selected: [] })).toBe(query);
    expect(decodeShare(query, BOUNDS)).toEqual(base);
  });

  test('una selección rota se ignora sin invalidar el link', () => {
    const query = encodeShare(base);
    expect(decodeShare(`${query}&e=`, BOUNDS)).toEqual(base);
    expect(decodeShare(`${query}&e=<x>.boc..`, BOUNDS)).toEqual(base);
    expect(decodeShare(`${query}&e=BOC.<x>.BOC.RIV`, BOUNDS)).toEqual({ ...base, selected: ['BOC', 'RIV'] });
  });

  test('nunca más de ocho', () => {
    const many = ['AA', 'BB', 'CC', 'DD', 'EE', 'FF', 'GG', 'HH', 'II', 'JJ'];
    expect(decodeShare(`${encodeShare(base)}&e=${many.join('.')}`, BOUNDS)?.selected).toEqual(many.slice(0, 8));
    expect(encodeShare({ ...base, selected: many })).toMatch(/&e=AA\.BB\.CC\.DD\.EE\.FF\.GG\.HH$/);
  });
});
