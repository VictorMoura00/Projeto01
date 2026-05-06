namespace AdminCore.Modules.Access.Application.DTOs;

public record AppRoleDto(
    Guid Id,
    string Name,
    string? Description,
    bool IsSystemRole,
    bool IsActive,
    List<RolePermissionDto> Permissions,
    DateTime CreatedAt
);

public record RolePermissionDto(
    Guid Id,
    string EntitySlug,
    int Operations
);
