using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.Entities.Domain;

public class FieldDefinition : TenantAuditableEntity
{
    public Guid EntityDefinitionId { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public FieldType FieldType { get; set; }
    public bool IsRequired { get; set; }
    public bool IsSearchable { get; set; }
    public bool IsFilterable { get; set; }
    public int DisplayOrder { get; set; }
    public string? DefaultValue { get; set; }
    public string? OptionsJson { get; set; }
    public string? ValidationJson { get; set; }

    public EntityDefinition EntityDefinition { get; set; } = null!;
}
