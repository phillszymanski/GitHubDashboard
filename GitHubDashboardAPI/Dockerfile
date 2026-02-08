FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 5010

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["GitHubDashboardAPI.csproj", "./"]
RUN dotnet restore "GitHubDashboardAPI.csproj"
COPY . .
RUN dotnet build "GitHubDashboardAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "GitHubDashboardAPI.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Environment variables for configuration
ENV ASPNETCORE_URLS=http://+:5010
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "GitHubDashboardAPI.dll"]
