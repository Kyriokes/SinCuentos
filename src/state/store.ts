import { create } from 'zustand';
import { decodeShare, MAX_SELECTED } from '../core/share';
import type { CancheroAnswers, Filters, ScoredCategory, Weights } from '../core/types';
import { cancheroWeights, DEFAULT_WEIGHTS } from '../core/weights';
import { CLUBS, YEAR_BOUNDS } from '../data';

export type Step = 'inicio' | 'canchero' | 'nerd' | 'calculo' | 'carrera' | 'resultado';

export interface AppState {
  step: Step;
  mode: 'c' | 'n';
  answers: (number | null)[];
  weights: Weights;
  filters: Filters;
  /** Clubes elegidos para comparar en el gráfico; null = los primeros del ranking. */
  selected: string[] | null;
  /** El resultado vino de un link: son las reglas de otra persona. */
  fromLink: boolean;
  /** Se abrió un link de resultado que no se pudo leer (cortado o modificado). */
  linkError: boolean;
  setSelected(ids: string[] | null): void;
  start(mode: 'c' | 'n'): void;
  answer(index: 0 | 1 | 2, value: number): void;
  setWeight(cat: ScoredCategory, value: number): void;
  setFilters(patch: Partial<Filters>): void;
  go(step: Step): void;
  reset(): void;
  loadFromUrl(search: string): void;
}

const initial = () => ({
  step: 'inicio' as Step,
  mode: 'c' as const,
  answers: [null, null, null] as (number | null)[],
  weights: { ...DEFAULT_WEIGHTS },
  filters: { includeAmateur: true, from: YEAR_BOUNDS.min, to: YEAR_BOUNDS.max },
  selected: null as string[] | null,
  fromLink: false,
  linkError: false,
});

const cleanSelected = (ids: string[] | null) => {
  const unique = [...new Set(ids ?? [])].slice(0, MAX_SELECTED);
  return unique.length ? unique : null;
};

/** Los links llevan el código corto de cada club; los que no existen se descartan. */
const idsFromCodes = (codes: string[] | undefined) => {
  const byCode = new Map(CLUBS.map((c) => [c.shortName, c.id]));
  return cleanSelected((codes ?? []).flatMap((code) => byCode.get(code) ?? []));
};

const clampYear = (y: number) => Math.min(YEAR_BOUNDS.max, Math.max(YEAR_BOUNDS.min, Math.trunc(y)));

export const useStore = create<AppState>((set) => ({
  ...initial(),

  // El modo nerd conserva los pesos actuales: llega con lo que eligió el canchero.
  start: (mode) =>
    set({ ...(mode === 'c' ? { mode, step: 'canchero', answers: [null, null, null] } : { mode, step: 'nerd' }), fromLink: false, linkError: false }),

  answer: (index, value) =>
    set((state) => {
      const answers = [...state.answers];
      answers[index] = value;
      const complete = answers.every((a) => a !== null);
      return complete ? { answers, weights: cancheroWeights(answers as CancheroAnswers) } : { answers };
    }),

  setWeight: (cat, value) =>
    set((state) => {
      const clean = Number.isFinite(value) ? Math.min(99, Math.max(0, Math.trunc(value))) : 0;
      return { weights: { ...state.weights, [cat]: clean } };
    }),

  setFilters: (patch) =>
    set((state) => {
      const next = { ...state.filters, ...patch };
      next.from = clampYear(next.from);
      next.to = clampYear(next.to);
      if (next.from > next.to) {
        // Manda el extremo que se acaba de mover.
        if (patch.from !== undefined) next.to = next.from;
        else next.from = next.to;
      }
      return { filters: next };
    }),

  setSelected: (ids) => set({ selected: cleanSelected(ids) }),

  go: (step) => set({ step }),

  reset: () => set(initial()),

  loadFromUrl: (search) => {
    const shared = decodeShare(search, YEAR_BOUNDS);
    if (!shared) return set({ ...initial(), linkError: new URLSearchParams(search).has('v') });
    const selected = idsFromCodes(shared.selected);
    if (shared.mode === 'c') {
      return set({ step: 'carrera', mode: 'c', answers: [...shared.answers], weights: cancheroWeights(shared.answers), filters: shared.filters, selected, fromLink: true, linkError: false });
    }
    set({ step: 'carrera', mode: 'n', answers: [null, null, null], weights: shared.weights, filters: shared.filters, selected, fromLink: true, linkError: false });
  },
}));
