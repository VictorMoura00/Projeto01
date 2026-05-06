using AdminCore.Modules.Access.Domain;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Access.Infrastructure.Persistence;

public class AccessDbContext(DbContextOptions<AccessDbContext> options) : DbContext(options)
{
    public DbSet<AppRole> Roles => Set<AppRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("access");
        builder.ApplyConfigurationsFromAssembly(typeof(AccessDbContext).Assembly);

        builder.Entity<AppRole>()
            .HasIndex(r => new { r.TenantId, r.Name })
            .IsUnique();
    }
}
