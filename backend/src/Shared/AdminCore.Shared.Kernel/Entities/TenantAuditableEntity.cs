namespace AdminCore.Shared.Kernel.Entities;

public abstract class TenantAuditableEntity : AuditableEntity
{
    public Guid TenantId { get; set; }
}
