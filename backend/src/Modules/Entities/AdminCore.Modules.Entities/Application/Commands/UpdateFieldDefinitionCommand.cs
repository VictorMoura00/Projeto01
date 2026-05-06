using AdminCore.Modules.Entities.Application.DTOs;
using AdminCore.Modules.Entities.Domain;
using AdminCore.Modules.Entities.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Entities.Application.Commands;

public record UpdateFieldDefinitionCommand(
    Guid TenantId,
    Guid EntityDefinitionId,
    Guid FieldId,
    string Name,
    FieldType FieldType,
    bool IsRequired,
    bool IsSearchable,
    bool IsFilterable,
    string? DefaultValue,
    string? OptionsJson,
    string? ValidationJson
);

public class UpdateFieldDefinitionHandler(EntitiesDbContext db)
{
    public async Task<FieldDefinitionDto> Handle(UpdateFieldDefinitionCommand cmd, CancellationToken ct)
    {
        var field = await db.FieldDefinitions
            .FirstOrDefaultAsync(f => f.Id == cmd.FieldId
                && f.EntityDefinitionId == cmd.EntityDefinitionId
                && f.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException(nameof(FieldDefinition), cmd.FieldId);

        field.Name = cmd.Name;
        field.FieldType = cmd.FieldType;
        field.IsRequired = cmd.IsRequired;
        field.IsSearchable = cmd.IsSearchable;
        field.IsFilterable = cmd.IsFilterable;
        field.DefaultValue = cmd.DefaultValue;
        field.OptionsJson = cmd.OptionsJson;
        field.ValidationJson = cmd.ValidationJson;
        field.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(ct);

        return new FieldDefinitionDto(field.Id, field.Name, field.Slug, field.FieldType,
            field.IsRequired, field.IsSearchable, field.IsFilterable, field.DisplayOrder,
            field.DefaultValue, field.OptionsJson, field.ValidationJson);
    }
}
