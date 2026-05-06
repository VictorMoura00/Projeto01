using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Queries;

public record GetFormDefinitionByIdQuery(Guid TenantId, Guid FormId);

public class GetFormDefinitionByIdHandler(FormBuilderDbContext db)
{
    public async Task<FormDefinitionDto> Handle(GetFormDefinitionByIdQuery q, CancellationToken ct)
    {
        var form = await db.FormDefinitions
            .AsNoTracking()
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == q.FormId && f.TenantId == q.TenantId, ct)
            ?? throw new NotFoundException("FormDefinition", q.FormId);

        return FormMapping.ToDto(form);
    }
}
