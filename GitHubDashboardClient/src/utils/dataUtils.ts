import type { GitHubRepo } from '../types/GithubTypes';

export interface RepoStats {
  repoCount: number;
  totalStars: number;
  totalForks: number;
  languageCounts: Record<string, number>;
}

export interface RepoStatsWithTopLanguage extends Omit<RepoStats, 'languageCounts'> {
  topLanguage: string | null;
}

/**
 * Calculates statistics from an array of GitHub repositories
 * @param repos - Array of GitHub repositories
 * @returns Repository statistics including counts and top language
 */
export function calculateRepoStats(repos: GitHubRepo[]): RepoStatsWithTopLanguage {
  const stats = repos.reduce<RepoStats>(
    (acc, repo) => {
      acc.repoCount += 1;
      acc.totalStars += repo.stargazers_count;
      acc.totalForks += repo.forks_count;
      if (repo.language) {
        acc.languageCounts[repo.language] = (acc.languageCounts[repo.language] || 0) + 1;
      }
      return acc;
    },
    { repoCount: 0, totalStars: 0, totalForks: 0, languageCounts: {} }
  );

  const topLanguage = Object.entries(stats.languageCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    repoCount: stats.repoCount,
    totalStars: stats.totalStars,
    totalForks: stats.totalForks,
    topLanguage,
  };
}

/**
 * Validates if a string is a valid positive integer
 * @param value - String to validate
 * @returns true if valid positive integer
 */
export function isValidPositiveInteger(value: string): boolean {
  if (!value.trim()) return true; // Empty is valid (optional field)
  const num = Number(value);
  return !isNaN(num) && Number.isInteger(num) && num > 0;
}

/**
 * Validates a numeric input and returns an error message if invalid
 * @param value - String to validate
 * @param fieldName - Name of the field for error message
 * @returns Error message or null if valid
 */
export function validateNumericInput(value: string, fieldName: string): string | null {
  if (!value.trim()) return null;
  if (!isValidPositiveInteger(value)) {
    return `${fieldName} must be a positive integer`;
  }
  return null;
}
