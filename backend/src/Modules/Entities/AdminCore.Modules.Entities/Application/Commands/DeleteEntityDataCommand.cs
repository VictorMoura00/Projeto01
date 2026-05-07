using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record DeleteEntityDataCommand(
    Guid TenantId,
    Guid EntityDataId
);

public class DeleteEntityDataHandler(EntitiesDbContext db)
{
    public async Task Handle(DeleteEntityDataCommand cmd, CancellationToken ct)
    {
        var data = await db.EntityData
            .FirstOrDefaultAsync(e => e.Id == cmd.EntityDataId && e.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(EntityData), cmd.EntityDataId);

        db.EntityData.Remove(data);
        await db.SaveChangesAsync(ct);
    }
}
