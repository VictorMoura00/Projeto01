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

var builder = WebApplication.CreateBuilder(args);

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
