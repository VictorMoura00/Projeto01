using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record DeleteEntityDefinitionCommand(Guid TenantId, Guid EntityId);

public class DeleteEntityDefinitionHandler(EntitiesDbContext db)
{
    public async Task Handle(DeleteEntityDefinitionCommand cmd, CancellationToken ct)
    {
        var entity = await db.EntityDefinitions
            .FirstOrDefaultAsync(e => e.Id == cmd.EntityId && e.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(EntityDefinition), cmd.EntityId);

        db.EntityDefinitions.Remove(entity);
        await db.SaveChangesAsync(ct);
    }
}
