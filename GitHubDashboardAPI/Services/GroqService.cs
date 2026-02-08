using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GitHubDashboardAPI.Models;

namespace GitHubDashboardAPI.Services;

public interface IGroqService
{
    Task<string> GenerateSummaryAsync(string prompt, CancellationToken cancellationToken = default);
}

public class GroqService : IGroqService
{
    private readonly IHttpClientFactory _httpFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<GroqService> _logger;

    public GroqService(IHttpClientFactory httpFactory, IConfiguration config, ILogger<GroqService> logger)
    {
        _httpFactory = httpFactory;
        _config = config;
        _logger = logger;
    }

    public async Task<string> GenerateSummaryAsync(string prompt, CancellationToken cancellationToken = default)
    {
        try
        {
            var apiKey = _config["Groq:ApiKey"];
            var apiUrl = _config["Groq:ApiUrl"] ?? "https://api.groq.com/openai/v1/chat/completions";
            var model = _config["Groq:Model"] ?? "llama-3.3-70b-versatile";

            if (string.IsNullOrEmpty(apiKey))
            {
                throw new InvalidOperationException("Groq API key is not configured");
            }

            var client = _httpFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var request = new GroqChatRequest
            {
                Model = model,
                Messages = new List<GroqMessage>
                {
                    new GroqMessage
                    {
                        Role = "system",
                        Content = "You are a helpful assistant that creates concise, insightful summaries of GitHub activity. Focus on patterns, trends, and key highlights. Use emojis to make summaries engaging."
                    },
                    new GroqMessage
                    {
                        Role = "user",
                        Content = prompt
                    }
                },
                Temperature = 0.7,
                MaxTokens = 1024
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(apiUrl, content, cancellationToken);
            response.EnsureSuccessStatusCode();

            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
            var chatResponse = JsonSerializer.Deserialize<GroqChatResponse>(responseJson);

            if (chatResponse?.Choices?.Count > 0)
            {
                return chatResponse.Choices[0].Message.Content;
            }

            _logger.LogWarning("Groq API returned no choices in response");
            return "Unable to generate summary at this time.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate summary with Groq API");
            throw;
        }
    }
}
