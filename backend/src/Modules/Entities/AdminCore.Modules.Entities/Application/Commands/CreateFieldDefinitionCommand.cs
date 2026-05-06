using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record CreateFieldDefinitionCommand(
    Guid TenantId,
    Guid EntityDefinitionId,
    string Name,
    string Slug,
    FieldType FieldType,
    bool IsRequired = false,
    bool IsSearchable = false,
    bool IsFilterable = false,
    string? DefaultValue = null,
    string? OptionsJson = null,
    string? ValidationJson = null
);

public class CreateFieldDefinitionHandler(EntitiesDbContext db)
{
    public async Task<FieldDefinitionDto> Handle(CreateFieldDefinitionCommand cmd, CancellationToken ct)
    {
        var entityExists = await db.EntityDefinitions
            .AnyAsync(e => e.Id == cmd.EntityDefinitionId && e.TenantId == cmd.TenantId, ct);
        if (!entityExists)
            throw new NotFoundException(nameof(EntityDefinition), cmd.EntityDefinitionId);

        var slugExists = await db.FieldDefinitions
            .AnyAsync(f => f.EntityDefinitionId == cmd.EntityDefinitionId && f.Slug == cmd.Slug, ct);
        if (slugExists)
            throw new ConflictException($"Field with slug '{cmd.Slug}' already exists in this entity.");

        var maxOrder = await db.FieldDefinitions
            .Where(f => f.EntityDefinitionId == cmd.EntityDefinitionId)
            .MaxAsync(f => (int?)f.DisplayOrder, ct) ?? -1;

        var field = new FieldDefinition
        {
            TenantId = cmd.TenantId,
            EntityDefinitionId = cmd.EntityDefinitionId,
            Name = cmd.Name,
            Slug = cmd.Slug,
            FieldType = cmd.FieldType,
            IsRequired = cmd.IsRequired,
            IsSearchable = cmd.IsSearchable,
            IsFilterable = cmd.IsFilterable,
            DisplayOrder = maxOrder + 1,
            DefaultValue = cmd.DefaultValue,
            OptionsJson = cmd.OptionsJson,
            ValidationJson = cmd.ValidationJson
        };

        db.FieldDefinitions.Add(field);
        await db.SaveChangesAsync(ct);

        return new FieldDefinitionDto(field.Id, field.Name, field.Slug, field.FieldType,
            field.IsRequired, field.IsSearchable, field.IsFilterable, field.DisplayOrder,
            field.DefaultValue, field.OptionsJson, field.ValidationJson);
    }
}
