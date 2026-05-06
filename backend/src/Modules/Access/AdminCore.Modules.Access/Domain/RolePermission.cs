namespace AdminCore.Modules.Access.Domain;

public class RolePermission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RoleId { get; set; }
    public string EntitySlug { get; set; } = null!;
    public PermissionOperation Operations { get; set; }

    public AppRole Role { get; set; } = null!;
}
