using AdminCore.Modules.Parameters.Application.Commands;
using AdminCore.Modules.Parameters.Application.DTOs;
using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Modules.Parameters.Infrastructure.Services;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Parameters.Application.Queries;

public record GetParameterByKeyQuery(Guid? TenantId, string Key);

public class GetParameterByKeyHandler(ParametersDbContext db, ICachedParameterService cache)
{
    public async Task<SystemParameterDto> Handle(GetParameterByKeyQuery q, CancellationToken ct)
    {
        return await cache.GetByKeyAsync(q.TenantId, q.Key, async () =>
        {
            var param = await db.Parameters
                .AsNoTracking()
                .OrderByDescending(p => p.TenantId == q.TenantId)
                .FirstOrDefaultAsync(p => p.Key == q.Key && (p.TenantId == q.TenantId || p.TenantId == null), ct);

            return param is null ? null : CreateParameterHandler.ToDto(param);
        }) ?? throw new NotFoundException("Parameter", q.Key);
    }
}
