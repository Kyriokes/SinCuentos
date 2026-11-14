import type { Club } from '../../core/types';

/** Diferencia mínima (ΔE en CIELAB) para que dos líneas no se confundan. */
export const MIN_DISTANCE = 30;
/** Luminosidad mínima para que una línea se vea sobre el césped. */
const MIN_LIGHTNESS = 0.5;

/** Colores de reserva para cuando los del club ya están tomados. Ninguno es verde. */
const SPARE = ['#ffd23f', '#ff8c1a', '#c98a4b', '#ff7eb6', '#b388ff', '#7fd3ff', '#ff5a4d', '#3d8bff', '#b9b9b9', '#ffffff'];

type Rgb = [number, number, number];

const toRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const toHex = ([r, g, b]: Rgb) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');

export function toHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = toRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

function fromHsl(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return toHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

function toLab(hex: string): [number, number, number] {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = f((0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047);
  const y = f(0.2126 * r + 0.7152 * g + 0.0722 * b);
  const z = f((0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

export function colorDistance(a: string, b: string): number {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/**
 * Dos colores chocan si están cerca, o si son el mismo color en dos tonos parecidos
 * (dos azules): la distancia sola deja pasar esos pares y a simple vista se confunden.
 */
export function clash(a: string, b: string): boolean {
  if (colorDistance(a, b) < MIN_DISTANCE) return true;
  const x = toHsl(a);
  const y = toHsl(b);
  if (x.s < 0.25 || y.s < 0.25) return false;
  const hue = Math.abs(x.h - y.h);
  return Math.min(hue, 360 - hue) < 15 && Math.abs(x.l - y.l) < 0.12;
}

/** Verde es el color del fondo: una línea verde se pierde. */
export function isGreen(hex: string): boolean {
  const { h, s } = toHsl(hex);
  return s > 0.2 && h > 55 && h < 175;
}

/** Aclara los colores oscuros (azul marino, granate, negro) hasta que se vean sobre el césped. */
function legible(hex: string): string {
  const { h, s, l } = toHsl(hex);
  return l >= MIN_LIGHTNESS ? hex.toLowerCase() : fromHsl(h, s, s < 0.1 ? 0.72 : MIN_LIGHTNESS);
}

const mix = (a: string, b: string) => {
  const [r1, g1, b1] = toRgb(a);
  const [r2, g2, b2] = toRgb(b);
  return toHex([(r1 + r2) / 2, (g1 + g2) / 2, (b1 + b2) / 2]);
};

/**
 * Reparte un color de línea a cada club, de arriba a abajo en el ranking.
 * Cada uno prueba, en orden: su color principal, el secundario y la mezcla de ambos.
 * Si los tres están tomados (o son verdes), se lleva el color de reserva más distinto de los ya usados.
 */
export function assignLineColors(clubsInRankOrder: Club[]): Map<string, string> {
  const assigned = new Map<string, string>();
  const taken: string[] = [];
  const gap = (color: string) => Math.min(Infinity, ...taken.map((t) => colorDistance(color, t)));

  for (const club of clubsInRankOrder) {
    const [primary, secondary] = club.colors;
    const own = [primary, secondary, mix(primary, secondary)].map(legible).filter((c) => !isGreen(c));
    const free = (c: string) => !taken.some((t) => clash(c, t));
    const farthest = (list: string[]) => list.reduce((best, c) => (gap(c) > gap(best) ? c : best));
    const spare = SPARE.filter(free);
    const color = own.find(free) ?? farthest(spare.length ? spare : SPARE);
    assigned.set(club.id, color);
    taken.push(color);
  }
  return assigned;
}
