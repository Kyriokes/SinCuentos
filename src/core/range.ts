import type { Filters, Title } from './types';

export interface YearRange {
  from: number;
  to: number;
}

/** Primer año con títulos del profesionalismo: sin amateurismo, los anteriores quedan vacíos. */
export function firstProfessionalYear(titles: Title[], max: number): number {
  return Math.min(max, ...titles.filter((t) => t.era === 'profesional').map((t) => t.year));
}

/** El rango que queda sin amateurismo. Si era entero amateur no se aplasta en un solo año: se abre hasta el final. */
export function professionalRange(range: YearRange, firstProfessional: number, max: number): YearRange {
  return { from: Math.max(range.from, firstProfessional), to: range.to < firstProfessional ? max : range.to };
}

/**
 * Tildar o destildar "Contar el amateurismo".
 *
 * Al destildar se guarda el rango que había (`saved`) para devolverlo tal cual al volver a tildar,
 * salvo el extremo que se haya movido mientras tanto. Sin rango guardado (un link sin amateurismo),
 * el piso profesional equivale a "desde el principio".
 */
export function toggleAmateur(
  filters: Filters,
  include: boolean,
  saved: YearRange | null,
  firstProfessional: number,
  bounds: { min: number; max: number },
): { filters: Filters; saved: YearRange | null } {
  if (!include) {
    const range = professionalRange(filters, firstProfessional, bounds.max);
    return { filters: { includeAmateur: false, ...range }, saved: { from: filters.from, to: filters.to } };
  }
  let { from, to } = filters;
  if (saved) {
    const clamped = professionalRange(saved, firstProfessional, bounds.max);
    if (from === clamped.from) from = saved.from;
    if (to === clamped.to && saved.to >= from) to = saved.to;
  } else if (from === firstProfessional) {
    from = bounds.min;
  }
  return { filters: { includeAmateur: true, from, to }, saved: null };
}
