using AdminCore.Modules.Access.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Access.Application.Commands;

public record DeleteRoleCommand(Guid TenantId, Guid RoleId);

public class DeleteRoleHandler(AccessDbContext db)
{
    public async Task Handle(DeleteRoleCommand cmd, CancellationToken ct)
    {
        var role = await db.Roles
            .FirstOrDefaultAsync(r => r.Id == cmd.RoleId && r.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("Role", cmd.RoleId);

        if (role.IsSystemRole)
            throw new ForbiddenException("System roles cannot be deleted.");

        db.Roles.Remove(role);
        await db.SaveChangesAsync(ct);
    }
}
