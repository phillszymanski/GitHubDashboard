import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GitHubCommit } from '../types/GithubTypes';
import type { CommitChartDataPoint, AuthorCommitCount } from '../types/chartTypes';
import ChartWrapper from './ChartWrapper';

interface CommitsByAuthorChartProps {
  commits: GitHubCommit[];
}

function CommitsByAuthorChart({ commits }: CommitsByAuthorChartProps) {
  const counts = commits.reduce<AuthorCommitCount>((acc, commit) => {
    const name = commit.commit?.author?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const data: CommitChartDataPoint[] = Object.entries(counts)
    .map(([author, count]) => ({ author, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <ChartWrapper 
      title="Commits by Author" 
      isEmpty={data.length === 0}
      emptyMessage="No commit data to display"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="author" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#ffc658" name="Commits" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

export default memo(CommitsByAuthorChart);
