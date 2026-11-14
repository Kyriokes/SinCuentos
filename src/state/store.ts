import { create } from 'zustand';
import { decodeShare } from '../core/share';
import type { CancheroAnswers, Filters, ScoredCategory, Weights } from '../core/types';
import { cancheroWeights, DEFAULT_WEIGHTS } from '../core/weights';
import { YEAR_BOUNDS } from '../data';

export type Step = 'inicio' | 'canchero' | 'nerd' | 'calculo' | 'carrera' | 'resultado';

export interface AppState {
  step: Step;
  mode: 'c' | 'n';
  answers: (number | null)[];
  weights: Weights;
  filters: Filters;
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
});

const clampYear = (y: number) => Math.min(YEAR_BOUNDS.max, Math.max(YEAR_BOUNDS.min, Math.trunc(y)));

export const useStore = create<AppState>((set) => ({
  ...initial(),

  // El modo nerd conserva los pesos actuales: llega con lo que eligió el canchero.
  start: (mode) => set(mode === 'c' ? { mode, step: 'canchero', answers: [null, null, null] } : { mode, step: 'nerd' }),

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

  go: (step) => set({ step }),

  reset: () => set(initial()),

  loadFromUrl: (search) => {
    const shared = decodeShare(search, YEAR_BOUNDS);
    if (!shared) return set(initial());
    if (shared.mode === 'c') {
      return set({ step: 'carrera', mode: 'c', answers: [...shared.answers], weights: cancheroWeights(shared.answers), filters: shared.filters });
    }
    set({ step: 'carrera', mode: 'n', answers: [null, null, null], weights: shared.weights, filters: shared.filters });
  },
}));
