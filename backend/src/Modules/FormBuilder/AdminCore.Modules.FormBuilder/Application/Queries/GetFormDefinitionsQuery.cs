using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Pagination;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Queries;

public record GetFormDefinitionsQuery(Guid TenantId, int Page = 1, int PageSize = 20, string? Search = null);

public class GetFormDefinitionsHandler(FormBuilderDbContext db)
{
    public async Task<PagedList<FormDefinitionDto>> Handle(GetFormDefinitionsQuery q, CancellationToken ct)
    {
        var query = db.FormDefinitions
            .AsNoTracking()
            .Include(f => f.Fields)
            .Where(f => f.TenantId == q.TenantId);

        if (!string.IsNullOrWhiteSpace(q.Search))
            query = query.Where(f => f.Name.Contains(q.Search) || f.Slug.Contains(q.Search));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(f => f.Name)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .Select(f => FormMapping.ToDto(f))
            .ToListAsync(ct);

        return new PagedList<FormDefinitionDto> { Items = items, TotalCount = total, Page = q.Page, PageSize = q.PageSize };
    }
}
