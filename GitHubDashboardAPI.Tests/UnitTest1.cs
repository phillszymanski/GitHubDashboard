using System.Net;
using System.Net.Http;
using System.Text;
using GitHubDashboardAPI.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace GitHubDashboardAPI.Tests;

public class UnitTest1
{
    [Fact]
    public async Task GetUser_UsesCache_OnSecondCall()
    {
        var handler = new CountingHandler(() => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"login\":\"octocat\"}", Encoding.UTF8, "application/json")
        });

        var controller = CreateController(handler);

        var first = await controller.GetUser("octocat");
        var second = await controller.GetUser("octocat");

        Assert.Equal(1, handler.CallCount);
        AssertContentResult(first, HttpStatusCode.OK);
        AssertContentResult(second, HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetUser_Caches_NonSuccess()
    {
        var handler = new CountingHandler(() => new HttpResponseMessage(HttpStatusCode.NotFound)
        {
            Content = new StringContent("{\"message\":\"Not Found\"}", Encoding.UTF8, "application/json")
        });

        var controller = CreateController(handler);

        await controller.GetUser("missing");
        await controller.GetUser("missing");

        Assert.Equal(1, handler.CallCount);
    }

    private static GitHubController CreateController(CountingHandler handler)
    {
        var httpClient = new HttpClient(handler);
        var factory = new TestHttpClientFactory(httpClient);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>()).Build();
        var cache = new MemoryCache(new MemoryCacheOptions());
        var logger = NullLogger<GitHubController>.Instance;

        return new GitHubController(factory, config, logger, cache);
    }

    private static void AssertContentResult(IActionResult result, HttpStatusCode statusCode)
    {
        var content = Assert.IsType<ContentResult>(result);
        Assert.Equal((int)statusCode, content.StatusCode);
        Assert.Equal("application/json", content.ContentType);
    }

    private sealed class TestHttpClientFactory : IHttpClientFactory
    {
        private readonly HttpClient _client;

        public TestHttpClientFactory(HttpClient client)
        {
            _client = client;
        }

        public HttpClient CreateClient(string name) => _client;
    }

    private sealed class CountingHandler : HttpMessageHandler
    {
        private readonly Func<HttpResponseMessage> _responseFactory;

        public CountingHandler(Func<HttpResponseMessage> responseFactory)
        {
            _responseFactory = responseFactory;
        }

        public int CallCount { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(_responseFactory());
        }
    }
}
