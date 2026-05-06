using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Commands;

public record PublishFormDefinitionCommand(Guid TenantId, Guid FormId);

public class PublishFormDefinitionHandler(FormBuilderDbContext db)
{
    public async Task<FormDefinitionDto> Handle(PublishFormDefinitionCommand cmd, CancellationToken ct)
    {
        var form = await db.FormDefinitions
            .Include(f => f.Fields)
            .FirstOrDefaultAsync(f => f.Id == cmd.FormId && f.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("FormDefinition", cmd.FormId);

        if (form.Fields.Count == 0)
            throw new DomainException("A form must have at least one field before publishing.");

        form.IsPublished = true;
        form.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
        return FormMapping.ToDto(form);
    }
}
