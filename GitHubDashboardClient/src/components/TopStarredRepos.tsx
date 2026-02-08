import { memo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TopStarredReposProps } from "../types/GithubTypes";
import type { RepoBarChartDataPoint } from '../types/chartTypes';
import ChartWrapper from "./ChartWrapper";

function TopStarredRepos({ repos }: TopStarredReposProps) {
    const data: RepoBarChartDataPoint[] = repos
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10)
        .map(repo => ({
            name: repo.name,
            stars: repo.stargazers_count,
            forks: repo.forks_count
        }));

    return (
        <ChartWrapper 
            title="Top Starred Repositories" 
            isEmpty={data.length === 0}
            emptyMessage="No repository data to display"
        >
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="stars" fill="#8884d8" name="Stars" />
                    <Bar dataKey="forks" fill="#82ca9d" name="Forks" />
                </BarChart>
            </ResponsiveContainer>
        </ChartWrapper>
    );
}

export default memo(TopStarredRepos);