using AdminCore.Modules.Access.Application.DTOs;
using AdminCore.Modules.Access.Domain;
using AdminCore.Modules.Access.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Access.Application.Commands;

public record CreateRoleCommand(Guid TenantId, string Name, string? Description);

public class CreateRoleHandler(AccessDbContext db)
{
    public async Task<AppRoleDto> Handle(CreateRoleCommand cmd, CancellationToken ct)
    {
        var exists = await db.Roles
            .AnyAsync(r => r.TenantId == cmd.TenantId && r.Name == cmd.Name, ct);

        if (exists)
            throw new ConflictException($"Role '{cmd.Name}' already exists.");

        var role = new AppRole
        {
            TenantId = cmd.TenantId,
            Name = cmd.Name,
            Description = cmd.Description
        };

        db.Roles.Add(role);
        await db.SaveChangesAsync(ct);

        return RoleToDto(role);
    }

    internal static AppRoleDto RoleToDto(AppRole r) =>
        new(r.Id, r.Name, r.Description, r.IsSystemRole, r.IsActive,
            r.Permissions.Select(p => new RolePermissionDto(p.Id, p.EntitySlug, (int)p.Operations)).ToList(),
            r.CreatedAt);
}
