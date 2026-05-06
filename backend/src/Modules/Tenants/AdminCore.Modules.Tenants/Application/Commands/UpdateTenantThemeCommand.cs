using AdminCore.Modules.Tenants.Application.DTOs;
using AdminCore.Modules.Tenants.Domain;
using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Tenants.Application.Commands;

public record UpdateTenantThemeCommand(
    Guid TenantId,
    string PrimaryColor,
    string SecondaryColor,
    string AccentColor,
    string SurfaceColor,
    string FontFamily
);

public class UpdateTenantThemeHandler(TenantsDbContext db)
{
    public async Task<TenantDto> Handle(UpdateTenantThemeCommand cmd, CancellationToken ct)
    {
        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == cmd.TenantId, ct)
            ?? throw new NotFoundException("Tenant", cmd.TenantId);

        tenant.Theme = new TenantTheme
        {
            PrimaryColor = cmd.PrimaryColor,
            SecondaryColor = cmd.SecondaryColor,
            AccentColor = cmd.AccentColor,
            SurfaceColor = cmd.SurfaceColor,
            FontFamily = cmd.FontFamily
        };

        await db.SaveChangesAsync(ct);
        return CreateTenantHandler.ToDto(tenant);
    }
}
