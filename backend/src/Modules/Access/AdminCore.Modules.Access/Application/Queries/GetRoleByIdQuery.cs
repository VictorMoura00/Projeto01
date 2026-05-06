using AdminCore.Modules.Access.Application.Commands;
using AdminCore.Modules.Access.Application.DTOs;
using AdminCore.Modules.Access.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Access.Application.Queries;

public record GetRoleByIdQuery(Guid TenantId, Guid RoleId);

public class GetRoleByIdHandler(AccessDbContext db)
{
    public async Task<AppRoleDto> Handle(GetRoleByIdQuery q, CancellationToken ct)
    {
        var role = await db.Roles
            .AsNoTracking()
            .Include(r => r.Permissions)
            .FirstOrDefaultAsync(r => r.Id == q.RoleId && r.TenantId == q.TenantId, ct)
            ?? throw new NotFoundException("Role", q.RoleId);

        return CreateRoleHandler.RoleToDto(role);
    }
}
