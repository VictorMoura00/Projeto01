using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.Tenants.Domain;

public class Tenant : AuditableEntity
{
    public string Slug { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? LogoUrl { get; set; }
    public string? FaviconUrl { get; set; }
    public bool IsActive { get; set; } = true;

    public TenantTheme Theme { get; set; } = new();
}
