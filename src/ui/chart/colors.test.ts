import type { Club } from '../../core/types';
import { CLUBS } from '../../data';
import { assignLineColors, clash, isGreen, toHsl } from './colors';

const byId = (id: string) => CLUBS.find((c) => c.id === id)!;
const TOP = ['boca_juniors', 'river_plate', 'independiente', 'racing', 'estudiantes_lp', 'san_lorenzo', 'velez', 'alumni'].map(byId);
const colors = assignLineColors(TOP);
const hsl = (id: string) => toHsl(colors.get(id)!);

test('cada club destacado recibe un color', () => {
  expect([...colors.keys()]).toEqual(TOP.map((c) => c.id));
});

test('el primero se queda con su color principal: Boca azul, River blanco, Independiente rojo', () => {
  expect(hsl('boca_juniors').h).toBeGreaterThan(195);
  expect(hsl('boca_juniors').h).toBeLessThan(235);
  expect(hsl('river_plate').l).toBeGreaterThan(0.95);
  expect(hsl('independiente').h < 15 || hsl('independiente').h > 345).toBe(true);
});

test('Racing va de celeste: es su color y no choca con el azul ni con el blanco', () => {
  expect(colors.get('racing')).toBe(byId('racing').colors[0]);
});

test('con los dos colores tomados se mezclan: Estudiantes rosa, San Lorenzo violeta', () => {
  const est = hsl('estudiantes_lp');
  expect(est.h > 335 || est.h < 10).toBe(true);
  expect(est.l).toBeGreaterThan(0.65);
  const slo = hsl('san_lorenzo');
  expect(slo.h).toBeGreaterThan(255);
  expect(slo.h).toBeLessThan(335);
});

test('con todo tomado se usa un color libre que no sea verde', () => {
  const velez = colors.get('velez')!;
  expect(byId('velez').colors.map((c) => c.toLowerCase())).not.toContain(velez.toLowerCase());
  expect(isGreen(velez)).toBe(false);
  // Ni azul ni celeste: ya son de Boca y de Racing.
  const { h, s } = toHsl(velez);
  expect(s > 0.2 && h > 185 && h < 255).toBe(false);
});

test('dos tonos del mismo color chocan aunque uno sea más intenso', () => {
  expect(clash('#007eff', '#0051ff')).toBe(true);
  expect(clash('#e2231a', '#d2122e')).toBe(true);
  expect(clash('#e2231a', '#e98997')).toBe(false);
  expect(clash('#007eff', '#75aadb')).toBe(false);
});

test('ningún color es verde ni oscuro: tienen que verse sobre el césped', () => {
  for (const color of colors.values()) {
    expect(isGreen(color)).toBe(false);
    expect(toHsl(color).l).toBeGreaterThanOrEqual(0.5);
  }
});

test('ningún par de colores se confunde', () => {
  const list = [...colors.values()];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) expect(clash(list[i], list[j])).toBe(false);
  }
});

test('el oliva también cuenta como verde, pero el amarillo no', () => {
  expect(isGreen('#a6a758')).toBe(true);
  expect(isGreen('#ffd23f')).toBe(false);
});

test('un club verde no pinta de verde', () => {
  const verde: Club = { id: 'v', name: 'Verde', shortName: 'VER', colors: ['#00693e', '#00693e'] };
  expect(isGreen(assignLineColors([verde]).get('v')!)).toBe(false);
});

test('el orden manda: si cambia quién va primero, cambian los colores', () => {
  const invertido = assignLineColors([byId('estudiantes_lp'), byId('independiente')]);
  const est = toHsl(invertido.get('estudiantes_lp')!);
  expect(est.h < 15 || est.h > 345).toBe(true);
  expect(est.l).toBeLessThan(0.65);
  expect(toHsl(invertido.get('independiente')!).l).toBeGreaterThan(0.95);
});
