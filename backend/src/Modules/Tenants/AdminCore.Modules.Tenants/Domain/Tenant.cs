using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.Tenants.Domain;

public class Tenant : AuditableEntity
{
    public string Slug { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Optional per-tenant connection string. When set, this tenant's data
    /// is isolated in a separate database. Leave null to use the default connection.
    /// </summary>
    public string? ConnectionString { get; set; }

    /// <summary>
    /// Optional per-tenant database provider override.
    /// When null, uses the global DB_PROVIDER setting.
    /// </summary>
    public string? DatabaseProvider { get; set; }

    public TenantTheme Theme { get; set; } = new();
}
