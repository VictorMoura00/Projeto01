using AdminCore.Modules.Tenants.Domain;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Tenants.Infrastructure.Persistence;

public class TenantsDbContext(DbContextOptions<TenantsDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("tenants");
        builder.ApplyConfigurationsFromAssembly(typeof(TenantsDbContext).Assembly);

        builder.Entity<Tenant>().OwnsOne(t => t.Theme);
        builder.Entity<Tenant>().HasIndex(t => t.Slug).IsUnique();
    }
}
