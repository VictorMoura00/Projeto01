using AdminCore.Modules.Parameters.Domain;

namespace AdminCore.Modules.Parameters.Application.DTOs;

public record SystemParameterDto(
    Guid Id,
    string Key,
    string Value,
    ParameterType Type,
    string? Group,
    string? Description,
    ParameterScope Scope,
    bool IsReadOnly,
    DateTime CreatedAt
);
