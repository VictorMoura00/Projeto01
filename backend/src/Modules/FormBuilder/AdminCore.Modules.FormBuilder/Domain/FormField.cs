using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.FormBuilder.Domain;

public class FormField : TenantAuditableEntity
{
    public Guid FormDefinitionId { get; set; }
    public string Label { get; set; } = null!;
    public string Key { get; set; } = null!;
    public FormFieldType Type { get; set; }
    public bool IsRequired { get; set; }
    public string? Placeholder { get; set; }
    public int DisplayOrder { get; set; }
    public string? OptionsJson { get; set; }
    public string? ValidationJson { get; set; }
    public string? LayoutJson { get; set; }

    public FormDefinition FormDefinition { get; set; } = null!;
}
