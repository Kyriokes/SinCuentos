import type { Competition, Title, TitleRow } from './types';

const ligaKey = (row: TitleRow) => `${row.era}|${row.season ?? String(row.year)}`;

/**
 * Convierte filas crudas en títulos con categoría.
 * Regla de liga: si la temporada (dentro de una misma era) tuvo un solo título de liga,
 * es anual; si tuvo más de uno, cada uno es corto.
 */
export function resolveTitles(rows: TitleRow[], competitions: Competition[]): Title[] {
  const byId = new Map(competitions.map((c) => [c.id, c]));
  const categoryOf = (row: TitleRow) => {
    const competition = byId.get(row.competitionId);
    if (!competition) throw new Error(`Competencia desconocida: ${row.competitionId}`);
    return competition.category;
  };

  const ligasPerSeason = new Map<string, number>();
  for (const row of rows) {
    if (categoryOf(row) !== 'liga') continue;
    ligasPerSeason.set(ligaKey(row), (ligasPerSeason.get(ligaKey(row)) ?? 0) + 1);
  }

  return rows.map((row) => {
    const base = categoryOf(row);
    const category = base === 'liga' ? (ligasPerSeason.get(ligaKey(row)) === 1 ? 'liga_anual' : 'liga_corta') : base;
    return { year: row.year, competitionId: row.competitionId, clubId: row.clubId, era: row.era, category, ...(row.edition ? { edition: row.edition } : {}) };
  });
}
