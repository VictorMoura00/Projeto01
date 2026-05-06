namespace AdminCore.Modules.Auth.Application.DTOs;

public record AuthResultDto(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    UserSessionDto User
);

public record UserSessionDto(
    Guid Id,
    Guid TenantId,
    string Email,
    string Name,
    IReadOnlyList<string> Roles
);

public record RegisteredUserDto(
    Guid Id,
    Guid TenantId,
    string Email,
    string Name
);
