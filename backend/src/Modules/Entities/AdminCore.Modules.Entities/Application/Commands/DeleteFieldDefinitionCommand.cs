using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record DeleteFieldDefinitionCommand(Guid TenantId, Guid EntityDefinitionId, Guid FieldId);

public class DeleteFieldDefinitionHandler(EntitiesDbContext db)
{
    public async Task Handle(DeleteFieldDefinitionCommand cmd, CancellationToken ct)
    {
        var field = await db.FieldDefinitions
            .FirstOrDefaultAsync(f => f.Id == cmd.FieldId
                && f.EntityDefinitionId == cmd.EntityDefinitionId
                && f.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(FieldDefinition), cmd.FieldId);

        db.FieldDefinitions.Remove(field);
        await db.SaveChangesAsync(ct);
    }
}
