/**
 * Chart data type definitions for consistent typing across chart components
 */

export interface BarChartDataPoint {
  name: string;
  value: number;
}

export interface RepoBarChartDataPoint {
  name: string;
  stars: number;
  forks: number;
}

export interface PieChartDataPoint {
  language: string;
  count: number;
  [key: string]: string | number;
}

export interface CommitChartDataPoint {
  author: string;
  count: number;
}

export interface EventChartDataPoint {
  type: string;
  count: number;
}

export interface LanguageCount {
  [language: string]: number;
}

export interface EventTypeCount {
  [type: string]: number;
}

export interface AuthorCommitCount {
  [author: string]: number;
}
