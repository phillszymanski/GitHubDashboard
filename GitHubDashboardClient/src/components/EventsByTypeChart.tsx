import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { GitHubEvent } from '../types/GithubTypes';
import type { EventChartDataPoint, EventTypeCount } from '../types/chartTypes';
import ChartWrapper from './ChartWrapper';

interface EventsByTypeChartProps {
  events: GitHubEvent[];
}

function EventsByTypeChart({ events }: EventsByTypeChartProps) {
  const counts = events.reduce<EventTypeCount>((acc, evt) => {
    acc[evt.type] = (acc[evt.type] || 0) + 1;
    return acc;
  }, {});

  const data: EventChartDataPoint[] = Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <ChartWrapper 
      title="Events by Type" 
      isEmpty={data.length === 0}
      emptyMessage="No event data to display"
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#82ca9d" name="Events" />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

export default memo(EventsByTypeChart);
