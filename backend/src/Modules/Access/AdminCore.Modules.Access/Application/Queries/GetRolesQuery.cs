using AdminCore.Modules.Access.Application.Commands;
using AdminCore.Modules.Access.Application.DTOs;
using AdminCore.Modules.Access.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Access.Application.Queries;

public record GetRolesQuery(Guid TenantId, int Page = 1, int PageSize = 20);

public class GetRolesHandler(AccessDbContext db)
{
    public async Task<PagedList<AppRoleDto>> Handle(GetRolesQuery q, CancellationToken ct)
    {
        var query = db.Roles
            .AsNoTracking()
            .Include(r => r.Permissions)
            .Where(r => r.TenantId == q.TenantId);


        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(r => r.Name)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync(ct);

        return new PagedList<AppRoleDto>
        {
            Items = items.Select(CreateRoleHandler.RoleToDto).ToList(),
            TotalCount = total,
            Page = q.Page,
            PageSize = q.PageSize
        };
    }
}
