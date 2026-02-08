using Microsoft.AspNetCore.Server.Kestrel.Core;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(5010, listenOptions =>
    {
        listenOptions.Protocols = HttpProtocols.Http1; // Force HTTP/1.1
        listenOptions.UseHttps(); // Keep HTTPS if you want
    });
});

// Validate GitHub token is configured
var gitHubToken = builder.Configuration["GitHub:Token"];
if (string.IsNullOrWhiteSpace(gitHubToken))
{
    throw new InvalidOperationException(
        "GitHub token is not configured. Set it in appsettings.json or user secrets.");
}

// Add services to the container.

// Load CORS allowed origins from configuration
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() 
    ?? Array.Empty<string>();

// Validate CORS configuration in production
if (!builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
{
    throw new InvalidOperationException(
        "CORS allowed origins must be explicitly configured in production. " +
        "Set Cors:AllowedOrigins in appsettings.json.");
}

// Use default localhost origins only in development
if (builder.Environment.IsDevelopment() && allowedOrigins.Length == 0)
{
    allowedOrigins = new[] { "http://localhost:5173", "https://localhost:5173" };
}

builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<GitHubDashboardAPI.Services.IGroqService, GitHubDashboardAPI.Services.GroqService>();
builder.Services.AddCors(options =>
{
    options.AddPolicy(name: "AllowedOrigins", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("AllowedOrigins");

app.UseAuthorization();

app.MapControllers();

app.Run();
