import type { Club, Competition, TitleRow } from './types';

export const FIXTURE_CLUBS: Club[] = ['zeta', 'beta', 'alfa'].map((id) => ({
  id,
  name: id[0].toUpperCase() + id.slice(1),
  shortName: id.slice(0, 3).toUpperCase(),
  colors: ['#111111', '#eeeeee'],
}));

export const FIXTURE_COMPETITIONS: Competition[] = [
  { id: 'liga', name: 'Primera División', organizer: 'AFA', category: 'liga' },
  { id: 'copa_argentina', name: 'Copa Argentina', organizer: 'AFA', category: 'copa_nacional' },
  { id: 'sudamericana', name: 'Copa Sudamericana', organizer: 'CONMEBOL', category: 'tier_b' },
  { id: 'libertadores', name: 'Copa Libertadores', organizer: 'CONMEBOL', category: 'tier_a' },
  { id: 'intercontinental', name: 'Copa Intercontinental', organizer: 'FIFA', category: 'mundo' },
  { id: 'recopa', name: 'Recopa Sudamericana', organizer: 'CONMEBOL', category: 'tier_c' },
  { id: 'supercopa_arg', name: 'Supercopa Argentina', organizer: 'AFA', category: 'vitrina_nacional' },
];

const row = (year: number, competitionId: string, clubId: string, era: TitleRow['era'] = 'profesional', season?: string): TitleRow => ({
  year,
  competitionId,
  clubId,
  era,
  source: 'test',
  ...(season ? { season } : {}),
});

export const FIXTURE_ROWS: TitleRow[] = [
  row(1920, 'liga', 'zeta', 'amateur'),
  row(1950, 'liga', 'zeta'),
  row(1970, 'liga', 'zeta', 'profesional', '1970'),
  row(1970, 'liga', 'beta', 'profesional', '1970'),
  row(1991, 'liga', 'beta', 'profesional', '1991/92'),
  row(1992, 'liga', 'zeta', 'profesional', '1991/92'),
  row(2000, 'libertadores', 'beta'),
  row(2000, 'intercontinental', 'beta'),
  row(2005, 'sudamericana', 'zeta'),
  row(2010, 'recopa', 'zeta'),
  row(2012, 'copa_argentina', 'alfa'),
  row(2015, 'supercopa_arg', 'alfa'),
];
