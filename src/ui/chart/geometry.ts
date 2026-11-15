import { scaleLinear } from 'd3-scale';
import { curveStepAfter, line } from 'd3-shape';
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

/** Con `scaleTo`, la escala vertical se ajusta a esos clubes: comparar dos chicos no los deja pegados al piso. */
export function layoutChart(tl: Timeline, size: { width: number; height: number; pad: number }, scaleTo?: string[]): ChartLayout {
  const { width, height, pad } = size;
  const first = tl.years[0];
  const last = tl.years[tl.years.length - 1];
  const chosen = tl.series.filter((s) => scaleTo?.includes(s.clubId));
  const max = Math.max(1, ...(chosen.length ? chosen : tl.series).map((s) => s.cumulative[s.cumulative.length - 1] ?? 0));

  const x = scaleLinear().domain([first, last]).range([pad, width - pad]);
  const y = scaleLinear().domain([0, max]).range([height - pad, pad]);
  // Un solo año no tiene recorrido: ocupa todo el ancho y cada club es una raya horizontal a la altura de sus puntos.
  const single = first === last;
  const xOf = (year: number) => (single ? width - pad : x(year));
  const yOf = (points: number) => y(points);

  // Los puntos se ganan de golpe: la línea es una escalera, no una pendiente.
  const draw = line<number>()
    .x((_, i) => xOf(tl.years[i]))
    .y((points) => yOf(points))
    .curve(curveStepAfter);

  const paths = tl.series.map((s) => ({
    clubId: s.clubId,
    d: single ? `M${pad},${yOf(s.cumulative[0] ?? 0)}H${width - pad}` : (draw(s.cumulative) ?? ''),
    end: { x: xOf(last), y: yOf(s.cumulative[s.cumulative.length - 1] ?? 0) },
  }));

  const span = last - first;
  const stepX = span > 100 ? 25 : span > 40 ? 20 : span > 15 ? 10 : span > 6 ? 5 : 1;
  const ticksX = tl.years.filter((year) => year === first || year === last || (year % stepX === 0 && year - first > stepX / 2 && last - year > stepX / 2));
  const ticksY = y.ticks(5).filter((t) => Number.isInteger(t));

  return { paths, xOf, yOf, ticksX, ticksY };
}
