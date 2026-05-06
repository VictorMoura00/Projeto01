using AdminCore.Shared.Kernel.Entities;

namespace AdminCore.Modules.Entities.Domain;

public class EntityData : TenantAuditableEntity
{
    public Guid EntityDefinitionId { get; set; }
    public string Payload { get; set; } = "{}";

    public EntityDefinition EntityDefinition { get; set; } = null!;
}
