using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Application.Validation;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record UpdateEntityDataCommand(
    Guid TenantId,
    Guid EntityDataId,
    string Payload
);

public class UpdateEntityDataHandler(EntitiesDbContext db, EntityDataValidator validator)
{
    public async Task<EntityDataDto> Handle(UpdateEntityDataCommand cmd, CancellationToken ct)
    {
        var data = await db.EntityData
            .FirstOrDefaultAsync(e => e.Id == cmd.EntityDataId && e.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(EntityData), cmd.EntityDataId);

        var errors = await validator.ValidateAsync(data.EntityDefinitionId, cmd.TenantId, cmd.Payload, ct);
        if (errors.Count > 0)
            throw new Shared.Kernel.Exceptions.ValidationException(
                errors.Select(e => new Shared.Kernel.Exceptions.ValidationErrorDetail(e.Field, e.Message)));

        data.Payload = cmd.Payload;
        await db.SaveChangesAsync(ct);

        return new EntityDataDto(data.Id, data.EntityDefinitionId, data.TenantId, data.Payload, data.CreatedAt, data.UpdatedAt);
    }
}
