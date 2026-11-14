import { resolveTitles } from '../core/resolve';
import type { Club, Competition, Title, TitleRow } from '../core/types';
import clubs from './clubs.json';
import competitions from './competitions.json';
import titles from './titles.json';

export const CLUBS = clubs as Club[];
export const COMPETITIONS = competitions as Competition[];
export const TITLE_ROWS = titles as TitleRow[];
export const TITLES: Title[] = resolveTitles(TITLE_ROWS, COMPETITIONS);

export const YEAR_BOUNDS = {
  min: Math.min(...TITLES.map((t) => t.year)),
  max: Math.max(...TITLES.map((t) => t.year)),
};
