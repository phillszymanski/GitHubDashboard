import { useEffect, useRef, useState } from 'react';
import { fetchDashboard } from './githubApi';
import { EventsByTypeChart, ExecutiveSummary, TopLanguagesChart, TopStarredRepos, UserStatsChart, DailyDigest } from './index';
import type { GitHubDashboard } from '../types/github';
import LoadingSkeleton from './LoadingSkeleton';
import { getErrorMessage } from '../utils/errorHandler';
import { calculateRepoStats } from '../utils/dataUtils';

interface DashboardAggregateProps {
  requestedUsername?: string | null;
  onBack?: () => void;
}

export default function DashboardAggregate({ requestedUsername, onBack }: DashboardAggregateProps) {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GitHubDashboard | null>(null);
  const lastRequested = useRef<string | null>(null);

  const userData = data?.user?.status === 200 ? data.user.data : null;
  const repoData = data?.repos?.status === 200 ? data.repos.data : null;
  const eventData = data?.events?.status === 200 ? data.events.data : null;

  const repoStats = repoData ? calculateRepoStats(repoData) : null;

  async function fetchFor(name: string) {
    setError(null);
    setData(null);
    if (!name.trim()) {
      setError('Please enter a GitHub username');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetchDashboard(name.trim());
      setData(resp.data);
    } catch (err) {
      setError(getErrorMessage(err) || `Failed to fetch dashboard for "${name}". Please verify the username and try again.`);
    } finally {
      setLoading(false);
    }
  }

  async function onFetch() {
    await fetchFor(username);
  }

  useEffect(() => {
    if (requestedUsername && requestedUsername !== lastRequested.current) {
      lastRequested.current = requestedUsername;
      setUsername(requestedUsername);
      fetchFor(requestedUsername);
    }
  }, [requestedUsername]);

  return (
    <div role="main" aria-label="GitHub Dashboard">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Go back to users list"
          className="back-button"
        >
          ← Back to Users List
        </button>
      )}
      <h2>Dashboard Aggregate</h2>

      {loading && (
        <div role="status" aria-live="polite">
          <LoadingSkeleton count={5} height="100px" />
        </div>
      )}
      
      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          className="error-message"
        >
          {error}
        </div>
      )}

      {data && (
        <div>
          {userData && repoStats && (
            <ExecutiveSummary
              user={userData}
              repoStats={repoStats}
              eventCount={eventData?.length ?? 0}
            />
          )}
          
          {userData && (
            <DailyDigest username={userData.login} />
          )}
          
          <h3 className="section-title">Analytics Overview</h3>
          <div className="chart-grid">
            {userData ? (
              <div className="card">
                <UserStatsChart user={userData} />
              </div>
            ) : (
              <div className="card">Unable to load user data.</div>
            )}

            {repoData ? (
              <div className="card">
                <TopStarredRepos repos={repoData} />
              </div>
            ) : (
              <div className="card">Unable to load repo data.</div>
            )}

            {repoData ? (
              <div className="card">
                <TopLanguagesChart repos={repoData} />
              </div>
            ) : (
              <div className="card">Unable to load language data.</div>
            )}

            {eventData ? (
              <div className="card">
                <EventsByTypeChart events={eventData} />
              </div>
            ) : (
              <div className="card">Unable to load event data.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
