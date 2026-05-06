using AdminCore.Modules.Tenants.Application.Commands;
using AdminCore.Modules.Tenants.Application.DTOs;
using AdminCore.Modules.Tenants.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Tenants.Application.Queries;

public record GetTenantByIdQuery(Guid Id);

public class GetTenantByIdHandler(TenantsDbContext db)
{
    public async Task<TenantDto> Handle(GetTenantByIdQuery q, CancellationToken ct)
    {
        var tenant = await db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == q.Id, ct)
            ?? throw new NotFoundException("Tenant", q.Id);

        return CreateTenantHandler.ToDto(tenant);
    }
}
