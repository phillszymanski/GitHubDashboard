import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUsersList } from './githubApi';
import type { GitHubUserListItem } from '../types/GithubTypes';
import { getErrorMessage } from '../utils/errorHandler';
import { validateNumericInput } from '../utils/dataUtils';

interface UsersTableProps {
  onSelectUser: (username: string) => void;
  selectedUsername?: string | null;
}

export default function UsersTable({ onSelectUser, selectedUsername }: UsersTableProps) {
  const [searchUsername, setSearchUsername] = useState('');
  const [since, setSince] = useState('');
  const [perPage, setPerPage] = useState('50');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [users, setUsers] = useState<GitHubUserListItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [searchMode, setSearchMode] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  const onFetch = useCallback(async () => {
    // Inline validation to avoid dependency
    const sinceError = validateNumericInput(since, 'Since ID');
    const perPageError = validateNumericInput(perPage, 'Per page');
    
    if (sinceError) {
      setValidationError(sinceError);
      return;
    }
    if (perPageError) {
      setValidationError(perPageError);
      return;
    }
    if (perPage && Number(perPage) > 100) {
      setValidationError('Per page cannot exceed 100');
      return;
    }
    setValidationError(null);
    
    setError(null);
    setLoading(true);
    setHasMore(true);
    try {
      const sinceNum = since ? Number(since) : undefined;
      const perPageNum = perPage ? Number(perPage) : undefined;
      const resp = await fetchUsersList(sinceNum, perPageNum);
      setUsers(resp.data as GitHubUserListItem[]);
      if (resp.data.length === 0) {
        setError('No users found. Try adjusting your search criteria.');
        setHasMore(false);
      } else if (resp.data.length < (perPageNum || 50)) {
        setHasMore(false);
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to fetch users. Please try again.');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [since, perPage]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || users.length === 0) return;

    setLoadingMore(true);
    setError(null);
    
    try {
      const lastUserId = users[users.length - 1].id;
      const perPageNum = perPage ? Number(perPage) : 50;
      const resp = await fetchUsersList(lastUserId, perPageNum);
      
      if (resp.data.length === 0) {
        setHasMore(false);
      } else {
        setUsers((prev) => [...prev, ...(resp.data as GitHubUserListItem[])]);
        if (resp.data.length < perPageNum) {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load more users.');
    } finally {
      setLoadingMore(false);
    }
  }, [users, perPage, hasMore, loadingMore, loading]);

  useEffect(() => {
    onFetch();
  }, [onFetch]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore, hasMore, loadingMore, loading]);

  const searchForUser = async () => {
    if (!searchUsername.trim()) {
      setValidationError('Please enter a username to search');
      return;
    }
    
    setValidationError(null);
    setSearchMode(true);
    // Navigate to the user's dashboard
    onSelectUser(searchUsername.trim());
  };

  return (
    <div className="users-table-container">
      <div className="users-search-section">
        <label htmlFor="search-username" className="users-search-label">
          🔍 Search for a specific user
        </label>
        <div className="users-search-controls">
          <input
            id="search-username"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            placeholder="Enter GitHub username"
            aria-label="Search username"
            onKeyPress={(e) => e.key === 'Enter' && searchForUser()}
            className="users-search-input"
          />
          <button 
            type="button" 
            onClick={searchForUser} 
            disabled={loading}
            className="users-search-button"
          >
            Search User
          </button>
        </div>
      </div>

      <div className="users-browse-divider">
        <span>or browse all users</span>
      </div>

      <div className="users-table-controls">
        <input
          value={since}
          onChange={(e) => setSince(e.target.value)}
          placeholder="since (user id)"
          inputMode="numeric"
          aria-label="Since user ID"
          aria-describedby="since-help"
        />
        <input
          value={perPage}
          onChange={(e) => setPerPage(e.target.value)}
          placeholder="per page"
          inputMode="numeric"
          aria-label="Users per page"
          aria-describedby="perpage-help"
        />
        <button type="button" onClick={onFetch} disabled={loading} aria-busy={loading}>
          {loading ? 'Loading…' : 'Browse'}
        </button>
      </div>
      <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
        <span id="since-help">Start from user ID (optional). </span>
        <span id="perpage-help">Max 100 users per page. Scroll down to load more users automatically.</span>
      </div>

      {validationError && <div className="error-message" role="alert">{validationError}</div>}
      {error && <div className="error-message" role="alert">{error}</div>}

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Login</th>
              <th>Type</th>
              <th>Id</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelected = selectedUsername === user.login;
              return (
                <tr
                  key={user.id}
                  onClick={() => onSelectUser(user.login)}
                  className={isSelected ? 'selected' : ''}
                  role="button"
                  tabIndex={0}
                  aria-selected={isSelected}
                >
                  <td>
                    <img 
                      src={user.avatar_url} 
                      alt={`${user.login} avatar`} 
                      width={32} 
                      height={32} 
                      className="user-avatar" 
                    />
                  </td>
                  <td>{user.login}</td>
                  <td>{user.type}</td>
                  <td>{user.id}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loadingMore && (
          <div className="users-table-loading">
            <div className="loading-spinner"></div>
            <span>Loading more users...</span>
          </div>
        )}
        {!hasMore && users.length > 0 && (
          <div className="users-table-end">
            📭 No more users to load
          </div>
        )}
        <div ref={observerTarget} style={{ height: '20px' }} />
      </div>
    </div>
  );
}
