namespace AdminCore.Modules.Entities.Application.DTOs;

public record EntityDataDto(
    Guid Id,
    Guid EntityDefinitionId,
    Guid TenantId,
    string Payload,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
