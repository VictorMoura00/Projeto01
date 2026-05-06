using AdminCore.Modules.Access.Application.DTOs;
using AdminCore.Modules.Access.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Access.Application.Commands;

public record UpdateRoleCommand(Guid TenantId, Guid RoleId, string Name, string? Description, bool IsActive);

public class UpdateRoleHandler(AccessDbContext db)
{
    public async Task<AppRoleDto> Handle(UpdateRoleCommand cmd, CancellationToken ct)
    {
        var role = await db.Roles
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == cmd.RoleId && r.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("Role", cmd.RoleId);

        if (role.IsSystemRole)
            throw new ForbiddenException("System roles cannot be modified.");

        role.Name = cmd.Name;
        role.Description = cmd.Description;
        role.IsActive = cmd.IsActive;

        await db.SaveChangesAsync(ct);
        return CreateRoleHandler.RoleToDto(role);
    }
}
