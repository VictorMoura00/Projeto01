using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.Parameters.Domain;

public class SystemParameter : AuditableEntity
{
    public string Key { get; set; } = null!;
    public string Value { get; set; } = null!;
    public ParameterType Type { get; set; } = ParameterType.String;
    public string? Group { get; set; }
    public string? Description { get; set; }
    public ParameterScope Scope { get; set; } = ParameterScope.Tenant;
    public Guid? TenantId { get; set; }
    public bool IsReadOnly { get; set; }
}
