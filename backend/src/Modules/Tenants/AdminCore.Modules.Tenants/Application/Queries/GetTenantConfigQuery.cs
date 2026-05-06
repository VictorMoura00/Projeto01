using AdminCore.Modules.Tenants.Application.DTOs;
using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Tenants.Application.Queries;

public record GetTenantConfigQuery(string Slug);

public class GetTenantConfigHandler(TenantsDbContext db)
{
    public async Task<TenantConfigDto> Handle(GetTenantConfigQuery q, CancellationToken ct)
    {
        var tenant = await db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Slug == q.Slug && t.IsActive, ct)
            ?? throw new NotFoundException("Tenant", q.Slug);

        return new TenantConfigDto(
            tenant.Slug, tenant.Name, tenant.LogoUrl, tenant.FaviconUrl,
            new TenantThemeDto(tenant.Theme.PrimaryColor, tenant.Theme.SecondaryColor,
                tenant.Theme.AccentColor, tenant.Theme.SurfaceColor, tenant.Theme.FontFamily));
    }
}
