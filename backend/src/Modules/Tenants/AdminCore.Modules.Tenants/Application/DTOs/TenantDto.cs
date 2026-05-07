namespace AdminCore.Modules.Tenants.Application.DTOs;

public record TenantDto(
    Guid Id,
    string Slug,
    string Name,
    string? LogoUrl,
    string? FaviconUrl,
    bool IsActive,
    string? ConnectionString,
    string? DatabaseProvider,
    TenantThemeDto Theme,
    DateTime CreatedAt
);

public record TenantThemeDto(
    string PrimaryColor,
    string SecondaryColor,
    string AccentColor,
    string SurfaceColor,
    string FontFamily
);

public record TenantConfigDto(
    string Slug,
    string Name,
    string? LogoUrl,
    string? FaviconUrl,
    TenantThemeDto Theme
);
