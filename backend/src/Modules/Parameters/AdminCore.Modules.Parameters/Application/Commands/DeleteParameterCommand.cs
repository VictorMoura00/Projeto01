using AdminCore.Modules.Parameters.Infrastructure.Persistence;
using AdminCore.Modules.Parameters.Infrastructure.Services;
using AdminCore.Shared.Kernel.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace AdminCore.Modules.Parameters.Application.Commands;

public record DeleteParameterCommand(Guid? TenantId, Guid Id);

public class DeleteParameterHandler(ParametersDbContext db, ICachedParameterService? cache = null)
{
    public async Task Handle(DeleteParameterCommand cmd, CancellationToken ct)
    {
        var param = await db.Parameters
            .FirstOrDefaultAsync(p => p.Id == cmd.Id && p.TenantId == cmd.TenantId, ct)
            ?? throw new NotFoundException("Parameter", cmd.Id);

        if (param.IsReadOnly)
            throw new ForbiddenException("This parameter is read-only and cannot be deleted.");

        db.Parameters.Remove(param);
        await db.SaveChangesAsync(ct);
        cache?.Invalidate(cmd.TenantId, param.Key);
    }
}
