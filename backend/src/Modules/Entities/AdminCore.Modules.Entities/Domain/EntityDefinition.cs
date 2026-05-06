using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.Entities.Domain;

public class EntityDefinition : TenantAuditableEntity
{
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }

    public ICollection<FieldDefinition> Fields { get; set; } = [];
}
