using AdminCore.Modules.Entities.Domain;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Infrastructure.Persistence;

public class EntitiesDbContext(DbContextOptions<EntitiesDbContext> options) : DbContext(options)
{
    public DbSet<EntityDefinition> EntityDefinitions => Set<EntityDefinition>();
    public DbSet<FieldDefinition> FieldDefinitions => Set<FieldDefinition>();
    public DbSet<EntityData> EntityData => Set<EntityData>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("entities");
        builder.ApplyConfigurationsFromAssembly(typeof(EntitiesDbContext).Assembly);

        builder.Entity<EntityDefinition>()
            .HasIndex(e => new { e.TenantId, e.Slug })
            .IsUnique();

        builder.Entity<EntityData>()
            .Property(e => e.Payload)
            .HasColumnType("jsonb");
    }
}
