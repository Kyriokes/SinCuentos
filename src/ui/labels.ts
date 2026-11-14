import type { Category, ScoredCategory } from '../core/types';

export const CATEGORY_LABEL: Record<Category, string> = {
  liga_corta: 'Torneo corto',
  liga_anual: 'Liga anual',
  copa_nacional: 'Copa nacional',
  tier_b: 'Sudamericana y similares',
  tier_a: 'Libertadores',
  mundo: 'Campeón del mundo',
  vitrina_nacional: 'Vitrina nacional',
  tier_c: 'Vitrina internacional',
};

/** Qué entra en las dos categorías de liga, que no salen del listado de competencias. */
export const LIGA_INCLUDES: Record<'liga_corta' | 'liga_anual', string> = {
  liga_corta: 'Título de Primera en un año con más de un campeón: Metropolitano, Nacional, Apertura, Clausura y similares.',
  liga_anual: 'Título de Primera cuando fue el único campeonato del año o la temporada.',
};

export interface Question {
  title: string;
  help: string;
  options: { big: string; label: string }[];
}

const MULTIPLES = [
  { big: '×1', label: 'Lo mismo' },
  { big: '×2', label: 'El doble' },
  { big: '×3', label: 'El triple' },
];

export const QUESTIONS: Question[] = [
  {
    title: '¿Cuántas ligas vale una Sudamericana?',
    help: 'Un Clausura vale 1 punto. La liga anual vale 2.',
    options: [
      { big: '½', label: 'Media liga' },
      { big: '1', label: 'Una liga' },
      { big: '2', label: 'Dos ligas' },
      { big: '3', label: 'Tres ligas' },
    ],
  },
  {
    title: '¿Cuántas Sudamericanas vale una Libertadores?',
    help: 'Acá no se baja: como mínimo vale lo mismo.',
    options: MULTIPLES,
  },
  {
    title: '¿Cuántas Libertadores vale ser campeón del mundo?',
    help: 'Intercontinental o Mundial de Clubes. Nada vale más que esto.',
    options: MULTIPLES,
  },
];

export const SCORED_HELP: Record<ScoredCategory, string> = {
  liga_corta: LIGA_INCLUDES.liga_corta,
  liga_anual: LIGA_INCLUDES.liga_anual,
  copa_nacional: '',
  tier_b: '',
  tier_a: '',
  mundo: '',
};
