namespace AdminCore.Modules.Access.Domain;

[Flags]
public enum PermissionOperation
{
    None   = 0,
    Create = 1,
    Read   = 2,
    Update = 4,
    Delete = 8,
    All    = Create | Read | Update | Delete
}
