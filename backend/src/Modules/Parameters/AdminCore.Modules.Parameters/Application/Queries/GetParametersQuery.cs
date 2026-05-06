using AdminCore.Modules.Parameters.Application.Commands;
using AdminCore.Modules.Parameters.Application.DTOs;
using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Parameters.Application.Queries;

public record GetParametersQuery(Guid? TenantId, string? Group = null, int Page = 1, int PageSize = 50);

public class GetParametersHandler(ParametersDbContext db)
{
    public async Task<PagedList<SystemParameterDto>> Handle(GetParametersQuery q, CancellationToken ct)
    {
        var query = db.Parameters
            .AsNoTracking()
            .Where(p => p.TenantId == q.TenantId || p.TenantId == null);

        if (!string.IsNullOrEmpty(q.Group))
            query = query.Where(p => p.Group == q.Group);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(p => p.Group).ThenBy(p => p.Key)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(p => CreateParameterHandler.ToDto(p))
            .ToListAsync(ct);

        return new PagedList<SystemParameterDto> { Items = items, TotalCount = total, Page = q.Page, PageSize = q.PageSize };
    }
}
