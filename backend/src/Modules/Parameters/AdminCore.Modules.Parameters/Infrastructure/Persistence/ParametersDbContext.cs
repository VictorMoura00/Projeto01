using AdminCore.Modules.Parameters.Domain;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Parameters.Infrastructure.Persistence;

public class ParametersDbContext(DbContextOptions<ParametersDbContext> options) : DbContext(options)
{
    public DbSet<SystemParameter> Parameters => Set<SystemParameter>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("parameters");
        builder.ApplyConfigurationsFromAssembly(typeof(ParametersDbContext).Assembly);

        builder.Entity<SystemParameter>()
            .HasIndex(p => new { p.Key, p.TenantId })
            .IsUnique();
    }
}
