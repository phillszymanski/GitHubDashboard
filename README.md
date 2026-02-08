# GitHub Dashboard

A full-stack web application for analyzing and visualizing GitHub user activity and repository statistics.

## Overview

This project provides an intuitive dashboard interface for exploring GitHub data, featuring real-time metrics, interactive charts, and automated activity summaries. Built with a .NET backend API and React frontend.

## Features

- **User Analytics** - View comprehensive statistics for any GitHub user including followers, repositories, and activity metrics
- **Repository Insights** - Analyze repository data with visualizations for stars, forks, languages, and more
- **Interactive Charts** - Dynamic charts showing events by type, commits by author, top languages, and user statistics
- **Activity Digests** - Automated daily and weekly summaries of GitHub activity with intelligent insights
- **User Search** - Browse and search through GitHub users with pagination
- **Real-time Data** - Direct integration with GitHub API with smart caching for performance
- **Docker Support** - Containerized deployment for both API and client applications

## Architecture

- **Backend**: ASP.NET Core 9.0 Web API with GitHub API integration
- **Frontend**: React 18 with TypeScript, Vite, and Recharts
- **Deployment**: Docker Compose setup with nginx for frontend serving
- **Caching**: In-memory caching to optimize API calls

## Getting Started

### Prerequisites
- .NET 9.0 SDK
- Node.js 18+
- Docker & Docker Compose (optional)

### Running Locally

**Backend API:**
```bash
cd GitHubDashboardAPI
dotnet restore
dotnet user-secrets set "GitHub:Token" "your_github_token"
dotnet user-secrets set "Groq:ApiKey" "your_groq_api_key"
dotnet run
```

**Frontend Client:**
```bash
cd GitHubDashboardClient
npm install
npm run dev
```

### Using Docker

```bash
docker-compose up --build
```

Access the application at `http://localhost:5173`

## Configuration

Configure the backend API through `appsettings.json` or user secrets:
- `GitHub:Token` - Personal access token for GitHub API
- `Groq:ApiKey` - API key for activity digest generation
- `Cache:TtlSeconds` - Cache duration in seconds
- `Cors:AllowedOrigins` - Allowed CORS origins

## License

MIT
