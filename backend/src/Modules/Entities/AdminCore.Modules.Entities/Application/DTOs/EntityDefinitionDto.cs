using AdminCore.Modules.Entities.Domain;

namespace AdminCore.Modules.Entities.Application.DTOs;

public record EntityDefinitionDto(
    Guid Id,
    string Name,
    string Slug,
    string? Description,
    string? Icon,
    bool IsActive,
    int DisplayOrder,
    int FieldCount,
    DateTime CreatedAt
);

public record FieldDefinitionDto(
    Guid Id,
    string Name,
    string Slug,
    FieldType FieldType,
    bool IsRequired,
    bool IsSearchable,
    bool IsFilterable,
    int DisplayOrder,
    string? DefaultValue,
    string? OptionsJson,
    string? ValidationJson
);
