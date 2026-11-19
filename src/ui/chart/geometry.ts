import type { Timeline } from '../../core/score';

export interface ChartLayout {
  paths: { clubId: string; d: string; end: { x: number; y: number } }[];
  xOf(year: number): number;
  yOf(points: number): number;
  ticksX: number[];
  ticksY: number[];
}

/**
 * Altura final de cada insignia. Las que todavía no tienen puntos no se muestran ni ocupan lugar;
 * las que se pisan se apilan hacia arriba, sin salirse del borde superior.
 */
export function stackBadges(spots: { id: string; points: number; y: number }[], gap: number): Map<string, number> {
  const placed = new Map<string, number>();
  let floor = Infinity;
  for (const spot of spots.filter((s) => s.points > 0).sort((a, b) => b.y - a.y)) {
    const y = Math.max(gap / 2, Math.min(spot.y, floor - gap));
    floor = y;
    placed.set(spot.id, y);
  }
  return placed;
}

/** Escala lineal de [d0, d1] a [r0, r1]. */
const linear = (d0: number, d1: number, r0: number, r1: number) => (v: number) => (d1 === d0 ? r0 : r0 + ((v - d0) / (d1 - d0)) * (r1 - r0));

/**
 * Marcas enteras y "redondas" (pasos de 1, 2 o 5 por una potencia de 10) entre 0 y `max`, unas `count`.
 * Es el mismo criterio que usa d3 para elegir el paso, sin las marcas fraccionarias.
 */
export function niceTicks(max: number, count: number): number[] {
  if (!(max > 0)) return [0];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const error = raw / power;
  const step = Math.max(1, (error >= Math.sqrt(50) ? 10 : error >= Math.sqrt(10) ? 5 : error >= Math.SQRT2 ? 2 : 1) * power);
  const ticks: number[] = [];
  for (let i = 0; i * step <= max; i++) ticks.push(i * step);
  return ticks;
}

/** Un decimal alcanza para un SVG de pocos cientos de píxeles y acorta mucho el atributo `d`. */
const round1 = (v: number) => Math.round(v * 10) / 10;

/** Con `scaleTo`, la escala vertical se ajusta a esos clubes: comparar dos chicos no los deja pegados al piso. */
export function layoutChart(tl: Timeline, size: { width: number; height: number; pad: number }, scaleTo?: string[]): ChartLayout {
  const { width, height, pad } = size;
  const first = tl.years[0];
  const last = tl.years[tl.years.length - 1];
  const chosen = tl.series.filter((s) => scaleTo?.includes(s.clubId));
  const max = Math.max(1, ...(chosen.length ? chosen : tl.series).map((s) => s.cumulative[s.cumulative.length - 1] ?? 0));

  // Un solo año no tiene recorrido: ocupa todo el ancho y cada club es una raya horizontal a la altura de sus puntos.
  const single = first === last;
  const x = linear(first, last, pad, width - pad);
  const xOf = (year: number) => (single ? width - pad : x(year));
  const yOf = linear(0, max, height - pad, pad);

  // Los puntos se ganan de golpe: la línea es una escalera. Solo hace falta un escalón en los años en que el
  // acumulado cambia; los años sin títulos son tramos horizontales y no agregan nada al path.
  const stairs = (cumulative: number[]) => {
    let d = `M${round1(single ? pad : xOf(first))},${round1(yOf(cumulative[0] ?? 0))}`;
    for (let i = 1; i < cumulative.length; i++) {
      if (cumulative[i] !== cumulative[i - 1]) d += `H${round1(xOf(tl.years[i]))}V${round1(yOf(cumulative[i]))}`;
    }
    return `${d}H${round1(width - pad)}`;
  };

  const paths = tl.series.map((s) => ({
    clubId: s.clubId,
    d: stairs(s.cumulative),
    end: { x: xOf(last), y: yOf(s.cumulative[s.cumulative.length - 1] ?? 0) },
  }));

  const span = last - first;
  const stepX = span > 100 ? 25 : span > 40 ? 20 : span > 15 ? 10 : span > 6 ? 5 : 1;
  const ticksX = tl.years.filter((year) => year === first || year === last || (year % stepX === 0 && year - first > stepX / 2 && last - year > stepX / 2));
  const ticksY = niceTicks(max, 5);

  return { paths, xOf, yOf, ticksX, ticksY };
}
