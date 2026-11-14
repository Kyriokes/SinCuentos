export type ScoredCategory = 'liga_corta' | 'liga_anual' | 'copa_nacional' | 'tier_b' | 'tier_a' | 'mundo';
export type VitrinaCategory = 'vitrina_nacional' | 'tier_c';
export type Category = ScoredCategory | VitrinaCategory;
export type Era = 'amateur' | 'profesional';
export type Weights = Record<ScoredCategory, number>;

export interface Club {
  id: string;
  name: string;
  shortName: string;
  colors: [string, string];
}

export interface Competition {
  id: string;
  name: string;
  organizer: string;
  category: 'liga' | Exclude<Category, 'liga_anual' | 'liga_corta'>;
}

export interface TitleRow {
  year: number;
  competitionId: string;
  clubId: string;
  era: Era;
  season?: string;
  source: string;
  note?: string;
}

export interface Title {
  year: number;
  competitionId: string;
  clubId: string;
  era: Era;
  category: Category;
}

export interface Filters {
  includeAmateur: boolean;
  from: number;
  to: number;
}

export type CancheroAnswers = [0 | 1 | 2 | 3, 0 | 1 | 2, 0 | 1 | 2];
