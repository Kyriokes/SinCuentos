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

export function layoutChart(tl: Timeline, size: { width: number; height: number; pad: number }): ChartLayout {
  const { width, height, pad } = size;
  const first = tl.years[0];
  const last = tl.years[tl.years.length - 1];
  const max = Math.max(1, ...tl.series.map((s) => s.cumulative[s.cumulative.length - 1] ?? 0));

  const x = scaleLinear().domain([first, last]).range([pad, width - pad]);
  const y = scaleLinear().domain([0, max]).range([height - pad, pad]);
  const xOf = (year: number) => (first === last ? pad : x(year));
  const yOf = (points: number) => y(points);

  // Los puntos se ganan de golpe: la línea es una escalera, no una pendiente.
  const draw = line<number>()
    .x((_, i) => xOf(tl.years[i]))
    .y((points) => yOf(points))
    .curve(curveStepAfter);

  const paths = tl.series.map((s) => ({
    clubId: s.clubId,
    d: draw(s.cumulative) ?? '',
    end: { x: xOf(last), y: yOf(s.cumulative[s.cumulative.length - 1] ?? 0) },
  }));

  const span = last - first;
  const stepX = span > 100 ? 25 : span > 40 ? 20 : span > 15 ? 10 : span > 6 ? 5 : 1;
  const ticksX = tl.years.filter((year) => year === first || year === last || (year % stepX === 0 && year - first > stepX / 2 && last - year > stepX / 2));
  const ticksY = y.ticks(5).filter((t) => Number.isInteger(t));

  return { paths, xOf, yOf, ticksX, ticksY };
}
