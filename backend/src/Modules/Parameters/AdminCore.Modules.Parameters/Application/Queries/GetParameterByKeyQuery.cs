using AdminCore.Modules.Parameters.Application.Commands;
using AdminCore.Modules.Parameters.Application.DTOs;
using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Parameters.Application.Queries;

public record GetParameterByKeyQuery(Guid? TenantId, string Key);

public class GetParameterByKeyHandler(ParametersDbContext db)
{
    public async Task<SystemParameterDto> Handle(GetParameterByKeyQuery q, CancellationToken ct)
    {
        var param = await db.Parameters
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Key == q.Key && (p.TenantId == q.TenantId || p.TenantId == null), ct)
            ?? throw new NotFoundException("Parameter", q.Key);

        return CreateParameterHandler.ToDto(param);
    }
}
