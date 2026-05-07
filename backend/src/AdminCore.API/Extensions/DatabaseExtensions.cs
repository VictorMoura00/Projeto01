using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace AdminCore.API.Extensions;

public static class DatabaseExtensions
{
    /// <summary>
    /// Configures the DbContext options to use the provider specified in
    /// configuration (Database:Provider). Supports "postgres" (default) and "sqlite".
    /// </summary>
    public static DbContextOptionsBuilder UseProvider(
        this DbContextOptionsBuilder options, IConfiguration configuration)
    {
        var provider = configuration["Database:Provider"] ?? "postgres";
        var connString = configuration.GetConnectionString("DefaultConnection");

        return provider.ToLowerInvariant() switch
        {
            "sqlite" => options.UseSqlite(connString ??
                throw new InvalidOperationException("DefaultConnection is required for SQLite.")),
            _ => options.UseNpgsql(connString ??
                throw new InvalidOperationException("DefaultConnection is required for PostgreSQL."))
        };
    }
}
