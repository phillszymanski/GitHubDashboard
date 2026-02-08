import { useCallback, useEffect, useState } from 'react';
import { fetchUsersList } from './githubApi';
import type { GitHubUserListItem } from '../types/GithubTypes';
import { getErrorMessage } from '../utils/errorHandler';
import { validateNumericInput } from '../utils/dataUtils';

interface UsersTableProps {
  onSelectUser: (username: string) => void;
  selectedUsername?: string | null;
}

export default function UsersTable({ onSelectUser, selectedUsername }: UsersTableProps) {
  const [since, setSince] = useState('');
  const [perPage, setPerPage] = useState('50');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [users, setUsers] = useState<GitHubUserListItem[]>([]);

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
    try {
      const sinceNum = since ? Number(since) : undefined;
      const perPageNum = perPage ? Number(perPage) : undefined;
      const resp = await fetchUsersList(sinceNum, perPageNum);
      setUsers(resp.data as GitHubUserListItem[]);
      if (resp.data.length === 0) {
        setError('No users found. Try adjusting your search criteria.');
      }
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [since, perPage]);

  useEffect(() => {
    onFetch();
  }, [onFetch]);

  return (
    <div className="users-table-container">
      <h2>All Users</h2>
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
          {loading ? 'Loading…' : 'Fetch'}
        </button>
      </div>
      <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
        <span id="since-help">Start from user ID (optional). </span>
        <span id="perpage-help">Max 100 users per page.</span>
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
      </div>
    </div>
  );
}
