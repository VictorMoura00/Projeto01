using AdminCore.API.Extensions;

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
