using AdminCore.Modules.Tenants.Application.DTOs;
using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Tenants.Application.Commands;

public record UpdateTenantCommand(Guid Id, string Name, string? LogoUrl, string? FaviconUrl, bool IsActive);

public class UpdateTenantHandler(TenantsDbContext db)
{
    public async Task<TenantDto> Handle(UpdateTenantCommand cmd, CancellationToken ct)
    {
        var tenant = await db.Tenants.FirstOrDefaultAsync(t => t.Id == cmd.Id, ct)
            ?? throw new NotFoundException("Tenant", cmd.Id);

        tenant.Name = cmd.Name;
        tenant.LogoUrl = cmd.LogoUrl;
        tenant.FaviconUrl = cmd.FaviconUrl;
        tenant.IsActive = cmd.IsActive;

        await db.SaveChangesAsync(ct);
        return CreateTenantHandler.ToDto(tenant);
    }
}
