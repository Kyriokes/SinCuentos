import type { Category, Club, Filters, Title, Weights } from './types';

export interface ClubResult {
  clubId: string;
  rank: number;
  points: number;
  vitrina: number;
  counts: Record<Category, number>;
}

export interface Timeline {
  years: number[];
  series: { clubId: string; cumulative: number[] }[];
}

const emptyCounts = (): Record<Category, number> => ({
  liga_corta: 0,
  liga_anual: 0,
  copa_nacional: 0,
  tier_b: 0,
  tier_a: 0,
  mundo: 0,
  vitrina_nacional: 0,
  tier_c: 0,
});

/** Si un título entra en el rango de años y en la era que se están contando. */
export const inRange = (title: Title, filters: Filters) =>
  title.year >= filters.from && title.year <= filters.to && (filters.includeAmateur || title.era === 'profesional');

/** Copas secundarias: van a la vitrina, no suman puntos y solo desempatan. */
export const isVitrina = (category: Category) => category === 'vitrina_nacional' || category === 'tier_c';

/** Puntos que suma un título; la vitrina no suma. */
export function pointsOf(category: Category, weights: Weights): number {
  return isVitrina(category) ? 0 : weights[category];
}

export function computeRanking(titles: Title[], weights: Weights, filters: Filters, clubs: Club[]): ClubResult[] {
  const names = new Map(clubs.map((c) => [c.id, c.name]));
  const byClub = new Map<string, Omit<ClubResult, 'rank'>>();

  for (const title of titles) {
    if (!inRange(title, filters)) continue;
    let entry = byClub.get(title.clubId);
    if (!entry) {
      entry = { clubId: title.clubId, points: 0, vitrina: 0, counts: emptyCounts() };
      byClub.set(title.clubId, entry);
    }
    entry.counts[title.category] += 1;
    entry.points += pointsOf(title.category, weights);
    if (isVitrina(title.category)) entry.vitrina += 1;
  }

  const nameOf = (id: string) => names.get(id) ?? id;
  return [...byClub.values()]
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points || b.vitrina - a.vitrina || nameOf(a.clubId).localeCompare(nameOf(b.clubId), 'es'))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

export function computeTimeline(titles: Title[], weights: Weights, filters: Filters, clubs: Club[]): Timeline {
  const years: number[] = [];
  for (let y = filters.from; y <= filters.to; y++) years.push(y);

  const ranking = computeRanking(titles, weights, filters, clubs);
  const gained = new Map(ranking.map((r) => [r.clubId, new Array<number>(years.length).fill(0)]));

  for (const title of titles) {
    if (!inRange(title, filters)) continue;
    const perYear = gained.get(title.clubId);
    if (perYear) perYear[title.year - filters.from] += pointsOf(title.category, weights);
  }

  const series = ranking.map((r) => {
    let total = 0;
    return { clubId: r.clubId, cumulative: gained.get(r.clubId)!.map((g) => (total += g)) };
  });
  return { years, series };
}
