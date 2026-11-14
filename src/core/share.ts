import type { CancheroAnswers, Filters, Weights } from './types';
import { MULTIPLIERS, Q1_VALUES, SCORED_ORDER } from './weights';

export type ShareState =
  | { mode: 'c'; answers: CancheroAnswers; filters: Filters }
  | { mode: 'n'; weights: Weights; filters: Filters };

const VERSION = '1';

/** Devuelve la query string, sin el "?" inicial. */
export function encodeShare(state: ShareState): string {
  const values = state.mode === 'c' ? `q=${state.answers.join('')}` : `w=${SCORED_ORDER.map((c) => state.weights[c]).join('.')}`;
  const { includeAmateur, from, to } = state.filters;
  return `v=${VERSION}&m=${state.mode}&${values}&a=${includeAmateur ? 1 : 0}&d=${from}-${to}`;
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
  const clamp = (y: number) => Math.min(bounds.max, Math.max(bounds.min, y));
  return { includeAmateur: a === '1', from: clamp(rawFrom), to: clamp(rawTo) };
}

/** Devuelve null ante cualquier link incompleto o inválido. */
export function decodeShare(search: string, bounds: { min: number; max: number }): ShareState | null {
  const params = new URLSearchParams(search);
  if (params.get('v') !== VERSION) return null;
  const filters = decodeFilters(params, bounds);
  if (!filters) return null;

  const mode = params.get('m');
  if (mode === 'c') {
    const answers = decodeAnswers(params.get('q'));
    return answers ? { mode, answers, filters } : null;
  }
  if (mode === 'n') {
    const weights = decodeWeights(params.get('w'));
    return weights ? { mode, weights, filters } : null;
  }
  return null;
}
