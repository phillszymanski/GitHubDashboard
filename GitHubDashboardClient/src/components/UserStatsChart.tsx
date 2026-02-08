import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GitHubUser } from '../types/GithubTypes';
import type { BarChartDataPoint } from '../types/chartTypes';
import ChartWrapper from './ChartWrapper';

interface UserStatsChartProps {
  user: GitHubUser;
}

function UserStatsChart({ user }: UserStatsChartProps) {
  const data: BarChartDataPoint[] = [
    { name: 'Followers', value: user.followers },
    { name: 'Following', value: user.following },
    { name: 'Public Repos', value: user.public_repos },
    { name: 'Public Gists', value: user.public_gists },
  ];

  return (
    <ChartWrapper title="User Stats">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#8884d8" name="Count" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

export default memo(UserStatsChart);
