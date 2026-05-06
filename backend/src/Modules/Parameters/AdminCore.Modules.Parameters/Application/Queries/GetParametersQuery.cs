using AdminCore.Modules.Parameters.Application.Commands;
using AdminCore.Modules.Parameters.Application.DTOs;
using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Modules.Parameters.Infrastructure.Services;
using AdminCore.Shared.Kernel.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Parameters.Application.Queries;

public record GetParametersQuery(Guid? TenantId, string? Group = null, int Page = 1, int PageSize = 50);

public class GetParametersHandler(ParametersDbContext db, ICachedParameterService cache)
{
    public async Task<PagedList<SystemParameterDto>> Handle(GetParametersQuery q, CancellationToken ct)
    {
        var allItems = await cache.GetAllAsync(q.TenantId, q.Group, async () =>
        {
            var query = db.Parameters
                .AsNoTracking()
                .Where(p => p.TenantId == q.TenantId || p.TenantId == null);

            if (!string.IsNullOrEmpty(q.Group))
                query = query.Where(p => p.Group == q.Group);

            return await query
                .OrderBy(p => p.Group).ThenBy(p => p.Key)
                .Select(p => CreateParameterHandler.ToDto(p))
                .ToListAsync(ct);
        });

        var total = allItems.Count;
        var items = allItems
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToList();

        return new PagedList<SystemParameterDto> { Items = items, TotalCount = total, Page = q.Page, PageSize = q.PageSize };
    }
}
