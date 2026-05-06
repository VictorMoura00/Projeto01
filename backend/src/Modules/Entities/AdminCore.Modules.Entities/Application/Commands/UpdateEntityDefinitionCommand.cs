using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record UpdateEntityDefinitionCommand(
    Guid TenantId,
    Guid EntityId,
    string Name,
    string? Description,
    string? Icon,
    bool IsActive,
    int DisplayOrder
);

public class UpdateEntityDefinitionHandler(EntitiesDbContext db)
{
    public async Task<EntityDefinitionDto> Handle(UpdateEntityDefinitionCommand cmd, CancellationToken ct)
    {
        var entity = await db.EntityDefinitions
            .FirstOrDefaultAsync(e => e.Id == cmd.EntityId && e.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(EntityDefinition), cmd.EntityId);

        entity.Name = cmd.Name;
        entity.Description = cmd.Description;
        entity.Icon = cmd.Icon;
        entity.IsActive = cmd.IsActive;
        entity.DisplayOrder = cmd.DisplayOrder;
        entity.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        var fieldCount = await db.FieldDefinitions.CountAsync(f => f.EntityDefinitionId == entity.Id, ct);
        return new EntityDefinitionDto(entity.Id, entity.Name, entity.Slug, entity.Description,
            entity.Icon, entity.IsActive, entity.DisplayOrder, fieldCount, entity.CreatedAt);
    }
}
