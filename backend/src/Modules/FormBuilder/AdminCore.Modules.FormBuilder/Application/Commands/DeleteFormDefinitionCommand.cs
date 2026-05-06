using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.FormBuilder.Application.Commands;

public record DeleteFormDefinitionCommand(Guid TenantId, Guid FormId);

public class DeleteFormDefinitionHandler(FormBuilderDbContext db)
{
    public async Task Handle(DeleteFormDefinitionCommand cmd, CancellationToken ct)
    {
        var form = await db.FormDefinitions
            .FirstOrDefaultAsync(f => f.Id == cmd.FormId && f.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("FormDefinition", cmd.FormId);

        db.FormDefinitions.Remove(form);
        await db.SaveChangesAsync(ct);
    }
}
