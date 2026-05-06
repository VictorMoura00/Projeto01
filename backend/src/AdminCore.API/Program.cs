using AdminCore.API.Extensions;

// Load .env file before building the app so environment variables
// are available to configuration providers.
DotEnvExtensions.Load();

// If DATABASE_URL is provided via .env, inject it as the default connection string
// so all modules pick it up automatically.
var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
if (!string.IsNullOrWhiteSpace(databaseUrl))
{
    Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", databaseUrl);
}

// Map flat .env variables to .NET configuration hierarchy
MapEnvToDotNet("JWT_KEY", "Jwt__Key");
MapEnvToDotNet("JWT_ISSUER", "Jwt__Issuer");
MapEnvToDotNet("JWT_AUDIENCE", "Jwt__Audience");
MapEnvToDotNet("JWT_ACCESS_TOKEN_EXPIRATION_MINUTES", "Jwt__AccessTokenExpirationMinutes");
MapEnvToDotNet("JWT_REFRESH_TOKEN_EXPIRATION_DAYS", "Jwt__RefreshTokenExpirationDays");

var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS");
if (!string.IsNullOrWhiteSpace(corsOrigins))
{
    var origins = corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    for (int i = 0; i < origins.Length; i++)
    {
        Environment.SetEnvironmentVariable($"Cors__AllowedOrigins__{i}", origins[i]);
    }
}

static void MapEnvToDotNet(string envKey, string dotNetKey)
{
    var value = Environment.GetEnvironmentVariable(envKey);
    if (!string.IsNullOrWhiteSpace(value))
    {
        Environment.SetEnvironmentVariable(dotNetKey, value);
    }
}

var apiPort = Environment.GetEnvironmentVariable("API_PORT") ?? "5000";

var builder = WebApplication.CreateBuilder(args);
// Listen on all interfaces (0.0.0.0) so external browsers can reach the API.
// This works on WSL2, Docker, and any network environment.
builder.WebHost.UseUrls($"http://0.0.0.0:{apiPort}");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

builder.Services.AddCorsPolicy(builder.Configuration);
builder.Services.AddModules(builder.Configuration);
builder.Services.AddApiAuthentication(builder.Configuration);

builder.Host.AddWolverineModules();

var app = builder.Build();

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseApiExceptionHandling();
app.UseCorsPolicy();
app.UseAuthentication();
app.UseCurrentTenant();
app.UseAuthorization();
app.UseDevelopmentSeed();
app.MapControllers();

app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
   .AllowAnonymous();

app.Run();
