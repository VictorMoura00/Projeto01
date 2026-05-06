using Microsoft.AspNetCore.Identity;

namespace AdminCore.Modules.Auth.Domain;

public class AppRole : IdentityRole<Guid>
{
    public Guid TenantId { get; set; }
    public string? Description { get; set; }
    public bool IsSystemRole { get; set; }
}
