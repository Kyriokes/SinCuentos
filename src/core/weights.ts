import type { CancheroAnswers, ScoredCategory, Weights } from './types';

export const SCORED_ORDER: ScoredCategory[] = ['liga_corta', 'liga_anual', 'copa_nacional', 'tier_b', 'tier_a', 'mundo'];

export const DEFAULT_WEIGHTS: Weights = { liga_corta: 1, liga_anual: 2, copa_nacional: 1, tier_b: 2, tier_a: 4, mundo: 8 };

/** Puntos de una Sudamericana según la respuesta 1: media, una, dos o tres ligas anuales. */
export const Q1_VALUES = [1, 2, 4, 6] as const;
/** Multiplicador de las respuestas 2 y 3: lo mismo, el doble, el triple. */
export const MULTIPLIERS = [1, 2, 3] as const;

export function cancheroWeights(answers: CancheroAnswers): Weights {
  const tier_b = Q1_VALUES[answers[0]];
  const tier_a = tier_b * MULTIPLIERS[answers[1]];
  const mundo = tier_a * MULTIPLIERS[answers[2]];
  return { liga_corta: 1, liga_anual: 2, copa_nacional: 1, tier_b, tier_a, mundo };
}
