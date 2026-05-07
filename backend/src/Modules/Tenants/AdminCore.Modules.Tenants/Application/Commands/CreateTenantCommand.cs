using AdminCore.Modules.Tenants.Application.DTOs;
using AdminCore.Modules.Tenants.Domain;
using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Tenants.Application.Commands;

public record CreateTenantCommand(string Name, string Slug);

public class CreateTenantHandler(TenantsDbContext db)
{
    public async Task<TenantDto> Handle(CreateTenantCommand cmd, CancellationToken ct)
    {
        var exists = await db.Tenants.AnyAsync(t => t.Slug == cmd.Slug, ct);
        if (exists)
            throw new ConflictException($"Tenant with slug '{cmd.Slug}' already exists.");

        var tenant = new Tenant { Name = cmd.Name, Slug = cmd.Slug };
        db.Tenants.Add(tenant);
        await db.SaveChangesAsync(ct);
        return ToDto(tenant);
    }

    internal static TenantDto ToDto(Tenant t) =>
        new(t.Id, t.Slug, t.Name, t.LogoUrl, t.FaviconUrl, t.IsActive,
            t.ConnectionString, t.DatabaseProvider,
            new TenantThemeDto(t.Theme.PrimaryColor, t.Theme.SecondaryColor,
                t.Theme.AccentColor, t.Theme.SurfaceColor, t.Theme.FontFamily),
            t.CreatedAt);
}
