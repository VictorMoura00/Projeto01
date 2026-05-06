using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.Access.Domain;

public class AppRole : TenantAuditableEntity
{
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<RolePermission> Permissions { get; set; } = [];
}
