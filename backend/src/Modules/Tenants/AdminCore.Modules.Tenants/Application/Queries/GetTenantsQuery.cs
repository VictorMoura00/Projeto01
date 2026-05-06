using AdminCore.Modules.Tenants.Application.Commands;
using AdminCore.Modules.Tenants.Application.DTOs;
using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Tenants.Application.Queries;

public record GetTenantsQuery(int Page = 1, int PageSize = 20);

public class GetTenantsHandler(TenantsDbContext db)
{
    public async Task<PagedList<TenantDto>> Handle(GetTenantsQuery q, CancellationToken ct)
    {
        var total = await db.Tenants.CountAsync(ct);
        var items = await db.Tenants
            .AsNoTracking()
            .OrderBy(t => t.Name)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync(ct);

        return new PagedList<TenantDto>
        {
            Items = items.Select(CreateTenantHandler.ToDto).ToList(),
            TotalCount = total,
            Page = q.Page,
            PageSize = q.PageSize
        };
    }
}
