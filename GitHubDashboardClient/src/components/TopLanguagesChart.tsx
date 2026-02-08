import { memo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { GitHubRepo } from '../types/GithubTypes';
import type { PieChartDataPoint, LanguageCount } from '../types/chartTypes';
import ChartWrapper from './ChartWrapper';

interface TopLanguagesChartProps {
  repos: GitHubRepo[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#a4de6c', '#d0ed57', '#ffc0cb'];

function TopLanguagesChart({ repos }: TopLanguagesChartProps) {
  const counts = repos.reduce<LanguageCount>((acc, repo) => {
    const lang = repo.language ?? 'Unknown';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const data: PieChartDataPoint[] = Object.entries(counts)
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return (
    <ChartWrapper 
      title="Top Languages" 
      isEmpty={data.length === 0}
      emptyMessage="No language data to display"
    >
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie dataKey="count" data={data} nameKey="language" cx="50%" cy="50%" outerRadius={110}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

export default memo(TopLanguagesChart);
