using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Queries;

public record GetActiveEntityDefinitionsQuery(Guid TenantId, int Page = 1, int PageSize = 20);

public class GetActiveEntityDefinitionsHandler(EntitiesDbContext db)
{
    public async Task<PagedList<EntityDefinitionDto>> Handle(GetActiveEntityDefinitionsQuery query, CancellationToken ct)
    {
        var q = db.EntityDefinitions
            .Where(e => e.TenantId == query.TenantId && e.IsActive)
            .OrderBy(e => e.DisplayOrder).ThenBy(e => e.Name)
            .AsQueryable();

        var total = await q.CountAsync(ct);
        var items = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new EntityDefinitionDto(
                e.Id, e.Name, e.Slug, e.Description, e.Icon, e.IsActive, e.DisplayOrder,
                e.Fields.Count, e.CreatedAt))
            .ToListAsync(ct);

        return new PagedList<EntityDefinitionDto>
        {
            Items = items,
            TotalCount = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }
}
