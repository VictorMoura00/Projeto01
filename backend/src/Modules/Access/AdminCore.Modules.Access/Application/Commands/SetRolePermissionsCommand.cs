using AdminCore.Modules.Access.Application.DTOs;
using AdminCore.Modules.Access.Domain;
using AdminCore.Modules.Access.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Access.Application.Commands;

public record PermissionInput(string EntitySlug, int Operations);

public record SetRolePermissionsCommand(
    Guid TenantId,
    Guid RoleId,
    IReadOnlyList<PermissionInput> Permissions
);

public class SetRolePermissionsHandler(AccessDbContext db)
{
    public async Task<AppRoleDto> Handle(SetRolePermissionsCommand cmd, CancellationToken ct)
    {
        var role = await db.Roles
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == cmd.RoleId && r.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("Role", cmd.RoleId);

        db.RolePermissions.RemoveRange(role.Permissions);

        foreach (var p in cmd.Permissions)
        {
            if (p.Operations != 0)
            {
                role.Permissions.Add(new RolePermission
                {
                    RoleId = role.Id,
                    EntitySlug = p.EntitySlug,
                    Operations = (PermissionOperation)p.Operations
                });
            }
        }

        await db.SaveChangesAsync(ct);
        return CreateRoleHandler.RoleToDto(role);
    }
}
