using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Queries;

public record GetEntityDefinitionByIdQuery(Guid TenantId, Guid EntityId);

public class GetEntityDefinitionByIdHandler(EntitiesDbContext db)
{
    public async Task<EntityDefinitionWithFieldsDto> Handle(GetEntityDefinitionByIdQuery query, CancellationToken ct)
    {
        var entity = await db.EntityDefinitions
            .Include(e => e.Fields.OrderBy(f => f.DisplayOrder))
            .FirstOrDefaultAsync(e => e.Id == query.EntityId && e.TenantId == query.TenantId, ct)
            ?? throw new NotFoundException(nameof(EntityDefinition), query.EntityId);

        return new EntityDefinitionWithFieldsDto(
            entity.Id, entity.Name, entity.Slug, entity.Description, entity.Icon,
            entity.IsActive, entity.DisplayOrder, entity.CreatedAt,
            entity.Fields.Select(f => new FieldDefinitionDto(
                f.Id, f.Name, f.Slug, f.FieldType, f.IsRequired, f.IsSearchable,
                f.IsFilterable, f.DisplayOrder, f.DefaultValue, f.OptionsJson, f.ValidationJson
            )).ToList()
        );
    }
}

public record EntityDefinitionWithFieldsDto(
    Guid Id, string Name, string Slug, string? Description, string? Icon,
    bool IsActive, int DisplayOrder, DateTime CreatedAt,
    IReadOnlyList<FieldDefinitionDto> Fields
);
