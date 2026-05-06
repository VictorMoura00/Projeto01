using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record CreateEntityDefinitionCommand(
    Guid TenantId,
    string Name,
    string Slug,
    string? Description,
    string? Icon,
    int DisplayOrder = 0
);

public class CreateEntityDefinitionHandler(EntitiesDbContext db)
{
    public async Task<EntityDefinitionDto> Handle(CreateEntityDefinitionCommand cmd, CancellationToken ct)
    {
        var exists = await db.EntityDefinitions
            .AnyAsync(e => e.TenantId == cmd.TenantId && e.Slug == cmd.Slug, ct);

        if (exists)
            throw new ConflictException($"Entity with slug '{cmd.Slug}' already exists.");

        var entity = new EntityDefinition
        {
            TenantId = cmd.TenantId,
            Name = cmd.Name,
            Slug = cmd.Slug,
            Description = cmd.Description,
            Icon = cmd.Icon,
            DisplayOrder = cmd.DisplayOrder
        };

        db.EntityDefinitions.Add(entity);
        await db.SaveChangesAsync(ct);

        return new EntityDefinitionDto(entity.Id, entity.Name, entity.Slug, entity.Description,
            entity.Icon, entity.IsActive, entity.DisplayOrder, 0, entity.CreatedAt);
    }
}
