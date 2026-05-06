using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.FormBuilder.Domain;

public class FormDefinition : TenantAuditableEntity
{
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public int Version { get; set; } = 1;
    public bool IsPublished { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<FormField> Fields { get; set; } = [];
}
