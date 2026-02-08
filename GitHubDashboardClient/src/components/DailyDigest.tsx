import { useState, useEffect } from 'react';
import { fetchDigest } from './githubApi';
import type { GitHubDigest } from '../types/github';
import { logger } from '../utils/logger';

interface DailyDigestProps {
  username: string;
}

export default function DailyDigest({ username }: DailyDigestProps) {
  const [digest, setDigest] = useState<GitHubDigest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'daily' | 'weekly'>('daily');

  const loadDigest = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchDigest(username, period);
      setDigest(response.data);
    } catch (err) {
      logger.error('Failed to load digest', err);
      setError('Failed to generate digest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      loadDigest();
    }
  }, [username, period]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <section className="daily-digest">
      <div className="daily-digest-header">
        <h2 className="daily-digest-title">🤖 AI Activity Digest</h2>
        <div className="daily-digest-controls">
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value as 'daily' | 'weekly')}
            className="daily-digest-period-select"
            disabled={loading}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
          <button 
            onClick={loadDigest} 
            disabled={loading}
            className="daily-digest-refresh-btn"
          >
            {loading ? '⏳ Generating...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="daily-digest-error">
          ❌ {error}
        </div>
      )}

      {loading && !digest && (
        <div className="daily-digest-loading">
          <div className="loading-spinner"></div>
          <p>Generating AI-powered digest...</p>
        </div>
      )}

      {digest && !loading && (
        <div className="daily-digest-content">
          <div className="daily-digest-meta">
            <span>📊 Based on {digest.eventCount} events</span>
            <span>🕐 Generated: {formatDate(digest.generatedAt)}</span>
          </div>
          <div className="daily-digest-text">
            {digest.digest.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
