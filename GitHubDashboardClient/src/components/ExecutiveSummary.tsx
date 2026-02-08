import type { GitHubUser } from '../types/GithubTypes';
import type { RepoStatsWithTopLanguage } from '../utils/dataUtils';

interface ExecutiveSummaryProps {
  user: GitHubUser;
  repoStats: RepoStatsWithTopLanguage;
  eventCount: number;
}

export default function ExecutiveSummary({ user, repoStats, eventCount }: ExecutiveSummaryProps) {
  return (
    <section className="executive-summary">
      <div className="executive-summary-profile">
        <img
          src={user.avatar_url}
          alt={`${user.login} avatar`}
          width={72}
          height={72}
          className="executive-summary-avatar"
        />
        <div>
          <div className="executive-summary-name">{user.name ?? user.login}</div>
          <div className="executive-summary-login">@{user.login}</div>
          {user.bio && <div className="executive-summary-bio">{user.bio}</div>}
        </div>
      </div>

      <div>
        <div className="executive-summary-section-title">Profile</div>
        <div>Followers: {user.followers}</div>
        <div>Following: {user.following}</div>
        <div>Public repos: {user.public_repos}</div>
      </div>

      <div>
        <div className="executive-summary-section-title">Repositories</div>
        <div>Total repos: {repoStats.repoCount}</div>
        <div>Total stars: {repoStats.totalStars}</div>
        <div>Total forks: {repoStats.totalForks}</div>
        <div>Top language: {repoStats.topLanguage ?? 'N/A'}</div>
      </div>

      <div>
        <div className="executive-summary-section-title">Activity</div>
        <div>Recent events: {eventCount}</div>
      </div>
    </section>
  );
}
