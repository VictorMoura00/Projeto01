using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Modules.FormBuilder.Application.DTOs;
using AdminCore.Modules.FormBuilder.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Queries;

public record GetEntityDefinitionBySlugQuery(Guid TenantId, string Slug);

public record EntityDefinitionPublicDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? Icon,
    bool IsActive,
    int DisplayOrder,
    DateTime CreatedAt,
    IReadOnlyList<FieldDefinitionDto> Fields,
    FormDefinitionDto? Form
);

public class GetEntityDefinitionBySlugHandler(EntitiesDbContext entitiesDb, FormBuilderDbContext formsDb)
{
    public async Task<EntityDefinitionPublicDto> Handle(GetEntityDefinitionBySlugQuery query, CancellationToken ct)
    {
        var entity = await entitiesDb.EntityDefinitions
            .Include(e => e.Fields.OrderBy(f => f.DisplayOrder))
            .FirstOrDefaultAsync(e => e.TenantId == query.TenantId && e.Slug == query.Slug, ct)
            ?? throw new NotFoundException(nameof(EntityDefinition), query.Slug);

        var form = await formsDb.FormDefinitions
            .Include(f => f.Fields.OrderBy(f => f.DisplayOrder))
            .FirstOrDefaultAsync(f => f.TenantId == query.TenantId && f.Slug == query.Slug && f.IsPublished, ct);

        return new EntityDefinitionPublicDto(
            entity.Id, entity.Name, entity.Slug, entity.Description, entity.Icon,
            entity.IsActive, entity.DisplayOrder, entity.CreatedAt,
            entity.Fields.Select(f => new FieldDefinitionDto(
                f.Id, f.Name, f.Slug, f.FieldType, f.IsRequired, f.IsSearchable,
                f.IsFilterable, f.DisplayOrder, f.DefaultValue, f.OptionsJson, f.ValidationJson
            )).ToList(),
            form == null ? null : FormMapping.ToDto(form)
        );
    }
}
