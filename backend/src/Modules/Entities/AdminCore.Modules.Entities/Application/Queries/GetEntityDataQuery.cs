using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using AdminCore.Shared.Kernel.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Queries;

public record GetEntityDataQuery(Guid TenantId, Guid EntityDataId);

public class GetEntityDataHandler(EntitiesDbContext db)
{
    public async Task<EntityDataDto> Handle(GetEntityDataQuery query, CancellationToken ct)
    {
        var data = await db.EntityData
            .FirstOrDefaultAsync(e => e.Id == query.EntityDataId && e.TenantId == query.TenantId, ct)
            ?? throw new NotFoundException(nameof(EntityData), query.EntityDataId);

        return new EntityDataDto(data.Id, data.EntityDefinitionId, data.TenantId, data.Payload, data.CreatedAt, data.UpdatedAt);
    }
}

public record GetEntityDataListQuery(Guid TenantId, Guid EntityDefinitionId, int Page = 1, int PageSize = 20);

public class GetEntityDataListHandler(EntitiesDbContext db)
{
    public async Task<PagedList<EntityDataDto>> Handle(GetEntityDataListQuery query, CancellationToken ct)
    {
        var q = db.EntityData
            .Where(e => e.TenantId == query.TenantId && e.EntityDefinitionId == query.EntityDefinitionId)
            .OrderByDescending(e => e.CreatedAt)
            .AsQueryable();

        var total = await q.CountAsync(ct);
        var items = await q
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(e => new EntityDataDto(
                e.Id, e.EntityDefinitionId, e.TenantId, e.Payload, e.CreatedAt, e.UpdatedAt))
            .ToListAsync(ct);

        return new PagedList<EntityDataDto>
        {
            Items = items,
            TotalCount = total,
            Page = query.Page,
            PageSize = query.PageSize
        };
    }
}
