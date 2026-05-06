using AdminCore.Modules.FormBuilder.Domain;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Infrastructure.Persistence;

public class FormBuilderDbContext(DbContextOptions<FormBuilderDbContext> options) : DbContext(options)
{
    public DbSet<FormDefinition> FormDefinitions => Set<FormDefinition>();
    public DbSet<FormField> FormFields => Set<FormField>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.HasDefaultSchema("forms");
        builder.ApplyConfigurationsFromAssembly(typeof(FormBuilderDbContext).Assembly);

        builder.Entity<FormDefinition>()
            .HasIndex(f => new { f.TenantId, f.Slug, f.Version })
            .IsUnique();

        builder.Entity<FormDefinition>()
            .HasMany(f => f.Fields)
            .WithOne(f => f.FormDefinition)
            .HasForeignKey(f => f.FormDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
