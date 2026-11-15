import type { CancheroAnswers, Filters, Weights } from './types';
import { MULTIPLIERS, Q1_VALUES, SCORED_ORDER } from './weights';

/** `selected` son los códigos cortos de los clubes elegidos para comparar; sin eso, van los primeros del ranking. */
export type ShareState =
  | { mode: 'c'; answers: CancheroAnswers; filters: Filters; selected?: string[] }
  | { mode: 'n'; weights: Weights; filters: Filters; selected?: string[] };

/** Más líneas que estas no se distinguen entre sí. */
export const MAX_SELECTED = 8;

const VERSION = '1';

/** Devuelve la query string, sin el "?" inicial. */
export function encodeShare(state: ShareState): string {
  const values = state.mode === 'c' ? `q=${state.answers.join('')}` : `w=${SCORED_ORDER.map((c) => state.weights[c]).join('.')}`;
  const { includeAmateur, from, to } = state.filters;
  // Parámetro opcional: los links anteriores a la comparación siguen valiendo sin cambiar de versión.
  const chosen = state.selected?.length ? `&e=${state.selected.slice(0, MAX_SELECTED).join('.')}` : '';
  return `v=${VERSION}&m=${state.mode}&${values}&a=${includeAmateur ? 1 : 0}&d=${from}-${to}${chosen}`;
}

function decodeAnswers(q: string | null): CancheroAnswers | null {
  if (!q || !/^\d{3}$/.test(q)) return null;
  const [a, b, c] = [...q].map(Number);
  if (a >= Q1_VALUES.length || b >= MULTIPLIERS.length || c >= MULTIPLIERS.length) return null;
  return [a, b, c] as CancheroAnswers;
}

function decodeWeights(w: string | null): Weights | null {
  if (!w) return null;
  const parts = w.split('.');
  if (parts.length !== SCORED_ORDER.length || !parts.every((p) => /^\d{1,2}$/.test(p))) return null;
  return Object.fromEntries(SCORED_ORDER.map((c, i) => [c, Number(parts[i])])) as Weights;
}

function decodeFilters(params: URLSearchParams, bounds: { min: number; max: number }): Filters | null {
  const a = params.get('a');
  if (a !== '0' && a !== '1') return null;
  const range = /^(\d{4})-(\d{4})$/.exec(params.get('d') ?? '');
  if (!range) return null;
  const rawFrom = Number(range[1]);
  const rawTo = Number(range[2]);
  if (rawFrom > rawTo) return null;
  // Un rango entero fuera de los datos no es un resultado: es un link roto.
  if (rawTo < bounds.min || rawFrom > bounds.max) return null;
  const clamp = (y: number) => Math.min(bounds.max, Math.max(bounds.min, y));
  return { includeAmateur: a === '1', from: clamp(rawFrom), to: clamp(rawTo) };
}

/** Una selección mal escrita no rompe el link: se ignora lo que no sirve. */
function decodeSelected(e: string | null): string[] | undefined {
  if (!e) return undefined;
  const codes = [...new Set(e.split('.').filter((code) => /^[A-Z0-9]{2,5}$/.test(code)))].slice(0, MAX_SELECTED);
  return codes.length ? codes : undefined;
}

/** Devuelve null ante cualquier link incompleto o inválido. */
export function decodeShare(search: string, bounds: { min: number; max: number }): ShareState | null {
  const params = new URLSearchParams(search);
  if (params.get('v') !== VERSION) return null;
  const filters = decodeFilters(params, bounds);
  if (!filters) return null;

  const selected = decodeSelected(params.get('e'));

  const mode = params.get('m');
  if (mode === 'c') {
    const answers = decodeAnswers(params.get('q'));
    return answers ? { mode, answers, filters, ...(selected && { selected }) } : null;
  }
  if (mode === 'n') {
    const weights = decodeWeights(params.get('w'));
    return weights ? { mode, weights, filters, ...(selected && { selected }) } : null;
  }
  return null;
}
