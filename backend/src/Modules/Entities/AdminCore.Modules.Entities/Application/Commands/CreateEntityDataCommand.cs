using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Application.Validation;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record CreateEntityDataCommand(
    Guid TenantId,
    Guid EntityDefinitionId,
    string Payload
);

public class CreateEntityDataHandler(EntitiesDbContext db, EntityDataValidator validator)
{
    public async Task<EntityDataDto> Handle(CreateEntityDataCommand cmd, CancellationToken ct)
    {
        var definition = await db.EntityDefinitions
            .FirstOrDefaultAsync(e => e.Id == cmd.EntityDefinitionId && e.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(EntityDefinition), cmd.EntityDefinitionId);

        var errors = await validator.ValidateAsync(cmd.EntityDefinitionId, cmd.TenantId, cmd.Payload, ct);
        if (errors.Count > 0)
            throw new Shared.Kernel.Exceptions.ValidationException(
                errors.Select(e => new Shared.Kernel.Exceptions.ValidationErrorDetail(e.Field, e.Message)));

        var data = new EntityData
        {
            TenantId = cmd.TenantId,
            EntityDefinitionId = cmd.EntityDefinitionId,
            Payload = cmd.Payload
        };

        db.EntityData.Add(data);
        await db.SaveChangesAsync(ct);

        return new EntityDataDto(data.Id, data.EntityDefinitionId, data.TenantId, data.Payload, data.CreatedAt, data.UpdatedAt);
    }
}
