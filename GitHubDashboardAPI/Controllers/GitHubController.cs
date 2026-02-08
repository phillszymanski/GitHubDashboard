using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace GitHubDashboardAPI.Controllers;

/// <summary>
/// Controller for proxying GitHub API requests with caching support.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class GitHubController : ControllerBase
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<GitHubController> _logger;
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _cacheTtl;
    private readonly Services.IGroqService _groqService;

    public GitHubController(IHttpClientFactory httpFactory, IConfiguration config, ILogger<GitHubController> logger, IMemoryCache cache, Services.IGroqService groqService)
    {
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
        _cache = cache;
        _cacheTtl = TimeSpan.FromSeconds(_config.GetValue<int>("Cache:TtlSeconds", 60));
        _groqService = groqService;
    }

    /// <summary>
    /// Gets a GitHub user profile by username.
    /// </summary>
    /// <param name="username">The GitHub username.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The user profile as JSON.</returns>
    [HttpGet("users/{username}")]
    public async Task<IActionResult> GetUser(string username, CancellationToken cancellationToken = default)
    {
        var (status, content) = await SendGitHubRequestAsync($"users/{username}", cancellationToken);
        return CreateJsonContentResult(status, content);
    }

    /// <summary>
    /// Gets a list of repositories for a GitHub user.
    /// </summary>
    /// <param name="username">The GitHub username.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The repositories as JSON array.</returns>
    [HttpGet("users/{username}/repos")]
    public async Task<IActionResult> GetRepos(string username, CancellationToken cancellationToken = default)
    {
        var (status, content) = await SendGitHubRequestAsync($"users/{username}/repos", cancellationToken);
        return CreateJsonContentResult(status, content);
    }

    /// <summary>
    /// Gets recent events for a GitHub user.
    /// </summary>
    /// <param name="username">The GitHub username.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The events as JSON array.</returns>
    [HttpGet("users/{username}/events")]
    public async Task<IActionResult> GetEvents(string username, CancellationToken cancellationToken = default)
    {
        var (status, content) = await SendGitHubRequestAsync($"users/{username}/events", cancellationToken);
        return CreateJsonContentResult(status, content);
    }

    /// <summary>
    /// Gets a paginated list of GitHub users.
    /// </summary>
    /// <param name="since">The user ID to start pagination from (exclusive).</param>
    /// <param name="perPage">Number of users per page (max 100).</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The users as JSON array.</returns>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] int? since, [FromQuery(Name = "per_page")] int? perPage, CancellationToken cancellationToken = default)
    {
        var queryString = BuildQueryString(new Dictionary<string, string?>
        {
            ["since"] = since?.ToString(),
            ["per_page"] = perPage?.ToString()
        });
        
        var url = $"users{queryString}";
        var (status, content) = await SendGitHubRequestAsync(url, cancellationToken);
        return CreateJsonContentResult(status, content);
    }

    /// <summary>
    /// Gets commits for a specific repository.
    /// </summary>
    /// <param name="owner">The repository owner.</param>
    /// <param name="repo">The repository name.</param>
    /// <param name="author">Optional filter by commit author.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>The commits as JSON array.</returns>
    [HttpGet("repos/{owner}/{repo}/commits")]
    public async Task<IActionResult> GetCommitsPerRepo(string owner, string repo, [FromQuery] string? author, CancellationToken cancellationToken = default)
    {
        var queryString = BuildQueryString(new Dictionary<string, string?>
        {
            ["author"] = author
        });
        
        var url = $"repos/{owner}/{repo}/commits{queryString}";
        var (status, content) = await SendGitHubRequestAsync(url, cancellationToken);
        return CreateJsonContentResult(status, content);
    }

    /// <summary>
    /// Gets an aggregated dashboard with user profile, repositories, and events.
    /// </summary>
    /// <param name="username">The GitHub username.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A combined JSON object with user, repos, and events data.</returns>
    [HttpGet("dashboard/{username}")]
    public async Task<IActionResult> GetDashboard(string username, CancellationToken cancellationToken = default)
    {
        try
        {
            var userTask = SendGitHubRequestAsync($"users/{username}", cancellationToken);
            var reposTask = SendGitHubRequestAsync($"users/{username}/repos", cancellationToken);
            var eventsTask = SendGitHubRequestAsync($"users/{username}/events", cancellationToken);

            await Task.WhenAll(userTask, reposTask, eventsTask);

            var user = await userTask;
            var repos = await reposTask;
            var events = await eventsTask;

            // Log any non-success status codes
            if (user.status != HttpStatusCode.OK)
            {
                _logger.LogWarning("User request failed for {Username} with status {Status}", username, user.status);
            }
            if (repos.status != HttpStatusCode.OK)
            {
                _logger.LogWarning("Repos request failed for {Username} with status {Status}", username, repos.status);
            }
            if (events.status != HttpStatusCode.OK)
            {
                _logger.LogWarning("Events request failed for {Username} with status {Status}", username, events.status);
            }

            var response = new
            {
                user = new { status = (int)user.status, data = ParseJson(user.content) },
                repos = new { status = (int)repos.status, data = ParseJson(repos.content) },
                events = new { status = (int)events.status, data = ParseJson(events.content) }
            };

            return new JsonResult(response)
            {
                StatusCode = StatusCodes.Status200OK
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Dashboard aggregation failed for {Username}", username);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to aggregate dashboard data" });
        }
    }

    /// <summary>
    /// Generates an AI-powered summary of GitHub activity for a user.
    /// </summary>
    /// <param name="username">The GitHub username.</param>
    /// <param name="period">The time period for the digest (daily or weekly). Defaults to daily.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A JSON object with the AI-generated digest.</returns>
    [HttpGet("digest/{username}")]
    public async Task<IActionResult> GetDigest(string username, [FromQuery] string period = "daily", CancellationToken cancellationToken = default)
    {
        try
        {
            if (period != "daily" && period != "weekly")
            {
                return BadRequest(new { message = "Period must be 'daily' or 'weekly'" });
            }

            // Fetch events with pagination to get more data for weekly digests
            var perPage = period == "weekly" ? 100 : 30;
            var eventsUrl = $"users/{username}/events?per_page={perPage}";
            var (status, content) = await SendGitHubRequestAsync(eventsUrl, cancellationToken);

            if (status != HttpStatusCode.OK)
            {
                _logger.LogWarning("Failed to fetch events for {Username} with status {Status}", username, status);
                return StatusCode((int)status, new { message = "Failed to fetch GitHub events" });
            }

            var events = ParseJson(content);
            
            // Build a summary of the activity
            var activitySummary = BuildActivitySummary(events, username, period);

            // Generate AI summary using Groq
            var prompt = $@"Analyze this GitHub activity for user '{username}' over the past {period}:

{activitySummary}

Create a concise, insightful digest that:
1. Highlights the most significant activities and patterns
2. Identifies the repositories that received the most attention
3. Summarizes the types of work done (commits, PRs, issues, etc.)
4. Notes any interesting trends or observations
5. Keep it under 300 words and use emojis to make it engaging

Format the response as a readable summary with bullet points where appropriate.";

            var digest = await _groqService.GenerateSummaryAsync(prompt, cancellationToken);

            return Ok(new
            {
                username,
                period,
                generatedAt = DateTime.UtcNow,
                digest,
                eventCount = events.GetArrayLength()
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate digest for {Username}", username);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Failed to generate digest" });
        }
    }

    /// <summary>
    /// Builds a text summary of GitHub activity from events.
    /// </summary>
    private static string BuildActivitySummary(JsonElement events, string username, string period)
    {
        var sb = new System.Text.StringBuilder();
        var eventTypes = new Dictionary<string, int>();
        var repos = new Dictionary<string, int>();
        var commitCount = 0;
        var prCount = 0;
        var issueCount = 0;

        foreach (var evt in events.EnumerateArray())
        {
            var eventType = evt.GetProperty("type").GetString() ?? "Unknown";
            eventTypes[eventType] = eventTypes.GetValueOrDefault(eventType, 0) + 1;

            if (evt.TryGetProperty("repo", out var repo))
            {
                var repoName = repo.GetProperty("name").GetString() ?? "Unknown";
                repos[repoName] = repos.GetValueOrDefault(repoName, 0) + 1;
            }

            switch (eventType)
            {
                case "PushEvent":
                    if (evt.TryGetProperty("payload", out var payload) && 
                        payload.TryGetProperty("commits", out var commits))
                    {
                        commitCount += commits.GetArrayLength();
                    }
                    break;
                case "PullRequestEvent":
                    prCount++;
                    break;
                case "IssuesEvent":
                    issueCount++;
                    break;
            }
        }

        sb.AppendLine($"Total Events: {events.GetArrayLength()}");
        sb.AppendLine($"\nEvent Types:");
        foreach (var kvp in eventTypes.OrderByDescending(x => x.Value).Take(5))
        {
            sb.AppendLine($"  - {kvp.Key}: {kvp.Value}");
        }

        sb.AppendLine($"\nTop Repositories:");
        foreach (var kvp in repos.OrderByDescending(x => x.Value).Take(5))
        {
            sb.AppendLine($"  - {kvp.Key}: {kvp.Value} events");
        }

        sb.AppendLine($"\nActivity Breakdown:");
        sb.AppendLine($"  - Commits: {commitCount}");
        sb.AppendLine($"  - Pull Requests: {prCount}");
        sb.AppendLine($"  - Issues: {issueCount}");

        return sb.ToString();
    }

    /// <summary>
    /// Sends a request to the GitHub API with caching support.
    /// </summary>
    /// <param name="relativeUrl">The relative URL path for the GitHub API request.</param>
    /// <param name="cancellationToken">Cancellation token for the request.</param>
    /// <returns>A tuple containing the HTTP status code and response content.</returns>
    private async Task<(HttpStatusCode status, string content)> SendGitHubRequestAsync(string relativeUrl, CancellationToken cancellationToken = default)
    {
        try
        {
            var cacheKey = GetCacheKey(relativeUrl);
            if (_cache.TryGetValue(cacheKey, out CachedGitHubResponse? cached) && cached is not null)
            {
                return (cached.Status, cached.Content);
            }

            var client = CreateConfiguredHttpClient();

            using var resp = await client.GetAsync(relativeUrl, cancellationToken);
            var content = await resp.Content.ReadAsStringAsync(cancellationToken);

            var entry = new CachedGitHubResponse(resp.StatusCode, content);
            _cache.Set(cacheKey, entry, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = _cacheTtl
            });
            return (resp.StatusCode, content);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GitHub request failed for {Url}", relativeUrl);
            return (HttpStatusCode.InternalServerError, "{ \"message\": \"Internal error contacting GitHub API\" }");
        }
    }

    /// <summary>
    /// Generates a cache key for a GitHub API request.
    /// </summary>
    /// <param name="relativeUrl">The relative URL path.</param>
    /// <returns>The cache key.</returns>
    private static string GetCacheKey(string relativeUrl) => $"github:{relativeUrl}";

    /// <summary>
    /// Creates and configures an HTTP client for GitHub API requests.
    /// </summary>
    /// <returns>A configured HttpClient instance.</returns>
    private HttpClient CreateConfiguredHttpClient()
    {
        var client = _httpFactory.CreateClient();
        client.BaseAddress = new Uri("https://api.github.com/");
        client.DefaultRequestHeaders.UserAgent.Clear();
        client.DefaultRequestHeaders.UserAgent.ParseAdd("GitHubDashboardAPI");
        client.DefaultRequestHeaders.Accept.Clear();
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));

        var token = _config["GitHub:Token"];
        if (!string.IsNullOrEmpty(token))
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        return client;
    }

    /// <summary>
    /// Builds a query string from a dictionary of parameters.
    /// </summary>
    /// <param name="parameters">Dictionary of query parameters (null values are ignored).</param>
    /// <returns>A query string starting with '?' or empty string if no parameters.</returns>
    private static string BuildQueryString(Dictionary<string, string?> parameters)
    {
        var validParams = parameters
            .Where(kvp => !string.IsNullOrEmpty(kvp.Value))
            .Select(kvp => $"{kvp.Key}={WebUtility.UrlEncode(kvp.Value)}");
        
        var query = string.Join("&", validParams);
        return string.IsNullOrEmpty(query) ? string.Empty : $"?{query}";
    }

    /// <summary>
    /// Cached GitHub API response.
    /// </summary>
    /// <param name="Status">HTTP status code of the response.</param>
    /// <param name="Content">JSON content of the response.</param>
    private sealed record CachedGitHubResponse(HttpStatusCode Status, string Content);

    /// <summary>
    /// Parses JSON content into a JsonElement.
    /// </summary>
    /// <param name="content">The JSON string to parse.</param>
    /// <returns>A JsonElement representing the parsed JSON.</returns>
    private static JsonElement ParseJson(string content)
    {
        using var doc = JsonDocument.Parse(content);
        return doc.RootElement.Clone();
    }

    /// <summary>
    /// Creates an IActionResult with JSON content and status code.
    /// </summary>
    /// <param name="status">The HTTP status code.</param>
    /// <param name="content">The JSON content.</param>
    /// <returns>A ContentResult with the specified status and content.</returns>
    private static IActionResult CreateJsonContentResult(HttpStatusCode status, string content)
    {
        return new ContentResult
        {
            Content = content,
            ContentType = "application/json",
            StatusCode = (int)status
        };
    }
}
