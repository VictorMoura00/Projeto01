using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record ReorderFieldsCommand(Guid TenantId, Guid EntityDefinitionId, IReadOnlyList<Guid> OrderedFieldIds);

public class ReorderFieldsHandler(EntitiesDbContext db)
{
    public async Task Handle(ReorderFieldsCommand cmd, CancellationToken ct)
    {
        var fields = await db.FieldDefinitions
            .Where(f => f.EntityDefinitionId == cmd.EntityDefinitionId && f.TenantId == cmd.TenantId)
            .ToListAsync(ct);

        if (fields.Count == 0)
            throw new NotFoundException(nameof(EntityDefinition), cmd.EntityDefinitionId);

        for (var i = 0; i < cmd.OrderedFieldIds.Count; i++)
        {
            var field = fields.FirstOrDefault(f => f.Id == cmd.OrderedFieldIds[i]);
            if (field is not null)
                field.DisplayOrder = i;
        }

        await db.SaveChangesAsync(ct);
    }
}
