import { firstProfessionalYear, professionalRange, toggleAmateur } from './range';
import type { Filters } from './types';

// Mismos números que los datos reales: de 1891 a 2026, profesionalismo desde 1931.
const BOUNDS = { min: 1891, max: 2026 };
const PRO = 1931;

const off = (filters: Filters) => toggleAmateur(filters, false, null, PRO, BOUNDS);
const on = (filters: Filters, saved: ReturnType<typeof off>['saved']) => toggleAmateur(filters, true, saved, PRO, BOUNDS);

test('destildar y volver a tildar devuelve cada rango posible tal cual estaba', () => {
  const broken: string[] = [];
  for (let from = BOUNDS.min; from <= BOUNDS.max; from++) {
    for (let to = from; to <= BOUNDS.max; to++) {
      const start: Filters = { includeAmateur: true, from, to };
      const a = off(start);
      const expectedOff = { from: Math.max(from, PRO), to: to < PRO ? BOUNDS.max : to };
      if (a.filters.from !== expectedOff.from || a.filters.to !== expectedOff.to || a.filters.includeAmateur) broken.push(`off ${from}-${to}`);
      const b = on(a.filters, a.saved);
      if (b.filters.from !== from || b.filters.to !== to || !b.filters.includeAmateur) broken.push(`on ${from}-${to}`);
    }
  }
  expect(broken).toEqual([]);
});

test('si se movió un extremo sin amateurismo, al tildar se respeta lo movido', () => {
  const a = off({ includeAmateur: true, from: 1900, to: 1920 });
  expect(a.filters).toEqual({ includeAmateur: false, from: 1931, to: 2026 });
  const moved = { ...a.filters, from: 1960, to: 1980 };
  expect(on(moved, a.saved).filters).toEqual({ includeAmateur: true, from: 1960, to: 1980 });
  const onlyFrom = { ...a.filters, from: 1960 };
  expect(on(onlyFrom, a.saved).filters).toEqual({ includeAmateur: true, from: 1960, to: 2026 });
});

test('sin rango guardado, el piso profesional se estira hasta el principio', () => {
  expect(on({ includeAmateur: false, from: PRO, to: 2000 }, null).filters).toEqual({ includeAmateur: true, from: 1891, to: 2000 });
  expect(on({ includeAmateur: false, from: 1950, to: 2000 }, null).filters).toEqual({ includeAmateur: true, from: 1950, to: 2000 });
});

test('el rango sin amateurismo nunca se aplasta en un año', () => {
  expect(professionalRange({ from: 1900, to: 1920 }, PRO, 2026)).toEqual({ from: 1931, to: 2026 });
  expect(professionalRange({ from: 1925, to: 1940 }, PRO, 2026)).toEqual({ from: 1931, to: 1940 });
});

test('el primer año profesional sale de los datos', () => {
  const t = (year: number, era: 'amateur' | 'profesional') => ({ year, era }) as Parameters<typeof firstProfessionalYear>[0][number];
  expect(firstProfessionalYear([t(1920, 'amateur'), t(1950, 'profesional'), t(1940, 'profesional')], 2015)).toBe(1940);
  expect(firstProfessionalYear([t(1920, 'amateur')], 2015)).toBe(2015);
});
