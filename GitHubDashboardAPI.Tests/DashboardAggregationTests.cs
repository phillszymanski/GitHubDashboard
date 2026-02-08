using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using GitHubDashboardAPI.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace GitHubDashboardAPI.Tests;

public class DashboardAggregationTests
{
    [Fact]
    public async Task GetDashboard_ReturnsCombinedPayload()
    {
        var handler = new RoutingHandler(new Dictionary<string, Func<HttpResponseMessage>>
        {
            ["https://api.github.com/users/octocat"] = () => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("{\"login\":\"octocat\"}", Encoding.UTF8, "application/json")
            },
            ["https://api.github.com/users/octocat/repos"] = () => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("[{\"name\":\"repo1\"}]", Encoding.UTF8, "application/json")
            },
            ["https://api.github.com/users/octocat/events"] = () => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("[{\"type\":\"PushEvent\"}]", Encoding.UTF8, "application/json")
            }
        });

        var controller = CreateController(handler);

        var result = await controller.GetDashboard("octocat");

        var json = Assert.IsType<JsonResult>(result);
        Assert.Equal(200, json.StatusCode);

        using var doc = JsonSerializer.SerializeToDocument(json.Value);
        var root = doc.RootElement;

        Assert.True(root.TryGetProperty("user", out var user));
        Assert.True(root.TryGetProperty("repos", out var repos));
        Assert.True(root.TryGetProperty("events", out var events));

        Assert.Equal(200, user.GetProperty("status").GetInt32());
        Assert.Equal(200, repos.GetProperty("status").GetInt32());
        Assert.Equal(200, events.GetProperty("status").GetInt32());

        Assert.Equal("octocat", user.GetProperty("data").GetProperty("login").GetString());
        Assert.Equal("repo1", repos.GetProperty("data")[0].GetProperty("name").GetString());
        Assert.Equal("PushEvent", events.GetProperty("data")[0].GetProperty("type").GetString());
    }

    private static GitHubController CreateController(RoutingHandler handler)
    {
        var factory = new TestHttpClientFactory(handler);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        var cache = new MemoryCache(new MemoryCacheOptions());
        var logger = NullLogger<GitHubController>.Instance;

        return new GitHubController(factory, config, logger, cache);
    }

    private sealed class TestHttpClientFactory : IHttpClientFactory
    {
        private readonly HttpMessageHandler _handler;

        public TestHttpClientFactory(HttpMessageHandler handler)
        {
            _handler = handler;
        }

        public HttpClient CreateClient(string name) => new HttpClient(_handler, disposeHandler: false);
    }

    private sealed class RoutingHandler : HttpMessageHandler
    {
        private readonly Dictionary<string, Func<HttpResponseMessage>> _responses;

        public RoutingHandler(Dictionary<string, HttpResponseMessage> responses)
        {
            _responses = responses.ToDictionary(kvp => kvp.Key, kvp => new Func<HttpResponseMessage>(() => kvp.Value));
        }

        public RoutingHandler(Dictionary<string, Func<HttpResponseMessage>> responses)
        {
            _responses = responses;
        }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (request.RequestUri is not null && _responses.TryGetValue(request.RequestUri.ToString(), out var responseFactory))
            {
                return Task.FromResult(responseFactory());
            }

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound)
            {
                Content = new StringContent("{\"message\":\"Not Found\"}", Encoding.UTF8, "application/json")
            });
        }
    }
}
